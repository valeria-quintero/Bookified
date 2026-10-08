import BookCard from "@/components/BookCard";
import HeroSection from "@/components/HeroSection";
import { getAllBooks } from "@/lib/actions/book.actions";
import { escapeRegex } from "@/lib/utils";
import { Search } from "lucide-react";

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ query?: string | string[] }>
}) {
  const searchParamsValue = await searchParams;
  const query = typeof searchParamsValue.query === "string" ? searchParamsValue.query.trim() : "";
  const bookResults = await getAllBooks();
  const books = bookResults.success ? bookResults.data ?? [] : [];
  const searchPattern = query ? new RegExp(escapeRegex(query), "i") : null;
  const filteredBooks = searchPattern
    ? books.filter((book) => searchPattern.test(book.title) || searchPattern.test(book.author))
    : books;

  return (
    <main className="wrapper container">
      <HeroSection />

      <div className="library-books-header">
        <h2 className="library-books-heading">Recent books</h2>
        <form action="/" className="library-search-wrapper" role="search">
          <label className="sr-only" htmlFor="book-search">Search books by title or author</label>
          <input
            className="library-search-input"
            id="book-search"
            name="query"
            placeholder="Search by title or author"
            type="search"
            defaultValue={query}
          />
          <button className="library-search-button" type="submit" aria-label="Search books">
            <Search aria-hidden="true" size={18} />
          </button>
        </form>
      </div>

      <div className="library-books-grid">
        {filteredBooks.map((book) => (
          <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug} />
        ))}
      </div>
      {query && filteredBooks.length === 0 && (
        <p className="library-search-empty">No books found for &quot;{query}&quot;.</p>
      )}
    </main>
  );
}
