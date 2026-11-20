/** Auth domain types. */

/** Credentials for signup. */
export interface SignupInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  timezone?: string;
  locale?: string;
}

/** Credentials for login. */
export interface LoginInput {
  email: string;
  password: string;
}

/** What a successful auth call returns. */
export interface AuthResult {
  token: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

/** Decoded JWT payload. */
export interface AuthPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/** Refresh-token request. */
export interface RefreshInput {
  token: string;
}
