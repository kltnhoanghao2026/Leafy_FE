import { useState } from 'react'
import { z } from 'zod'
import { useRegisterStore } from '../../../store/registerStore'
import { useAuthStore } from '../../../store/authStore'

// Validation schema
const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^(0[2-9]|84[2-9])(\d{8})$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải đồng ý với điều khoản'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword']
})

export function useRegisterLogic () {
  const { formData, setFormData, agreedToTerms, setAgreedToTerms, isLoading, setIsLoading, reset } = useRegisterStore()
  const { setUser } = useAuthStore()

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ [name]: value })
    setError(null) // clear error on typing
  }

  const toggleAgreedToTerms = () => {
    setAgreedToTerms(!agreedToTerms)
    setError(null)
  }

  const register = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    setError(null)
    setSuccess(null)
    
    // Combine form data with checkbox state for validation
    const dataToValidate = {
      ...formData,
      agreedToTerms
    }

    const result = registerSchema.safeParse(dataToValidate)
    
    if (!result.success) {
      setError(result.error.issues[0].message)
      return { success: false }
    }

    setIsLoading(true)

    try {
      // Simulate API call with 1-second delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simulate a random failure for demonstration (e.g. Email already exists)
      if (formData.email === 'test@example.com') {
        throw new Error('Email đã được sử dụng')
      }

      // Hardcoded mock user for demonstration success
      const mockUser = {
        id: `user_${Math.floor(Math.random() * 10000)}`,
        name: formData.fullName || 'New User',
        email: formData.email,
        phone: formData.phone
      }

      setUser(mockUser)
      setSuccess('Đăng ký thành công!')
      reset() // clear form
      return { success: true }
    } catch (err: any) {
      console.error('Register error:', err)
      setError(err?.message || 'Đã xảy ra lỗi khi đăng ký')
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    agreedToTerms,
    handleChange,
    toggleAgreedToTerms,
    register,
    error,
    success,
    isLoading,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword
  }
}
