<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/api/client'
import type { Permission, PaginationMeta } from '@rbac/shared'

const permissions = ref<Permission[]>([])
const meta = ref<PaginationMeta | null>(null)
const page = ref(1)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await apiClient.get<{ data: Permission[]; meta: PaginationMeta }>(
      `/permissions?page=${page.value}&limit=20`,
    )
    permissions.value = res.data.data
    meta.value = res.data.meta
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-6">Permissions</h2>
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left font-medium text-gray-500">Resource</th>
            <th class="px-6 py-3 text-left font-medium text-gray-500">Action</th>
            <th class="px-6 py-3 text-left font-medium text-gray-500">Description</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="loading">
            <td colspan="3" class="px-6 py-8 text-center text-gray-400">Loading…</td>
          </tr>
          <tr v-for="perm in permissions" :key="perm.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-900">{{ perm.resource }}</td>
            <td class="px-6 py-4">
              <span class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-mono">
                {{ perm.action }}
              </span>
            </td>
            <td class="px-6 py-4 text-gray-400">{{ perm.description ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
