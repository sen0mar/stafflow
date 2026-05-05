import { LogIn } from 'lucide-react'
import { RoutePlaceholder } from '@/shared/components/layout/route-placeholder'

export const LoginPage = () => (
  <main className="flex min-h-screen items-center justify-center px-5 py-10">
    <div className="w-full max-w-xl">
      <RoutePlaceholder
        eyebrow="Public route"
        title="Login"
        description="Sign-in form placeholder for seeded demo users and admin-created accounts. Public registration is intentionally not part of this route."
        icon={LogIn}
      />
    </div>
  </main>
)
