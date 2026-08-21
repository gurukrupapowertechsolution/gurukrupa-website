/**
 * errors/AppError.ts
 *
 * Sanitized error type for the API boundary. Per Document 5 §12 & §15,
 * error responses must never expose internal formulas, constants, or
 * stack traces to the client — only a stable error code and a safe,
 * human-readable message.
 */

export class AppError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AppError";
  }

  /** Shape safe to send directly in an API error response. */
  public toSanitizedResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}
