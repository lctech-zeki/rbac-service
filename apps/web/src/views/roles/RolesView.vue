<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/api/client'
import type { Role, PaginationMeta } from '@rbac/shared'

const roles = ref<Role[]>([])
const meta = ref<PaginationMeta | null>(null)
const page = ref(1)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await apiClient.get<{ data: Role[]; meta: PaginationMeta }>(
      `/roles?page=${page.value}&limit=20`,
    )
    roles.value = res.data.data
    meta.value = res.data.meta
  } finally {
    loading.value = false
  }
}

async function deleteRole(id: string) {
  if (!confirm('Delete this role?')) return
  try {
    await apiClient.delete(`/roles/${id}`)
    await load()
  } catch (e: any) {
    alert(e.response?.data?.error ?? 'Failed to delete role')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-6">Roles</h2>
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left font-medium text-gray-500">Name</th>
            <th class="px-6 py-3 text-left font-medium text-gray-500">Description</th>
            <th class="px-6 py-3 text-left font-medium text-gray-500">Created</th>
            <th class="px-6 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="loading">
            <td colspan="4" class="px-6 py-8 text-center text-gray-400">Loading…</td>
          </tr>
          <tr v-for="role in roles" :key="role.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-900">{{ role.name }}</td>
            <td class="px-6 py-4 text-gray-500">{{ role.description ?? '—' }}</td>
            <td class="px-6 py-4 text-gray-400">{{ new Date(role.createdAt).toLocaleDateString() }}</td>
            <td class="px-6 py-4 text-right">
              <button @click="deleteRole(role.id)" class="text-red-500 hover:text-red-700 text-xs">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
