import { getBookBySlug } from "@/lib/actions/book.actions";
import { getVoice } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, BookOpen, Mic, MicOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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

  const { title, author, coverURL, persona } = result.data;
  const voice = getVoice(persona);

  return (
    <main className="book-page-container">
      <Link href="/" className="back-btn-floating" aria-label="Back to library">
        <ArrowLeft size={20} aria-hidden="true" />
      </Link>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="vapi-header-card flex-col items-start sm:flex-row sm:items-center">
          <div className="vapi-cover-wrapper">
            {coverURL ? (
              <Image
                src={coverURL}
                alt={`Cover of ${title}`}
                width={130}
                height={195}
                className="vapi-cover-image"
                priority
              />
            ) : (
              <div
                className="vapi-cover-image flex items-center justify-center bg-[#e8d9bc]"
                role="img"
                aria-label={`Cover unavailable for ${title}`}
              >
                <BookOpen size={40} aria-hidden="true" />
              </div>
            )}
            <div className="vapi-mic-wrapper">
              <button
                type="button"
                className="vapi-mic-btn"
                aria-label="Microphone controls are not available yet"
                title="Voice controls coming soon"
              >
                <MicOff size={20} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold leading-tight text-[#212a3b] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-base text-[var(--text-secondary)]">by {author}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="vapi-status-indicator rounded-full">
                <span className="vapi-status-dot vapi-status-dot-ready" aria-hidden="true" />
                <span className="vapi-status-text">Ready</span>
              </div>
              <span className="vapi-badge-ai rounded-full">
                <span className="vapi-badge-ai-text">Voice: {voice.name}</span>
              </span>
              <span className="vapi-badge-ai rounded-full">
                <span className="vapi-badge-ai-text">0:00/15:00</span>
              </span>
            </div>
          </div>
        </section>

        <section className="transcript-container">
          <div className="transcript-empty">
            <Mic size={48} strokeWidth={2} aria-hidden="true" />
            <p className="transcript-empty-text mt-5">No conversation yet</p>
            <p className="transcript-empty-hint">
              Click the mic button above to start talking
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
