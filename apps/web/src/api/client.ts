import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import router from '@/router'

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) config.headers.Authorization = `Bearer ${auth.accessToken}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true
      const auth = useAuthStore()
      await auth.refresh()
      if (!auth.isLoggedIn) { router.push({ name: 'login' }); return Promise.reject(err) }
      err.config.headers.Authorization = `Bearer ${auth.accessToken}`
      return apiClient(err.config)
    }
    return Promise.reject(err)
  },
)
