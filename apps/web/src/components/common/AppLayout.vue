<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { onMounted, ref } from 'vue'

const auth = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()
const route = useRoute()

const menuOpen = ref(false)

onMounted(() => {
  themeStore.initTheme()
})

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}

const navItems = [
  { path: '/users', label: '使用者', icon: 'i-lucide-users' },
  { path: '/roles', label: '角色', icon: 'i-lucide-shield' },
  { path: '/permissions', label: '權限', icon: 'i-lucide-key' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg-primary grid-bg">
    <!-- Header -->
    <header class="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border-subtle bg-bg-surface/80 backdrop-blur-xl sticky top-0 z-30">
      <!-- Left: Menu + Logo -->
      <div class="flex items-center gap-3">
        <!-- Mobile menu button -->
        <button 
          @click="toggleMenu"
          class="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-all duration-200"
        >
          <span v-if="!menuOpen" class="i-lucide-menu text-xl"></span>
          <span v-else class="i-lucide-x text-xl"></span>
        </button>
        
        <!-- Desktop nav -->
        <nav class="hidden lg:flex items-center gap-1">
          <RouterLink 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="route.path === item.path 
              ? 'bg-accent-subtle text-accent border border-accent/30' 
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'"
          >
            <span :class="item.icon" class="text-base"></span>
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1">
        <button 
          @click="themeStore.toggleTheme"
          class="p-2.5 text-text-muted hover:text-accent hover:bg-accent-subtle rounded-lg transition-all duration-200"
          :title="themeStore.theme === 'dark' ? '切換至淺色模式' : '切換至深色模式'"
        >
          <span v-if="themeStore.theme === 'dark'" class="i-lucide-sun text-base"></span>
          <span v-else class="i-lucide-moon text-base"></span>
        </button>
        <button 
          @click="logout"
          class="p-2.5 text-text-muted hover:text-danger hover:bg-danger-dim rounded-lg transition-all duration-200"
          title="登出"
        >
          <span class="i-lucide-log-out text-base"></span>
        </button>
      </div>
    </header>

    <!-- Mobile menu backdrop -->
    <div 
      v-if="menuOpen" 
      @click="closeMenu"
      class="lg:hidden fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
    ></div>

    <!-- Mobile nav drawer -->
    <div 
      v-if="menuOpen"
      class="lg:hidden fixed top-14 sm:top-16 left-0 right-0 z-25 bg-bg-surface/95 backdrop-blur-xl border-b border-border-subtle"
    >
      <nav class="px-4 py-4 space-y-2">
        <RouterLink 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          @click="closeMenu"
          class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200"
          :class="route.path === item.path 
            ? 'bg-accent-subtle text-accent border border-accent/30' 
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'"
        >
          <span :class="item.icon" class="text-lg"></span>
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <!-- Main content -->
    <main class="flex-1 overflow-auto">
      <div class="p-4 sm:p-6 lg:p-8">
        <RouterView />
      </div>
    </main>
  </div>
</template>
