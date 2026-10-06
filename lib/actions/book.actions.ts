'use server';
import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";

export const  getAllBooks = async () => {
    try {
        await connectToDatabase();

        const books = await Book.find().sort({createdAt: -1}).lean();

        return {
            success: true,
            data: serializeData(books)
        }
    } catch (e) {
        console.error('Error connecting to database', e);
        return {
            success: false,
            error: e
        }
    }
}


const deleteBookBlobs = async (fileBlobKey: string, coverBlobKey?: string) => {
    const results = await Promise.allSettled([
        del(fileBlobKey),
        ...(coverBlobKey ? [del(coverBlobKey)] : []),
    ]);
    const errors = results.flatMap((result) => result.status === "rejected" ? [result.reason] : []);

    if (errors.length > 0) {
        errors.forEach((error) => console.error("Error deleting uploaded book blob:", error));
        throw new Error("Could not delete all uploaded book blobs");
    }
}

export const checkBookExists = async (title: string) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                success: false,
                error: "Unauthorized",
            }
        }

        await connectToDatabase();

        const slug = generateSlug(title);

        const existingBook = await Book.findOne({ clerkId: userId, slug }).lean();

        if (existingBook) {
            return {
                success: true,
                exists: true,
                book: serializeData(existingBook),
            }
        }
        return {
            success: true,
            exists: false,
        }

    } catch (e) {
        console.error("Error checking if book exists:", e);
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
        }
    }
}

export const createBook = async(data: CreateBook) => {
    let canCleanup = false;

    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                success: false,
                error: "Unauthorized",
            }
        }
        canCleanup = true;

        await connectToDatabase();

        const slug = generateSlug(data.title);

        const existingBook = await Book.findOne({ clerkId: userId, slug }).lean();

        if (existingBook) {
            await deleteBookBlobs(data.fileBlobKey, data.coverBlobKey);
            return {
                success: true,
                data: serializeData(existingBook),
                alreadyExists: true,
            }
        }   

        const book = await Book.create({...data, clerkId: userId, slug, totalSegments: 0 });
        return {
            success: true,
            data: serializeData(book),
        }
    } catch (e) {
        console.error("Error creating book:", e);
        if (canCleanup) {
            try {
                await deleteBookBlobs(data.fileBlobKey, data.coverBlobKey);
            } catch (cleanupError) {
                console.error("Error cleaning up blobs after book creation failed:", cleanupError);
            }
        }
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
        }
    }
}

export const saveBookSegments = async (bookId: string, segments: TextSegment[]) => {
    let userId: string | null = null;
    let ownsBook = false;
    let bookBlobKeys: { fileBlobKey: string; coverBlobKey?: string } | null = null;

    try {
        ({ userId } = await auth());
        if (!userId) {
            return {
                success: false,
                error: "Unauthorized",
            }
        }

        await connectToDatabase();

        const book = await Book.findOne({ _id: bookId, clerkId: userId });
        if (!book) {
            return {
                success: false,
                error: "Book not found or access denied",
            }
        }
        ownsBook = true;
        bookBlobKeys = {
            fileBlobKey: book.fileBlobKey,
            coverBlobKey: book.coverBlobKey,
        };

        console.log(`Saving book segments...`);

        const segmentsToInsert = segments.map(({ text, segmentIndex, pageNumber, wordCount}) => ({
            clerkId: userId,
            bookId,
            content: text, segmentIndex, pageNumber, wordCount
        }));

        await BookSegment.insertMany(segmentsToInsert);

        const updatedBook = await Book.findOneAndUpdate(
            { _id: bookId, clerkId: userId },
            { totalSegments: segments.length }
        );
        if (!updatedBook) {
            throw new Error("Book ownership changed before segments could be saved");
        }

        console.log((`Book segments saved successfully for bookId: ${bookId}.`));

        return {
            success: true,
            data: { segmentsCreated: segments.length }
        }

    } catch (e) {
        console.error("Error saving book segments:", e);

        if (ownsBook && userId) {
            const cleanupResults = await Promise.allSettled([
                BookSegment.deleteMany({ bookId, clerkId: userId }),
                Book.deleteOne({ _id: bookId, clerkId: userId }),
                ...(bookBlobKeys ? [
                    deleteBookBlobs(bookBlobKeys.fileBlobKey, bookBlobKeys.coverBlobKey),
                ] : []),
            ]);
            cleanupResults.forEach((result) => {
                if (result.status === "rejected") {
                    console.error("Error cleaning up failed book segment save:", result.reason);
                }
            });
        }

        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
        }
    }
}