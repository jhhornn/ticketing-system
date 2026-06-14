/**
 * Common user interface for authenticated requests
 * Used in @CurrentUser() decorators across controllers
 */
export interface IAuthenticatedUser {
  id: string;
}

/**
 * Request object with authenticated user
 */
export interface IAuthenticatedRequest {
  user: IAuthenticatedUser;
}
