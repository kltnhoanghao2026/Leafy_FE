export interface LoginCredentials {
  identifier: string
  password: string
}

export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface RegisterFormInputs {
  fullName: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  agreedToTerms: boolean
}

export interface RegisterResponse {
  user: User
  token: string
}
