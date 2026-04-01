import { useState } from 'react'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useRegisterStore, setPendingEmailSession } from '../../../store/registerStore'
import { apiRegisterInit } from '../services/authApi'
import { mapAuthError } from '../services/authErrorMapper'

const registerSchema = z.object({
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
  const { formData, setFormData, agreedToTerms, setAgreedToTerms, isLoading, setIsLoading } = useRegisterStore()
  const navigate = useNavigate()

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ [name]: value })
    setError(null)
  }

  const toggleAgreedToTerms = () => {
    setAgreedToTerms(!agreedToTerms)
    setError(null)
  }

  const register = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    setError(null)
    setSuccess(null)

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
      await apiRegisterInit(
        formData.email || '',
        formData.phone || '',
        formData.password || ''
      )

      // Save pending email to sessionStorage and navigate to OTP page
      setPendingEmailSession(formData.email || '')
      setSuccess('Đăng ký thành công! Vui lòng kiểm tra email.')
      navigate('/verify-email')
      return { success: true }
    } catch (err: unknown) {
      console.error('Register error:', err)
      setError(mapAuthError(err))
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
