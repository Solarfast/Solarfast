export function getCalculationErrorMessage(error, copy) {
  const status = error?.response?.status

  if (status === 403) return copy.licenseError
  if (status === 422) return copy.inputError
  if (status >= 500) return copy.serverError
  if (error?.isAxiosError && !error.response) return copy.connectionError
  if (error instanceof Error && error.message) return error.message
  return copy.error
}
