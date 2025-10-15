export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationalUnit: {
    id: string;
    name: string;
  };
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
