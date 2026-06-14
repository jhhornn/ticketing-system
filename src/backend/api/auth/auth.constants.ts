export const AUTH_ACTIONS = {
  register: 'register',
  login: 'login',
} as const;

export const AUTH_METADATA_KEYS = {
  roles: 'roles',
} as const;

export const AUTH_ERROR_MESSAGES = {
  userAlreadyExists: 'User with this email already exists',
  invalidCredentials: 'Invalid credentials',
} as const;

export const AUTH_FAILURE_REASONS = {
  userNotFound: 'user_not_found',
  invalidPassword: 'invalid_password',
  emailAlreadyExists: 'email_already_exists',
} as const;

export const AUTH_SWAGGER_MESSAGES = {
  registerSuccess: 'User registered successfully',
  loginSuccess: 'User logged in successfully',
  profileSuccess: 'Profile retrieved successfully',
  unauthorized: 'Unauthorized',
} as const;

export const AUTH_GUARD_MESSAGES = {
  userNotAuthenticated: 'User not authenticated',
  superAdminAccessRequired: 'Super admin access required',
  eventIdNotProvided: 'Event ID not provided',
  noPermissionToManageEvent: 'You do not have permission to manage this event',
} as const;
