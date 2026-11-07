import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Components from './pages/Components'
import Placeholder from './pages/Placeholder'
import TagsPage from './pages/tags/TagsPage'
import ColorsPage from './pages/colors/ColorsPage'
import CollectionsPage from './pages/collections/CollectionsPage'
import CategoriesPage from './pages/categories/CategoriesPage'
import ProductsPage from './pages/products/ProductsPage'
import ProductEditorPage from './pages/products/ProductEditorPage'
import BannersPage from './pages/banners/BannersPage'
import DiscountsPage from './pages/discounts/DiscountsPage'
import ReviewsPage from './pages/reviews/ReviewsPage'
import SupportPage from './pages/support/SupportPage'
import SupportTicketPage from './pages/support/SupportTicketPage'
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

          {/* Catalog */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<ProductEditorPage key="new" />} />
          <Route path="/products/:id" element={<ProductEditorRoute />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/colors" element={<ColorsPage />} />

          {/* Marketing */}
          <Route path="/discounts" element={<DiscountsPage />} />
          <Route path="/banners" element={<BannersPage />} />

          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/:id" element={<SupportTicketRoute />} />

          {/* Phase 2 */}
          <Route path="/orders" element={<Placeholder title="Orders" />} />
          <Route path="/customers" element={<Placeholder title="Customers" />} />

          <Route path="/settings" element={<Placeholder title="Settings" />} />
          <Route path="/settings/profile" element={<Placeholder title="Profile" />} />
          <Route path="*" element={<Placeholder />} />
        </Route>
      </Route>
    </Routes>
  )
}

/** A fresh editor per product id (no state carried over from /products/new). */
function ProductEditorRoute() {
  const { id } = useParams()
  return <ProductEditorPage key={id} id={id} />
}

/** A fresh ticket view per id (no reply draft carried over). */
function SupportTicketRoute() {
  const { id } = useParams()
  return <SupportTicketPage key={id} />
}

export default App
