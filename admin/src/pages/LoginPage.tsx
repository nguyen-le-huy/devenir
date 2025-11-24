import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { GalleryVerticalEnd } from "lucide-react"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  const navigate = useNavigate()
  const { token } = useAdminAuth()

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (token) {
      navigate('/admin', { replace: true })
    }
  }, [token, navigate])

  // Show login page - redirect will happen if token appears
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Hystudio Inc.
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
