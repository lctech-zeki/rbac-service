<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    dialogRef.value?.showModal()
  } else {
    dialogRef.value?.close()
  }
})
</script>

<template>
  <dialog 
    ref="dialogRef" 
    class="modal bg-bg-surface border border-border-subtle p-0 w-full max-w-lg"
    @close="emit('close')"
    @click.self="emit('close')"
  >
    <div class="p-6 border-b border-border-subtle flex items-center justify-between">
      <h3 class="font-display font-semibold text-lg text-text-primary">{{ title }}</h3>
      <button 
        @click="emit('close')"
        class="p-2 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-all duration-200"
      >
        <span class="i-lucide-x text-lg"></span>
      </button>
    </div>
    <form @submit.prevent="($event.target as HTMLFormElement)?.closest('dialog')?.close()">
      <div class="p-6">
        <slot />
      </div>
      <div class="p-6 pt-0 border-t border-border-subtle flex justify-end gap-3">
        <slot name="actions" />
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.modal {
  border-radius: 16px;
  color: var(--text-primary);
  background: var(--bg-surface);
}

.modal::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

[data-theme="light"] .modal::backdrop {
  background: rgba(15, 23, 42, 0.3);
}

.modal[open] {
  animation: dialog-in 0.25s ease;
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
