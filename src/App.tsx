import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Components from './pages/Components'
import Placeholder from './pages/Placeholder'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected area — requires auth, rendered inside the admin layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/components" element={<Components />} />
          <Route path="/products" element={<Placeholder title="Products" />} />
          <Route
            path="/categories"
            element={<Placeholder title="Categories" />}
          />
          <Route
            path="/inventory"
            element={<Placeholder title="Inventory" />}
          />
          <Route path="/orders" element={<Placeholder title="Orders" />} />
          <Route
            path="/customers"
            element={<Placeholder title="Customers" />}
          />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
          <Route
            path="/settings/profile"
            element={<Placeholder title="Profile" />}
          />
          <Route path="*" element={<Placeholder />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
