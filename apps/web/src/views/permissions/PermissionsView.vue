<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/api/client'
import type { Permission, PaginationMeta } from '@rbac/shared'
import Modal from '@/components/common/Modal.vue'

const permissions = ref<Permission[]>([])
const meta = ref<PaginationMeta | null>(null)
const page = ref(1)
const loading = ref(false)

const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')
const createForm = ref({
  resource: '',
  action: '',
  description: '',
})

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

async function deletePermission(id: string) {
  if (!confirm('確定要刪除此權限嗎？')) return
  try {
    await apiClient.delete(`/permissions/${id}`)
    await load()
  } catch (e: any) {
    alert(e.response?.data?.error ?? '刪除權限失敗')
  }
}

async function createPermission() {
  createError.value = ''
  creating.value = true
  try {
    await apiClient.post('/permissions', {
      resource: createForm.value.resource,
      action: createForm.value.action,
      description: createForm.value.description || undefined,
    })
    showCreateModal.value = false
    createForm.value = { resource: '', action: '', description: '' }
    await load()
  } catch (e: any) {
    createError.value = e.response?.data?.error ?? '建立權限失敗'
  } finally {
    creating.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-display font-semibold text-text-primary">權限管理</h2>
        <p class="text-sm text-text-muted mt-1">檢視所有可用權限</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-sm text-text-muted">
          <span class="i-lucide-key text-base"></span>
          {{ meta?.total ?? 0 }} 項
        </div>
        <button @click="showCreateModal = true" class="btn-primary px-5 py-2.5">
          <span class="i-lucide-plus mr-2"></span>
          新增權限
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-x-auto">
      <table class="w-full text-sm min-w-[500px]">
        <thead>
          <tr class="border-b border-border-subtle bg-bg-elevated/50">
            <th class="px-5 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">資源</th>
            <th class="px-5 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">動作</th>
            <th class="px-5 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">描述</th>
            <th class="px-5 py-3 text-right font-medium text-text-muted text-xs uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle">
          <tr v-if="loading" class="text-center">
            <td colspan="4" class="px-5 py-12 text-text-muted">
              <span class="flex items-center justify-center gap-2">
                <span class="i-lucide-loader-2 animate-spin"></span>
                載入中...
              </span>
            </td>
          </tr>
          <tr v-else-if="permissions.length === 0" class="text-center">
            <td colspan="4" class="px-5 py-12 text-text-muted">尚無權限資料</td>
          </tr>
          <tr 
            v-for="perm in permissions" 
            :key="perm.id" 
            class="hover:bg-bg-hover transition-colors"
          >
            <td class="px-5 py-4">
              <span class="font-medium text-text-primary">{{ perm.resource }}</span>
            </td>
            <td class="px-5 py-4">
              <span class="font-mono text-xs px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded-sm">
                {{ perm.action }}
              </span>
            </td>
            <td class="px-5 py-4 text-text-secondary">{{ perm.description ?? '—' }}</td>
            <td class="px-5 py-4 text-right">
              <button 
                @click="deletePermission(perm.id)"
                class="p-2 text-text-muted hover:text-danger hover:bg-danger-dim rounded-sm transition-colors"
                title="刪除權限"
              >
                <span class="i-lucide-trash-2 text-sm"></span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta && meta.totalPages > 1" class="mt-4 flex items-center justify-between">
      <p class="text-sm text-text-muted">
        第 {{ page }} 頁，共 {{ meta.totalPages }} 頁
      </p>
      <div class="flex items-center gap-2">
        <button 
          :disabled="page <= 1" 
          @click="page--; load()"
          class="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30"
        >
          <span class="i-lucide-chevron-left mr-1"></span>
          上一頁
        </button>
        <button 
          :disabled="page >= meta.totalPages" 
          @click="page++; load()"
          class="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30"
        >
          下一頁
          <span class="i-lucide-chevron-right ml-1"></span>
        </button>
      </div>
    </div>

    <!-- Create Permission Modal -->
    <Modal :open="showCreateModal" title="建立權限" @close="showCreateModal = false">
      <div class="space-y-4">
        <div v-if="createError" class="p-3 bg-danger-dim text-danger text-sm rounded-sm">
          {{ createError }}
        </div>
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-text-secondary mb-2">資源</label>
            <input 
              v-model="createForm.resource" 
              type="text" 
              required
              placeholder="users"
              class="input-base"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-text-secondary mb-2">動作</label>
            <input 
              v-model="createForm.action" 
              type="text" 
              required
              placeholder="read, write, delete"
              class="input-base"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">描述（選填）</label>
          <textarea 
            v-model="createForm.description" 
            rows="2"
            placeholder="權限描述"
            class="input-base resize-none"
          ></textarea>
        </div>
      </div>
      <template #actions>
        <button type="button" @click="showCreateModal = false" class="btn-ghost px-5 py-2.5">
          取消
        </button>
        <button 
          type="submit" 
          @click="createPermission"
          :disabled="creating"
          class="btn-primary px-5 py-2.5"
        >
          {{ creating ? '建立中...' : '建立權限' }}
        </button>
      </template>
    </Modal>
  </div>
</template>
