"use client"

import * as React from "react"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

type FormFieldContextValue = {
  name: FieldPath<FieldValues>
}

type FormItemContextValue = {
  id: string
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)
const FormItemContext = React.createContext<FormItemContextValue | null>(null)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  if (!fieldContext || !itemContext) {
    throw new Error("Form field components must be used inside FormField and FormItem.")
  }

  const fieldState = getFieldState(fieldContext.name, formState)

  return {
    ...fieldState,
    id: itemContext.id,
    controlId: `${itemContext.id}-control`,
    descriptionId: `${itemContext.id}-description`,
    messageId: `${itemContext.id}-message`,
  }
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={className} data-slot="form-item" {...props} />
    </FormItemContext.Provider>
  )
}

function FormLabel({ className, htmlFor, ...props }: React.ComponentProps<"label">) {
  const { controlId, invalid } = useFormField()

  return (
    <label
      className={className}
      data-slot="form-label"
      htmlFor={htmlFor ?? controlId}
      data-invalid={invalid || undefined}
      {...props}
    />
  )
}

function FormControl({
  children,
}: {
  children: React.ReactElement<{
    id?: string
    "aria-describedby"?: string
    "aria-invalid"?: boolean
  }>
}) {
  const { controlId, descriptionId, messageId, error } = useFormField()
  const describedBy = error ? `${descriptionId} ${messageId}` : descriptionId

  return React.cloneElement(children, {
    id: children.props.id ?? controlId,
    "aria-describedby": describedBy,
    "aria-invalid": Boolean(error),
  })
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { descriptionId } = useFormField()

  return <p className={className} id={descriptionId} data-slot="form-description" {...props} />
}

function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const { error, messageId } = useFormField()
  const body = error?.message ?? children

  if (!body) return null

  return (
    <p
      className={className}
      id={messageId}
      role={error ? "alert" : undefined}
      data-slot="form-message"
      {...props}
    >
      {body}
    </p>
  )
}

export {
  FormProvider as Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
}
