import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RoutePlaceholder } from './route-placeholder'
import { Button } from '../ui/button'

export const NotFoundPage = () => (
  <main className="flex min-h-screen items-center justify-center px-5 py-10">
    <div className="w-full max-w-xl">
      <RoutePlaceholder
        eyebrow="Route not found"
        title="This page is not available"
        description="The requested route does not match the current Stafflow placeholder scaffold."
        icon={AlertCircle}
      />
      <div className="mt-4">
        <Button asChild variant="outline">
          <Link to="/app/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  </main>
)
