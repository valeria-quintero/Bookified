'use client';

import { Messages } from "@/types";
import { Mic } from "lucide-react";
import { useEffect, useRef } from "react";

type TranscriptProps = {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
};

const Transcript = ({
  messages,
  currentMessage,
  currentUserMessage
}: TranscriptProps) => {
  const messagesRef = useRef<HTMLDivElement>(null);
  const hasConversation =
    messages.length > 0 || currentMessage.length > 0 || currentUserMessage.length > 0;

  useEffect(() => {
    const container = messagesRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, currentMessage, currentUserMessage]);

  if (!hasConversation) {
    return (
      <section className="transcript-container">
        <div className="transcript-empty">
          <Mic size={48} strokeWidth={2} aria-hidden="true" />
          <p className="transcript-empty-text mt-5">No conversation yet</p>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="transcript-container" aria-label="Conversation transcript">
      <div className="transcript-messages" ref={messagesRef}>
        {messages.map((message, index) => {
          const isUser = message.role === "user";

          return (
            <div
              className={`transcript-message ${
                isUser
                  ? "transcript-message-user"
                  : "transcript-message-assistant"
              }`}
              key={`${message.role}-${index}`}
            >
              <div
                className={`transcript-bubble ${
                  isUser
                    ? "transcript-bubble-user"
                    : "transcript-bubble-assistant"
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        {currentUserMessage && (
          <div className="transcript-message transcript-message-user">
            <div className="transcript-bubble transcript-bubble-user">
              {currentUserMessage}
              <span className="transcript-cursor" aria-hidden="true" />
            </div>
          </div>
        )}
        {currentMessage && (
          <div className="transcript-message transcript-message-assistant">
            <div className="transcript-bubble transcript-bubble-assistant">
              {currentMessage}
              <span className="transcript-cursor" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Transcript;
