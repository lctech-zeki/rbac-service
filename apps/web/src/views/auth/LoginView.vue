<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'

const router = useRouter()
const auth = useAuthStore()
const themeStore = useThemeStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const isDev = import.meta.env.DEV

onMounted(() => {
  themeStore.initTheme()
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch {
    error.value = '登入資訊錯誤'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-bg-primary grid-bg p-4 sm:p-6">
    <!-- Theme toggle -->
    <button 
      @click="themeStore.toggleTheme"
      class="absolute top-4 sm:top-5 right-4 sm:right-5 p-2.5 text-text-muted hover:text-accent hover:bg-accent-subtle rounded-lg transition-all duration-200"
      :title="themeStore.theme === 'dark' ? '切換至淺色模式' : '切換至深色模式'"
    >
      <span v-if="themeStore.theme === 'dark'" class="i-lucide-sun text-lg"></span>
      <span v-else class="i-lucide-moon text-lg"></span>
    </button>
    
    <!-- Decorative elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-accent/8 rounded-full blur-[80px] sm:blur-[120px]"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-accent/5 rounded-full blur-[60px] sm:blur-[100px]"></div>
    </div>
    
    <div class="w-full max-w-md px-4 sm:px-0 relative">
      <!-- Logo -->
      <div class="text-center mb-6 sm:mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mb-3 sm:mb-4 bg-accent/10 border border-accent/30 rounded-2xl">
          <span class="text-accent font-mono text-xl sm:text-2xl font-bold">RB</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-tight">權限管理系統</h1>
        <p class="text-text-muted mt-1 sm:mt-2 text-sm">請登入以存取管理儀表板</p>
      </div>
      
      <!-- Login card -->
      <div class="bg-bg-surface/80 backdrop-blur-xl border border-border-subtle p-6 sm:p-8 rounded-2xl shadow-xl">
        <form @submit.prevent="submit" class="space-y-5">
          <div v-if="isDev" class="p-3 bg-accent-subtle border border-accent/20 rounded-lg">
            <p class="text-xs text-accent font-mono">
              <span class="text-accent/70">開發環境：</span> admin@example.com / admin
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-text-secondary mb-2">電子郵件</label>
            <input 
              v-model="email" 
              type="email" 
              required
              placeholder="you@company.com"
              class="input-base"
            />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-text-secondary mb-2">密碼</label>
            <input 
              v-model="password" 
              type="password" 
              required
              placeholder="••••••••"
              class="input-base font-mono"
            />
          </div>
          
          <p v-if="error" class="text-sm text-danger bg-danger-dim px-4 py-3 rounded-lg">
            {{ error }}
          </p>
          
          <button 
            type="submit" 
            :disabled="loading"
            class="btn-primary w-full py-3"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <span class="i-lucide-loader-2 animate-spin"></span>
              登入中...
            </span>
            <span v-else>登入</span>
          </button>
        </form>
      </div>
      
      <!-- Footer -->
      <p class="text-center text-xs text-text-muted mt-6 sm:mt-8">
        安全存取 • 角色權限管理
      </p>
    </div>
  </div>
</template>
