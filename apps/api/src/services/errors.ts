/** Typed application error with an HTTP status and machine-readable code. */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  emailTaken: () => new AppError('EMAIL_TAKEN', 'An account with this email already exists.', 409),
  invalidCredentials: () =>
    new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401),
  userNotFound: () => new AppError('USER_NOT_FOUND', 'User not found.', 404),
  chartNotFound: () => new AppError('CHART_NOT_FOUND', 'Chart not found.', 404),
  invalidBirthDate: () =>
    new AppError('INVALID_BIRTH_DATE', 'birthDate must be a valid ISO date (YYYY-MM-DD).', 400),
  weakPassword: () =>
    new AppError(
      'WEAK_PASSWORD',
      'Password must be at least 8 characters with a letter and a number.',
      400
    ),
  invalidEmail: () => new AppError('INVALID_EMAIL', 'Enter a valid email address.', 400),
  aiUnavailable: () =>
    new AppError('AI_UNAVAILABLE', 'Lyra is unavailable right now. Try again shortly.', 503),
};
