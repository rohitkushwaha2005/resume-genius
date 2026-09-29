/** An error whose message is safe to show to the user. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class AIUnavailableError extends HttpError {
  constructor(message = 'The AI service is temporarily unavailable. Please try again in a moment.') {
    super(503, 'AI_UNAVAILABLE', message);
  }
}
