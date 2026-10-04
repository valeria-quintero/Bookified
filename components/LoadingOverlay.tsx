"use client"

import { LoaderCircle } from "lucide-react"

export default function LoadingOverlay() {
  return (
    <div className="loading-wrapper" role="dialog" aria-modal="true" aria-labelledby="loading-title">
      <div className="loading-shadow-wrapper auth-shadow">
        <div className="loading-shadow">
          <LoaderCircle className="loading-animation h-12 w-12 text-[#663820]" aria-hidden="true" />
          <h2 className="loading-title" id="loading-title">
            Preparing your book...
          </h2>
          <p className="text-center text-[var(--text-secondary)]">
            Please wait a moment.
          </p>
        </div>
      </div>
    </div>
  )
}
