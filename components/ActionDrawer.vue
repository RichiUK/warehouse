<template>
  <div class="fixed bottom-0 left-0 right-0 z-30 bg-(--ui-bg-elevated) rounded-t-2xl px-4 pb-10 pt-4 flex flex-col gap-3">
    <!-- Info row -->
    <div class="flex items-center justify-between">
      <span class="text-sm text-(--ui-text-muted)">You can select more parts</span>
      <UBadge color="primary" variant="soft" size="sm">
        {{ count }} selected
      </UBadge>
    </div>

    <!-- Action buttons -->
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="action in actions"
        :key="action.value"
        class="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 border transition-all active:scale-95"
        :class="[
          pressed === action.value
            ? 'bg-(--ui-bg-accented) border-(--ui-primary)'
            : 'bg-(--ui-bg) border-(--ui-border-accented)',
        ]"
        @pointerdown="pressed = action.value"
        @pointerup="pressed = null"
        @pointerleave="pressed = null"
        @click="emit('action', action.value)"
      >
        <UIcon :name="action.icon" class="size-5 text-(--ui-text)" />
        <span class="text-xs text-(--ui-text-toned) text-center leading-tight">{{ action.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PartAction } from '~/composables/useDiagnoser'

defineProps<{
  count: number
}>()

const emit = defineEmits<{
  action: [value: PartAction]
}>()

const pressed = ref<PartAction | null>(null)

const actions: Array<{ value: PartAction; label: string; icon: string }> = [
  { value: 'replace', label: 'Replace', icon: 'i-lucide-refresh-cw' },
  { value: 'adjust', label: 'Adjust', icon: 'i-lucide-wrench' },
  { value: 'out-of-stock', label: 'Out of Stock', icon: 'i-lucide-square-dashed' },
]
</script>
