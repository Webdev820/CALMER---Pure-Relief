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
    localStorage.removeItem('calmer_token')
    localStorage.removeItem('calmer_user')
    window.location.href = '/login'
  }
  return Promise.reject(err)
})

export default api
