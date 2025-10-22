export function handleError(
  operation: string,
  modelName: string,
  error: unknown,
  id?: string
): { error: string; statusCode: number } {
  console.error(
    `Error ${operation} ${modelName}${id ? ` with ID ${id}` : ""}:`,
    error
  );

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check for specific error types
  if (
    errorMessage.toLowerCase().includes("not found") ||
    errorMessage.toLowerCase().includes("does not exist")
  ) {
    return {
      error: `${modelName}${id ? ` with ID: ${id}` : ""} not found`,
      statusCode: 404,
    };
  }

  if (
    errorMessage.toLowerCase().includes("validation") ||
    errorMessage.toLowerCase().includes("required") ||
    errorMessage.toLowerCase().includes("invalid")
  ) {
    return {
      error: `Validation failed: ${errorMessage}`,
      statusCode: 400,
    };
  }

  return {
    error: `Failed to ${operation} ${modelName}${id ? ` with ID: ${id}` : ""}`,
    statusCode: 500,
  };
}
