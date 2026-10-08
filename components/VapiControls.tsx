'use client';

import useVapi from "@/hooks/useVapi";
import { getVoice } from "@/lib/utils";
import Transcript from "@/components/Transcript";
import { BookOpen, Mic, MicOff } from "lucide-react";
import Image from "next/image";
import type { IBook } from "@/types";
import Link from "next/link";
import { formatDuration } from "@/lib/utils";
import { useUserPlan } from "@/lib/subscription.client";
import type { CallStatus } from "@/hooks/useVapi";

const statusDisplay: Record<CallStatus, { label: string; className: string }> = {
  idle: { label: "Ready", className: "ready" },
  connecting: { label: "Connecting", className: "connecting" },
  starting: { label: "Starting", className: "connecting" },
  listening: { label: "Listening", className: "listening" },
  thinking: { label: "Thinking", className: "thinking" },
  speaking: { label: "Speaking", className: "speaking" },
};

const VapiControls = ({
  book,
}: {
  book: Pick<IBook, "_id" | "title" | "author" | "coverURL" | "persona">;
}) => {
  const { status, isActive, messages, currentMessage, currentUserMessage, duration, maxDurationMinutes: startedSessionLimit, limitError, start, stop, clearErrors } = useVapi(book);
  const { isLoaded, limits } = useUserPlan();
  const { title, author, coverURL, persona } = book;
  const voice = getVoice(persona);
  const maxDurationMinutes = startedSessionLimit ?? (isLoaded ? limits?.maxSessionMinutes : null);
  const visibleStatus = statusDisplay[status];

  return (
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
            {isActive && (status === "thinking" || status === "speaking") && (
              <span className="vapi-pulse-ring" aria-hidden="true" />
            )}
            <button
              onClick={isActive ? stop : start}
              disabled={status === "connecting"}
              type="button"
              className={`vapi-mic-btn ${isActive ? "vapi-mic-btn-active" : "vapi-mic-btn-inactive"}`}
              aria-label={isActive ? "Stop voice session" : "Start voice session"}
              title={isActive ? "Stop voice session" : "Start voice session"}
            >
              {isActive ? (
                <Mic size={20} aria-hidden="true" />
              ) : (
                <MicOff size={20} aria-hidden="true" />
              )}
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
              <span className={`vapi-status-dot vapi-status-dot-${visibleStatus.className}`} aria-hidden="true" />
              <span className="vapi-status-text">{visibleStatus.label}</span>
            </div>
            <span className="vapi-badge-ai rounded-full">
              <span className="vapi-badge-ai-text">Voice: {voice.name}</span>
            </span>
            <span className="vapi-badge-ai rounded-full">
              <span className="vapi-badge-ai-text">
                {formatDuration(duration)}/{maxDurationMinutes ? formatDuration(maxDurationMinutes * 60) : "--:--"}
              </span>
            </span>
          </div>
        </div>
      </section>

      {limitError && (
        <p className="error-banner text-sm text-red-700" role="alert">
          {limitError}{" "}
          <Link className="font-semibold underline" href="/subscriptions">
            View plans
          </Link>
          <button
            className="ml-3 underline"
            type="button"
            onClick={clearErrors}
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </p>
      )}

      <div className="vapi-transcript-wrapper">
        <Transcript
          messages={messages}
          currentMessage={currentMessage}
          currentUserMessage={currentUserMessage}
        />
      </div>
    </div>
  );
};

export default VapiControls;