"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ImagePlus, Trash2, Upload } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import LoadingOverlay from "@/components/LoadingOverlay"
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  DEFAULT_VOICE,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  voiceCategories,
  voiceOptions,
} from "@/lib/constants"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form"

const bookFormSchema = z.object({
  pdfFile: z
    .instanceof(File, { message: "Please upload a PDF file." })
    .refine((file) => ACCEPTED_PDF_TYPES.includes(file.type), "Please choose a PDF file.")
    .refine((file) => file.size <= MAX_FILE_SIZE, "The PDF must be 50MB or smaller."),
  coverImage: z
    .instanceof(File)
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "Choose a JPG, PNG, or WebP image.")
    .refine((file) => file.size <= MAX_IMAGE_SIZE, "The cover image must be 10MB or smaller.")
    .optional(),
  title: z.string().trim().min(1, "Enter the book title."),
  author: z.string().trim().min(1, "Enter the author name."),
  voice: z.enum(["dave", "daniel", "chris", "rachel", "sarah"]),
})

type BookFormValues = z.infer<typeof bookFormSchema>
type UploadFieldName = "pdfFile" | "coverImage"

const voiceDescriptions = {
  male: "Male Voices",
  female: "Female Voices",
}

function FileUploadField({
  file,
  kind,
  onSelect,
  onRemove,
}: {
  file: File | undefined
  kind: UploadFieldName
  onSelect: (file: File) => void
  onRemove: () => void
}) {
  const { controlId } = useFormField()
  const isPdf = kind === "pdfFile"
  const Icon = isPdf ? Upload : ImagePlus
  const inputId = controlId

  return (
    <div>
      <FormLabel className="form-label">
        {isPdf ? "Book PDF File" : "Cover Image (Optional)"}
      </FormLabel>
      <label
        htmlFor={inputId}
        className={`upload-dropzone${file ? " upload-dropzone-uploaded" : ""}`}
      >
        <FormControl>
          <input
            id={inputId}
            className="sr-only"
            type="file"
            accept={isPdf ? "application/pdf,.pdf" : "image/jpeg,image/png,image/webp"}
            onChange={(event) => {
              const selectedFile = event.target.files?.[0]
              if (selectedFile) onSelect(selectedFile)
              event.target.value = ""
            }}
          />
        </FormControl>
        {file ? (
          <>
            <Icon className="upload-dropzone-icon" aria-hidden="true" />
            <span className="upload-dropzone-text">{file.name}</span>
            <span className="upload-dropzone-hint">
              {isPdf ? "PDF file selected" : "Cover image selected"}
            </span>
          </>
        ) : (
          <>
            <Icon className="upload-dropzone-icon" aria-hidden="true" />
            <span className="upload-dropzone-text">
              {isPdf ? "Click to upload PDF" : "Click to upload cover image"}
            </span>
            <span className="upload-dropzone-hint">
              {isPdf ? "PDF file (max 50MB)" : "Leave empty to auto-generate from PDF"}
            </span>
          </>
        )}
      </label>
      {file && (
        <button
          className="upload-dropzone-remove mt-2"
          type="button"
          aria-label={`Remove ${isPdf ? "PDF" : "cover image"}: ${file.name}`}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span className="ml-1 text-sm">Remove</span>
        </button>
      )}
      <FormDescription className="sr-only">
        {isPdf ? "Choose a PDF file up to 50MB." : "Choose a cover image or leave empty."}
      </FormDescription>
    </div>
  )
}

export default function UploadForm() {
  const [showLoading, setShowLoading] = useState(false)
  const [submissionError, setSubmissionError] = useState<string>()
  const [pdfFile, setPdfFile] = useState<File>()
  const [coverImage, setCoverImage] = useState<File>()
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      voice: DEFAULT_VOICE,
    },
  })

  async function onSubmit() {
    setSubmissionError(undefined)
    setShowLoading(true)
    try {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 800))
      setSubmissionError("Book synthesis is not connected yet. Your files were not uploaded.")
    } finally {
      setShowLoading(false)
    }
  }

  return (
    <div className="new-book-wrapper">
      <Form {...form}>
        <form
          className="space-y-8"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <FormField
            control={form.control}
            name="pdfFile"
            render={() => (
              <FormItem>
                <FileUploadField
                  file={pdfFile}
                  kind="pdfFile"
                  onSelect={(file) => {
                    setPdfFile(file)
                    form.setValue("pdfFile", file, { shouldDirty: true, shouldValidate: true })
                  }}
                  onRemove={() => {
                    setPdfFile(undefined)
                    form.resetField("pdfFile")
                  }}
                />
                <FormMessage className="mt-2 text-sm text-red-700" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverImage"
            render={() => (
              <FormItem>
                <FileUploadField
                  file={coverImage}
                  kind="coverImage"
                  onSelect={(file) => {
                    setCoverImage(file)
                    form.setValue("coverImage", file, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  onRemove={() => {
                    setCoverImage(undefined)
                    form.setValue("coverImage", undefined, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                />
                <FormMessage className="mt-2 text-sm text-red-700" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Title</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    className="form-input"
                    type="text"
                    placeholder="ex: Rich Dad Poor Dad"
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage className="mt-2 text-sm text-red-700" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Author Name</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    className="form-input"
                    type="text"
                    placeholder="ex: Robert Kiyosaki"
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage className="mt-2 text-sm text-red-700" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="voice"
            render={({ field }) => (
              <FormItem>
                <fieldset className="space-y-3">
                  <legend className="form-label">Choose Assistant Voice</legend>
                  {(["male", "female"] as const).map((category) => (
                    <div className="space-y-2" key={category}>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {voiceDescriptions[category]}
                      </p>
                      <div
                        className={`voice-selector-options ${
                          category === "male"
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            : "grid-cols-1 sm:grid-cols-2"
                        }`}
                      >
                        {voiceCategories[category].map((voiceKey) => {
                          const voice = voiceOptions[voiceKey]
                          const selected = field.value === voiceKey

                          return (
                            <label
                              className={`voice-selector-option ${
                                selected
                                  ? "voice-selector-option-selected"
                                  : "voice-selector-option-default"
                              }`}
                              key={voiceKey}
                            >
                              <FormControl>
                                <input
                                  {...field}
                                  className="mt-0.5 accent-[#663820]"
                                  type="radio"
                                  id={`voice-${voiceKey}`}
                                  value={voiceKey}
                                  checked={selected}
                                  aria-label={`${voice.name}: ${voice.description}`}
                                />
                              </FormControl>
                              <span className="min-w-0">
                                <span className="block font-semibold text-[var(--text-primary)]">
                                  {voice.name}
                                </span>
                                <span className="mt-1 block text-xs leading-relaxed text-[var(--text-secondary)]">
                                  {voice.description}
                                </span>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </fieldset>
                <FormMessage className="mt-2 text-sm text-red-700" />
              </FormItem>
            )}
          />

          <button className="form-btn" type="submit" disabled={form.formState.isSubmitting}>
            Begin Synthesis
          </button>
          {submissionError && (
            <p className="text-sm text-red-700" role="alert">
              {submissionError}
            </p>
          )}
        </form>
      </Form>
      {showLoading && <LoadingOverlay />}
    </div>
  )
}
