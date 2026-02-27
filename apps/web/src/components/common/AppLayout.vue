<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <nav class="w-56 bg-white shadow flex flex-col">
      <div class="px-6 py-4 border-b font-bold text-lg text-indigo-700">RBAC Admin</div>
      <ul class="flex-1 px-4 py-4 space-y-1">
        <li>
          <RouterLink to="/users"
            class="block px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
            active-class="bg-indigo-100 text-indigo-700 font-medium">
            Users
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/roles"
            class="block px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
            active-class="bg-indigo-100 text-indigo-700 font-medium">
            Roles
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/permissions"
            class="block px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
            active-class="bg-indigo-100 text-indigo-700 font-medium">
            Permissions
          </RouterLink>
        </li>
      </ul>
      <div class="px-4 py-4 border-t">
        <button @click="logout"
          class="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 rounded-md">
          Sign out
        </button>
      </div>
    </nav>

    <!-- Main content -->
    <main class="flex-1 p-8 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>
