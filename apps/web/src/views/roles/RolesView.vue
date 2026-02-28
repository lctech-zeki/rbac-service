<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '@/api/client'
import type { Role, Permission, PaginationMeta } from '@rbac/shared'
import Modal from '@/components/common/Modal.vue'

const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const meta = ref<PaginationMeta | null>(null)
const page = ref(1)
const loading = ref(false)
const permissionsLoading = ref(false)

const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')
const createForm = ref({
  name: '',
  description: '',
})

const showEditModal = ref(false)
const editing = ref(false)
const editError = ref('')
const editingRole = ref<Role | null>(null)
const editForm = ref({
  name: '',
  description: '',
})
const selectedPermissions = ref<Set<string>>(new Set())
const originalPermissions = ref<Set<string>>(new Set())

async function loadRoles() {
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

async function loadPermissions() {
  permissionsLoading.value = true
  try {
    const res = await apiClient.get<{ data: Permission[] }>('/permissions?page=1&limit=100')
    permissions.value = res.data.data
  } finally {
    permissionsLoading.value = false
  }
}

async function openEditModal(role: Role) {
  editError.value = ''
  editingRole.value = role
  editForm.value = {
    name: role.name,
    description: role.description || '',
  }
  
  try {
    const res = await apiClient.get<{ data: { permissions: Permission[] } }>(`/roles/${role.id}`)
    const rolePerms = res.data.data.permissions || []
    selectedPermissions.value = new Set(rolePerms.map(p => p.id))
    originalPermissions.value = new Set(rolePerms.map(p => p.id))
  } catch {
    selectedPermissions.value = new Set()
    originalPermissions.value = new Set()
  }
  
  showEditModal.value = true
}

async function saveRole() {
  if (!editingRole.value) return
  
  editError.value = ''
  editing.value = true
  
  try {
    await apiClient.patch(`/roles/${editingRole.value.id}`, {
      name: editForm.value.name,
      description: editForm.value.description || undefined,
    })
    
    const toAdd = [...selectedPermissions.value].filter(id => !originalPermissions.value.has(id))
    const toRemove = [...originalPermissions.value].filter(id => !selectedPermissions.value.has(id))
    
    for (const permId of toAdd) {
      await apiClient.post(`/roles/${editingRole.value.id}/permissions`, { permissionId: permId })
    }
    
    for (const permId of toRemove) {
      await apiClient.delete(`/roles/${editingRole.value.id}/permissions/${permId}`)
    }
    
    showEditModal.value = false
    await loadRoles()
  } catch (e: any) {
    editError.value = e.response?.data?.error ?? '更新角色失敗'
  } finally {
    editing.value = false
  }
}

async function deleteRole(id: string) {
  if (!confirm('確定要刪除此角色嗎？')) return
  try {
    await apiClient.delete(`/roles/${id}`)
    await loadRoles()
  } catch (e: any) {
    alert(e.response?.data?.error ?? '刪除角色失敗')
  }
}

async function createRole() {
  createError.value = ''
  creating.value = true
  try {
    await apiClient.post('/roles', {
      name: createForm.value.name,
      description: createForm.value.description || undefined,
    })
    showCreateModal.value = false
    createForm.value = { name: '', description: '' }
    await loadRoles()
  } catch (e: any) {
    createError.value = e.response?.data?.error ?? '建立角色失敗'
  } finally {
    creating.value = false
  }
}

const permissionGroups = computed(() => {
  const groups: Record<string, Permission[]> = {}
  for (const perm of permissions.value) {
    if (!groups[perm.resource]) {
      groups[perm.resource] = []
    }
    groups[perm.resource].push(perm)
  }
  return groups
})

onMounted(() => {
  loadRoles()
  loadPermissions()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-display font-semibold text-text-primary">角色管理</h2>
        <p class="text-sm text-text-muted mt-1">配置角色與權限</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-sm text-text-muted">
          <span class="i-lucide-shield text-base"></span>
          {{ meta?.total ?? 0 }} total
        </div>
        <button @click="showCreateModal = true" class="btn-primary px-5 py-2.5">
          <span class="i-lucide-plus mr-2"></span>
          新增角色
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-x-auto">
      <table class="w-full text-sm min-w-[600px]">
        <thead>
          <tr class="border-b border-border-subtle bg-bg-elevated/50">
            <th class="px-5 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">名稱</th>
            <th class="px-5 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">描述</th>
            <th class="px-5 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">建立時間</th>
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
          <tr v-else-if="roles.length === 0" class="text-center">
            <td colspan="4" class="px-5 py-12 text-text-muted">尚無角色資料</td>
          </tr>
          <tr 
            v-for="role in roles" 
            :key="role.id" 
            class="hover:bg-bg-hover transition-colors"
          >
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <span class="i-lucide-shield text-accent text-sm"></span>
                </div>
                <span class="font-medium text-text-primary font-mono">{{ role.name }}</span>
              </div>
            </td>
            <td class="px-5 py-4 text-text-secondary">{{ role.description ?? '—' }}</td>
            <td class="px-5 py-4 text-text-muted font-mono text-xs">
              {{ new Date(role.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
            </td>
            <td class="px-5 py-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <button 
                  @click="openEditModal(role)"
                  class="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-sm transition-colors"
                  title="編輯角色"
                >
                  <span class="i-lucide-pencil text-sm"></span>
                </button>
                <button 
                  @click="deleteRole(role.id)"
                  class="p-2 text-text-muted hover:text-danger hover:bg-danger-dim rounded-sm transition-colors"
                  title="刪除角色"
                >
                  <span class="i-lucide-trash-2 text-sm"></span>
                </button>
              </div>
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
          @click="page--; loadRoles()"
          class="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30"
        >
          <span class="i-lucide-chevron-left mr-1"></span>
          上一頁
        </button>
        <button 
          :disabled="page >= meta.totalPages" 
          @click="page++; loadRoles()"
          class="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30"
        >
          下一頁
          <span class="i-lucide-chevron-right ml-1"></span>
        </button>
      </div>
    </div>

    <!-- Create Role Modal -->
    <Modal :open="showCreateModal" title="建立角色" @close="showCreateModal = false">
      <div class="space-y-4">
        <div v-if="createError" class="p-3 bg-danger-dim text-danger text-sm rounded-sm">
          {{ createError }}
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">角色名稱</label>
          <input 
            v-model="createForm.name" 
            type="text" 
            required
            minlength="2"
            placeholder="admin"
            class="input-base"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">描述（選填）</label>
          <textarea 
            v-model="createForm.description" 
            rows="2"
            placeholder="角色描述"
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
          @click="createRole"
          :disabled="creating"
          class="btn-primary px-5 py-2.5"
        >
          {{ creating ? '建立中...' : '建立角色' }}
        </button>
      </template>
    </Modal>

    <!-- Edit Role Modal -->
    <Modal :open="showEditModal" :title="`編輯角色：${editingRole?.name}`" @close="showEditModal = false">
      <div class="space-y-4">
        <div v-if="editError" class="p-3 bg-danger-dim text-danger text-sm rounded-sm">
          {{ editError }}
        </div>
        
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-text-secondary mb-2">角色名稱</label>
            <input 
              v-model="editForm.name" 
              type="text" 
              required
              minlength="2"
              class="input-base"
            />
          </div>
          
          <div class="flex-1">
            <label class="block text-sm font-medium text-text-secondary mb-2">描述（選填）</label>
            <textarea 
              v-model="editForm.description" 
              rows="1"
              class="input-base resize-none"
            ></textarea>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-text-secondary mb-3">
            權限
            <span v-if="permissionsLoading" class="i-lucide-loader-2 animate-spin ml-2 text-xs"></span>
          </label>
          
          <div v-if="!permissionsLoading && permissions.length === 0" class="text-text-muted text-sm py-2">
            暫無可用權限
          </div>
          
          <div v-else class="max-h-64 overflow-y-auto border border-border-subtle rounded-sm p-3 space-y-4">
            <div v-for="(perms, resource) in permissionGroups" :key="resource">
              <div class="text-xs font-medium text-accent uppercase tracking-wider mb-2">
                {{ resource }}
              </div>
              <div class="grid grid-cols-2 gap-2">
                <label 
                  v-for="perm in perms" 
                  :key="perm.id"
                  class="flex items-center gap-2 cursor-pointer hover:bg-bg-hover p-1.5 rounded-sm -mx-1.5 transition-colors"
                >
                  <input 
                    type="checkbox" 
                    :checked="selectedPermissions.has(perm.id)"
                    @change="(e) => {
                      const target = e.target as HTMLInputElement
                      if (target.checked) {
                        selectedPermissions.add(perm.id)
                      } else {
                        selectedPermissions.delete(perm.id)
                      }
                    }"
                    class="w-4 h-4 rounded-sm border-border-default bg-bg-surface accent-accent"
                  />
                  <span class="text-xs font-mono text-text-secondary">{{ perm.action }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #actions>
        <button type="button" @click="showEditModal = false" class="btn-ghost px-5 py-2.5">
          取消
        </button>
        <button 
          type="submit" 
          @click="saveRole"
          :disabled="editing"
          class="btn-primary px-5 py-2.5"
        >
          {{ editing ? '儲存中...' : '儲存變更' }}
        </button>
      </template>
    </Modal>
  </div>
</template>
