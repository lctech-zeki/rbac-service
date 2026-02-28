<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/api/client'
import type { User, PaginationMeta } from '@rbac/shared'
import Modal from '@/components/common/Modal.vue'

const users = ref<User[]>([])
const meta = ref<PaginationMeta | null>(null)
const page = ref(1)
const loading = ref(false)

const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')
const createForm = ref({
  email: '',
  username: '',
  password: '',
})

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
  if (!confirm('確定要刪除此使用者嗎？')) return
  await apiClient.delete(`/users/${id}`)
  await load()
}

async function createUser() {
  createError.value = ''
  creating.value = true
  try {
    await apiClient.post('/users', createForm.value)
    showCreateModal.value = false
    createForm.value = { email: '', username: '', password: '' }
    await load()
  } catch (e: any) {
    createError.value = e.response?.data?.error ?? '建立使用者失敗'
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
        <h2 class="text-xl font-display font-semibold text-text-primary">使用者管理</h2>
        <p class="text-sm text-text-muted mt-1">管理使用者帳戶與存取權限</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-sm text-text-muted">
          <span class="i-lucide-users text-base"></span>
          {{ meta?.total ?? 0 }} 人
        </div>
        <button @click="showCreateModal = true" class="btn-primary px-5 py-2.5">
          <span class="i-lucide-plus mr-2"></span>
          新增使用者
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-x-auto">
      <table class="w-full text-sm min-w-[700px]">
        <thead>
          <tr class="border-b border-border-subtle bg-bg-elevated/50">
            <th class="px-5 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">使用者名稱</th>
            <th class="px-5 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">電子郵件</th>
            <th class="px-5 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">狀態</th>
            <th class="px-5 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">建立時間</th>
            <th class="px-5 py-3 text-right font-medium text-text-muted text-xs uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle">
          <tr v-if="loading" class="text-center">
            <td colspan="5" class="px-5 py-12 text-text-muted">
              <span class="flex items-center justify-center gap-2">
                <span class="i-lucide-loader-2 animate-spin"></span>
                載入中...
              </span>
            </td>
          </tr>
          <tr v-else-if="users.length === 0" class="text-center">
            <td colspan="5" class="px-5 py-12 text-text-muted">尚無使用者資料</td>
          </tr>
          <tr 
            v-for="user in users" 
            :key="user.id" 
            class="hover:bg-bg-hover transition-colors"
          >
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-sm bg-bg-elevated border border-border-subtle flex items-center justify-center">
                  <span class="text-text-muted text-xs font-mono">{{ user.username.charAt(0).toUpperCase() }}</span>
                </div>
                <span class="font-medium text-text-primary">{{ user.username }}</span>
              </div>
            </td>
            <td class="px-5 py-4 text-text-secondary">{{ user.email }}</td>
            <td class="px-5 py-4">
              <span 
                :class="user.isActive 
                  ? 'bg-success/10 text-success border-success/20' 
                  : 'bg-bg-elevated text-text-muted border-border-subtle'"
                class="inline-flex items-center px-2 py-1 text-xs font-medium border rounded-sm"
              >
                <span :class="user.isActive ? 'i-lucide-check' : 'i-lucide-x'" class="mr-1 text-xs"></span>
                {{ user.isActive ? '啟用' : '停用' }}
              </span>
            </td>
            <td class="px-5 py-4 text-text-muted font-mono text-xs">
              {{ new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
            </td>
            <td class="px-5 py-4 text-right">
              <button 
                @click="deleteUser(user.id)"
                class="p-2 text-text-muted hover:text-danger hover:bg-danger-dim rounded-sm transition-colors"
                title="刪除使用者"
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

    <!-- Create User Modal -->
    <Modal :open="showCreateModal" title="建立使用者" @close="showCreateModal = false">
      <div class="space-y-4">
        <div v-if="createError" class="p-3 bg-danger-dim text-danger text-sm rounded-sm">
          {{ createError }}
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">使用者名稱</label>
          <input 
            v-model="createForm.username" 
            type="text" 
            required
            minlength="3"
            placeholder="johndoe"
            class="input-base"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">電子郵件</label>
          <input 
            v-model="createForm.email" 
            type="email" 
            required
            placeholder="john@example.com"
            class="input-base"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">密碼</label>
          <input 
            v-model="createForm.password" 
            type="password" 
            required
            minlength="8"
            placeholder="••••••••"
            class="input-base font-mono"
          />
        </div>
      </div>
      <template #actions>
        <button type="button" @click="showCreateModal = false" class="btn-ghost px-5 py-2.5">
          取消
        </button>
        <button 
          type="submit" 
          @click="createUser"
          :disabled="creating"
          class="btn-primary px-5 py-2.5"
        >
          {{ creating ? '建立中...' : '建立使用者' }}
        </button>
      </template>
    </Modal>
  </div>
</template>
