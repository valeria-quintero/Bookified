import VapiControls from "@/components/VapiControls";
import { getBookBySlug } from "@/lib/actions/book.actions";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BookPage({params}: {params: Promise<{ slug: string }>}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success) {
    throw new Error(result.error);
  }

  if (!result.data) {
    redirect("/");
  }

  return (
    <main className="book-page-container">
      <Link href="/" className="back-btn-floating" aria-label="Back to library">
        <ArrowLeft size={20} aria-hidden="true" />
      </Link>

      <VapiControls book={result.data} />
    </main>
  );
}
