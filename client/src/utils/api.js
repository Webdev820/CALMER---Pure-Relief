import axios from 'axios'

/* In production set VITE_API_URL (e.g. https://api.yourdomain.com) on Netlify.
   When unset, the app uses same-origin /api (works with the Vite dev proxy
   and with any host that serves the API on the same domain). */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const api = axios.create({ baseURL: `${API_BASE}/api` })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('calmer_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && !err.config.url.includes('/auth/')) {
    // Session expired — send admins to the ADMIN portal, not the client login
    let wasAdmin = false
    try { wasAdmin = JSON.parse(localStorage.getItem('calmer_user'))?.role === 'admin' } catch { }
    localStorage.removeItem('calmer_token')
    localStorage.removeItem('calmer_user')
    window.location.href = wasAdmin ? '/admin-login' : '/login'
  }
  if (!err.response) err.friendly = 'Network issue — check your connection and try again'
  return Promise.reject(err)
})

export default api
