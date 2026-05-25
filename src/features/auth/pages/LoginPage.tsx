import { LoginHero } from '../components/LoginHero'
import { LoginForm } from '../components/LoginForm'

export function LoginPage () {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50/50">
      <div className="flex flex-col lg:flex-row w-full max-w-[960px] bg-white rounded-[2rem] shadow-2xl shadow-[#245A34]/5 overflow-hidden">
        <LoginHero />
        <LoginForm />
      </div>
    </div>
  )
}

export default LoginPage
