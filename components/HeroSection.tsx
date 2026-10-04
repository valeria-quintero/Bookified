import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const gettingStartedSteps = [
  {
    title: "Upload PDF",
    description: "Add your book file",
  },
  {
    title: "AI Processing",
    description: "We analyze the content",
  },
  {
    title: "Voice Chat",
    description: "Discuss with AI",
  },
];

export default function HeroSection() {
    return (
      <section className="library-hero-card wrapper pt-28 mb-10 md:mb-16" aria-labelledby="library-title">
        <div className="library-hero-content">
          <div className="library-hero-text">
            <h1 className="library-hero-title" id="library-title">
              Your Library
            </h1>
            <p className="library-hero-description">
              Convert your books into interactive AI conversations. Listen,
              learn, and discuss your favorite reads.
            </p>
            <Link className="library-cta-primary" href="/books/new">
              <Plus aria-hidden="true" size={22} strokeWidth={2} />
              <span>Add new book</span>
            </Link>
          </div>

          <div className="library-hero-illustration">
            <Image
              src="/assets/Gemini_Generated_Image_jlix6fjlix6fjlix%20(1)%201.png"
              alt="Vintage books, an open book, a globe, and a brass reading lamp"
              width={426}
              height={345}
              priority
              className="library-hero-image"
            />
          </div>

          <ol className="library-steps-card" aria-label="How it works">
            {gettingStartedSteps.map(({ title, description }, index) => (
              <li className="library-step-item" key={title}>
                <span className="library-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="library-step-copy">
                  <h2 className="library-step-title">{title}</h2>
                  <p className="library-step-description">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
}