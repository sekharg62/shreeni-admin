import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Placeholder from './pages/Placeholder'
import TagsPage from './pages/tags/TagsPage'
import ColorsPage from './pages/colors/ColorsPage'
import CollectionsPage from './pages/collections/CollectionsPage'
import CategoriesPage from './pages/categories/CategoriesPage'
import ProductsPage from './pages/products/ProductsPage'
import ProductEditorPage from './pages/products/ProductEditorPage'
import BannersPage from './pages/banners/BannersPage'
import HomePicksPage from './pages/home-picks/HomePicksPage'
import DiscountsPage from './pages/discounts/DiscountsPage'
import ReviewsPage from './pages/reviews/ReviewsPage'
import SupportPage from './pages/support/SupportPage'
import SupportTicketPage from './pages/support/SupportTicketPage'
import OrdersPage from './pages/orders/OrdersPage'
import OrderDetailPage from './pages/orders/OrderDetailPage'
import CustomersPage from './pages/customers/CustomersPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'

/**
 * Developer component showcase (sample data only). Development builds only: in production
 * `import.meta.env.DEV` is false, so Vite drops this import and the page is not shipped.
 */
const Components = import.meta.env.DEV ? lazy(() => import('./pages/Components')) : null

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected area — requires auth, rendered inside the admin layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {Components && (
            <Route
              path="/components"
              element={
                <Suspense fallback={null}>
                  <Components />
                </Suspense>
              }
            />
          )}

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
          <Route path="/home-picks" element={<HomePicksPage />} />

          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/:id" element={<SupportTicketRoute />} />

          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailRoute />} />
          <Route path="/customers" element={<CustomersPage />} />

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

/** A fresh order view per id (no open dialog carried over). */
function OrderDetailRoute() {
  const { id } = useParams()
  return <OrderDetailPage key={id} />
}

/** A fresh ticket view per id (no reply draft carried over). */
function SupportTicketRoute() {
  const { id } = useParams()
  return <SupportTicketPage key={id} />
}

export default App
