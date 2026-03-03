import axios from 'axios'

const FALLBACK_API_BASE_URL = 'https://municipal-backend-3dc6.onrender.com/api'
const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()

const toApiBaseUrl = (rawValue) => {
  if (!rawValue) return FALLBACK_API_BASE_URL

  const trimmed = rawValue.replace(/\/$/, '')
  const looksAbsolute = /^https?:\/\//i.test(trimmed)
  const withApiPath = /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`

  // Guard against misconfiguration where frontend URL is used as API URL.
  if (
    looksAbsolute &&
    typeof window !== 'undefined' &&
    (() => {
      try {
        return new URL(trimmed).origin === window.location.origin
      } catch {
        return false
      }
    })()
  ) {
    return FALLBACK_API_BASE_URL
  }

  return withApiPath
}

const API_BASE_URL = toApiBaseUrl(RAW_API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url || '').includes('/auth/refresh/')
    ) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })

          const tokenPayload = response.data?.tokens || response.data || {}
          const access = tokenPayload.access
          const refresh = tokenPayload.refresh || refreshToken

          if (!access) {
            throw new Error('Refresh endpoint did not return access token')
          }

          localStorage.setItem('access_token', access)
          localStorage.setItem('refresh_token', refresh)

          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
