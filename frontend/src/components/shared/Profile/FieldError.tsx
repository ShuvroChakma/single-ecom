/**
 * Shared Field Error Component
 * Displays client-side or server-side validation errors
 */

interface FieldErrorProps {
  field: {
    state: {
      meta: {
        isTouched: boolean
        errors: string[]
      }
    }
  }
  serverError?: string
}

export function FieldError({ field, serverError }: FieldErrorProps) {
  const clientErrors =
    field.state.meta.isTouched && field.state.meta.errors.length
      ? field.state.meta.errors.join(', ')
      : null

  const errorMessage = serverError || clientErrors

  return errorMessage ? (
    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
  ) : null
}
