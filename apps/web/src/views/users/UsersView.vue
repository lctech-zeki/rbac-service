<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/api/client'
import type { User, PaginationMeta } from '@rbac/shared'

const users = ref<User[]>([])
const meta = ref<PaginationMeta | null>(null)
const page = ref(1)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await apiClient.get<{ data: User[]; meta: PaginationMeta }>(
      `/users?page=${page.value}&limit=20`,
    )
    users.value = res.data.data
    meta.value = res.data.meta
  } finally {
    loading.value = false
  }
}

async function deleteUser(id: string) {
  if (!confirm('Delete this user?')) return
  await apiClient.delete(`/users/${id}`)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">Users</h2>
    </div>

    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left font-medium text-gray-500">Username</th>
            <th class="px-6 py-3 text-left font-medium text-gray-500">Email</th>
            <th class="px-6 py-3 text-left font-medium text-gray-500">Active</th>
            <th class="px-6 py-3 text-left font-medium text-gray-500">Created</th>
            <th class="px-6 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="loading">
            <td colspan="5" class="px-6 py-8 text-center text-gray-400">Loading…</td>
          </tr>
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-900">{{ user.username }}</td>
            <td class="px-6 py-4 text-gray-500">{{ user.email }}</td>
            <td class="px-6 py-4">
              <span :class="user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'"
                class="px-2 py-1 rounded-full text-xs font-medium">
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-6 py-4 text-gray-400">{{ new Date(user.createdAt).toLocaleDateString() }}</td>
            <td class="px-6 py-4 text-right">
              <button @click="deleteUser(user.id)"
                class="text-red-500 hover:text-red-700 text-xs">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta" class="mt-4 flex items-center justify-between text-sm text-gray-500">
      <span>{{ meta.total }} users</span>
      <div class="flex gap-2">
        <button :disabled="page <= 1" @click="page--; load()"
          class="px-3 py-1 rounded border disabled:opacity-40">Prev</button>
        <span class="px-3 py-1">{{ page }} / {{ meta.totalPages }}</span>
        <button :disabled="page >= meta.totalPages" @click="page++; load()"
          class="px-3 py-1 rounded border disabled:opacity-40">Next</button>
      </div>
    </div>
  </div>
</template>
