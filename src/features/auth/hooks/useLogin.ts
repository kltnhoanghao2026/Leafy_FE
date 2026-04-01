import { useState } from 'react'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import { apiLogin } from '../services/authApi'
import { mapAuthError } from '../services/authErrorMapper'
import type { LoginCredentials } from '../types'

const loginSchema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
})

export function useLogin () {
  const { setIsLoading, setTokens, setRememberMe } = useAuthStore()
  const navigate = useNavigate()
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
      const response = await apiLogin(credentials.email, credentials.password)

      if (response.data) {
        setTokens(response.data.accessToken, response.data.refreshToken)
        setRememberMe(rememberMe)
        navigate('/dashboard')
        return { success: true }
      }

      setError('Đã xảy ra lỗi khi đăng nhập')
      return { success: false }
    } catch (err) {
      console.error('Login error:', err)
      setError(mapAuthError(err))
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  return { login, error }
}
