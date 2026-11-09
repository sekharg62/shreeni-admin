/**
 * Every backend route the admin calls, in one place.
 * Relative to VITE_API_BASE_URL (apiClient adds the base).
 */
export const ENDPOINTS = {
  auth: {
    login: '/admin/auth/login',
  },

  categories: {
    root: '/admin/categories',
    tree: '/admin/categories/tree',
    reorder: '/admin/categories/reorder',
    byId: (id: string) => `/admin/categories/${id}`,
    status: (id: string) => `/admin/categories/${id}/status`,
    banner: (id: string) => `/admin/categories/${id}/banner`,
    poster: (id: string) => `/admin/categories/${id}/poster`,
  },

  products: {
    root: '/admin/products',
    bulkStatus: '/admin/products/status',
    byId: (id: string) => `/admin/products/${id}`,
    status: (id: string) => `/admin/products/${id}/status`,

    images: (productId: string) => `/admin/products/${productId}/images`,
    imagesUpload: (productId: string) => `/admin/products/${productId}/images/upload`,
    imagesReorder: (productId: string) => `/admin/products/${productId}/images/reorder`,
    imageById: (productId: string, id: string) => `/admin/products/${productId}/images/${id}`,
    imagePrimary: (productId: string, id: string) => `/admin/products/${productId}/images/${id}/primary`,

    variants: (productId: string) => `/admin/products/${productId}/variants`,
    variantById: (productId: string, id: string) => `/admin/products/${productId}/variants/${id}`,
    variantStatus: (productId: string, id: string) =>
      `/admin/products/${productId}/variants/${id}/status`,

    specifications: (productId: string) => `/admin/products/${productId}/specifications`,
    specificationsReorder: (productId: string) =>
      `/admin/products/${productId}/specifications/reorder`,
    specificationById: (productId: string, id: string) =>
      `/admin/products/${productId}/specifications/${id}`,

    tags: (productId: string) => `/admin/products/${productId}/tags`,
    tagById: (productId: string, tagId: string) => `/admin/products/${productId}/tags/${tagId}`,

    collections: (productId: string) => `/admin/products/${productId}/collections`,
    collectionById: (productId: string, collectionId: string) =>
      `/admin/products/${productId}/collections/${collectionId}`,

    colors: (productId: string) => `/admin/products/${productId}/colors`,

    related: (productId: string) => `/admin/products/${productId}/related`,
    relatedById: (productId: string, relatedProductId: string) =>
      `/admin/products/${productId}/related/${relatedProductId}`,
  },

  tags: {
    root: '/admin/tags',
    byId: (id: string) => `/admin/tags/${id}`,
  },

  colors: {
    root: '/admin/colors',
    byId: (id: string) => `/admin/colors/${id}`,
  },

  collections: {
    root: '/admin/collections',
    byId: (id: string) => `/admin/collections/${id}`,
    status: (id: string) => `/admin/collections/${id}/status`,
  },

  discounts: {
    root: '/admin/discounts',
    byId: (id: string) => `/admin/discounts/${id}`,
    status: (id: string) => `/admin/discounts/${id}/status`,
  },

  banners: {
    root: '/admin/banners',
    reorder: '/admin/banners/reorder',
    byId: (id: string) => `/admin/banners/${id}`,
    status: (id: string) => `/admin/banners/${id}/status`,
  },

  reviews: {
    root: '/admin/reviews',
    counts: '/admin/reviews/counts',
    bulkStatus: '/admin/reviews/status',
    byId: (id: string) => `/admin/reviews/${id}`,
    status: (id: string) => `/admin/reviews/${id}/status`,
  },

  orders: {
    root: '/admin/orders',
    /** per-status counts + today's orders/revenue */
    counts: '/admin/orders/counts',
    byId: (id: string) => `/admin/orders/${id}`,
    status: (id: string) => `/admin/orders/${id}/status`,
  },
  customers: {
    root: '/admin/customers',
    /** saved addresses + latest orders */
    byId: (id: string) => `/admin/customers/${id}`,
  },
  support: {
    root: '/admin/support-tickets',
    counts: '/admin/support-tickets/counts',
    byId: (id: string) => `/admin/support-tickets/${id}`,
    messages: (id: string) => `/admin/support-tickets/${id}/messages`,
    status: (id: string) => `/admin/support-tickets/${id}/status`,
  },

  uploads: {
    /** DELETE with { url } — discard an unused upload. */
    root: '/admin/uploads',
    banner: '/admin/uploads/banner',
  },
} as const
