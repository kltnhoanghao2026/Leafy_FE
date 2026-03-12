import { useState } from 'react'
import { z } from 'zod'
import { useAuthStore } from '../../../store/authStore'
import type { LoginCredentials } from '../types.ts'

// Zod schema for Vietnamese Phone (e.g., 0xxxxxxxxx) or Email
const loginSchema = z.object({
  identifier: z.string().refine((val) => {
    const isEmail = z.string().email().safeParse(val).success
    const isPhone = /^(0[2-9]|84[2-9])(\d{8})$/.test(val)
    return isEmail || isPhone
  }, {
    message: 'Vui lòng nhập email hoặc số điện thoại hợp lệ'
  }),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
})

export function useLogin () {
  const { setIsLoading, setUser, setRememberMe } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const login = async (credentials: LoginCredentials, rememberMe: boolean) => {
    setError(null)
    
    // Validate inputs
    const result = loginSchema.safeParse(credentials)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return { success: false }
    }

    setIsLoading(true)

    try {
      // Simulate API call with 1-second delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Hardcoded mock user for demonstration
      const mockUser = {
        id: 'user_123',
        name: 'Nguyen Van A',
        email: credentials.identifier.includes('@') ? credentials.identifier : undefined,
        phone: credentials.identifier.includes('@') ? undefined : credentials.identifier
      }

      setUser(mockUser)
      setRememberMe(rememberMe)
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      setError('Đã xảy ra lỗi khi đăng nhập')
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  return { login, error }
}
