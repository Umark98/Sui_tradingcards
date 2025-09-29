import Dashboard from "@/components/Dashboard"
import ProtectedRoute from "@/components/ProtectedRoute"

const HOME = () => {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}

export default HOME