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
