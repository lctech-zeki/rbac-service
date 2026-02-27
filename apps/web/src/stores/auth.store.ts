import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/api/client'
import type { TokenResponse } from '@rbac/shared'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))

  const isLoggedIn = computed(() => !!accessToken.value)

  async function login(email: string, password: string) {
    const res = await apiClient.post<{ data: TokenResponse }>('/auth/login', { email, password })
    setTokens(res.data.data)
  }

  async function logout() {
    try { await apiClient.post('/auth/logout', {}) } catch { /* ignore */ }
    clearTokens()
  }

  async function refresh() {
    if (!refreshToken.value) { clearTokens(); return }
    try {
      const res = await apiClient.post<{ data: Pick<TokenResponse, 'accessToken' | 'expiresIn'> }>(
        '/auth/refresh', { refreshToken: refreshToken.value },
      )
      accessToken.value = res.data.data.accessToken
      localStorage.setItem('access_token', res.data.data.accessToken)
    } catch {
      clearTokens()
    }
  }

  function setTokens(tokens: TokenResponse) {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
    localStorage.setItem('access_token', tokens.accessToken)
    localStorage.setItem('refresh_token', tokens.refreshToken)
  }

  function clearTokens() {
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  return { accessToken, isLoggedIn, login, logout, refresh }
})
