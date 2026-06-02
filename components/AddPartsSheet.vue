<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 bg-(--ui-bg) flex flex-col h-dvh overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-4 pt-9 pb-3 shrink-0 border-b border-(--ui-bg-accented)">
          <UButton variant="ghost" color="neutral" icon="i-lucide-x" size="sm" @click="onCancel" />
          <p class="text-sm font-semibold text-(--ui-text-highlighted)">Add / Remove Parts</p>
          <UButton color="primary" size="sm" @click="onConfirm">
            Done
          </UButton>
        </div>

        <!-- Scrollable parts list -->
        <div class="flex-1 overflow-y-auto pt-3 pb-36 px-2 flex flex-col gap-2">
          <template v-for="category in CATEGORIES" :key="category.id">
            <button
              class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-4 flex items-center justify-between transition-colors duration-200"
              :class="expandedCategory === category.id ? 'border-(--ui-text-muted)' : 'border-(--ui-bg-accented)'"
              @click="toggleCategory(category.id)"
            >
              <span class="text-base text-(--ui-text-toned)">{{ category.name }}</span>
              <div class="flex items-center gap-2">
                <Transition name="fade">
                  <UBadge v-if="getCategoryCount(category.id) > 0" color="primary" variant="soft" size="sm">
                    {{ getCategoryCount(category.id) }} selected
                  </UBadge>
                </Transition>
                <UIcon
                  :name="expandedCategory === category.id ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                  class="size-5 text-(--ui-text-toned)"
                />
              </div>
            </button>

            <Transition name="accordion">
              <div v-if="expandedCategory === category.id" class="flex flex-col gap-2 overflow-hidden">
                <div v-for="part in category.parts" :key="part.id" class="pl-4">
                  <button
                    class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-4 flex items-center justify-between transition-all duration-150"
                    :class="getPartBorderClass(part.id)"
                    @click="togglePart(category.id, part.id, part.name)"
                  >
                    <span class="text-base text-(--ui-text-toned)">{{ part.name }}</span>
                    <Transition name="fade">
                      <span
                        v-if="getPartAction(part.id) && !pendingIds.has(part.id)"
                        class="flex items-center gap-1 bg-(--ui-bg) border border-(--ui-border-accented) rounded-md px-2 py-1"
                      >
                        <UIcon :name="actionIcons[getPartAction(part.id)!]" class="size-3 text-(--ui-text)" />
                        <span class="text-xs text-(--ui-text)">{{ actionLabels[getPartAction(part.id)!] }}</span>
                      </span>
                    </Transition>
                  </button>
                </div>
              </div>
            </Transition>
          </template>
        </div>

        <!-- ActionDrawer for pending selections -->
        <Transition name="slide-up">
          <ActionDrawer
            v-if="pendingIds.size > 0"
            :count="pendingIds.size"
            @action="applyAction"
          />
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MockTask } from '~/composables/usePartsData'
import { CATEGORIES } from '~/composables/usePartsData'
import type { PartAction } from '~/composables/useDiagnoser'

const props = defineProps<{
  modelValue: boolean
  currentTasks: readonly MockTask[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [tasks: MockTask[]]
}>()

// Local state — pre-populated from currentTasks
const confirmedMap = ref<Map<string, MockTask>>(new Map())
const pendingIds = ref<Set<string>>(new Set())
const pendingMeta = ref<Map<string, { categoryId: string; partId: string; partName: string }>>(new Map())
const expandedCategory = ref<string | null>(null)

// Re-populate when sheet opens
watch(() => props.modelValue, (open) => {
  if (open) {
    confirmedMap.value = new Map(props.currentTasks.map(t => [t.partId, t]))
    pendingIds.value = new Set()
    pendingMeta.value = new Map()
    expandedCategory.value = null
  }
})

function toggleCategory(id: string) {
  expandedCategory.value = expandedCategory.value === id ? null : id
}

function togglePart(categoryId: string, partId: string, partName: string) {
  const nextPending = new Set(pendingIds.value)
  const nextMeta = new Map(pendingMeta.value)
  const nextConfirmed = new Map(confirmedMap.value)

  if (nextPending.has(partId)) {
    // Deselect pending
    nextPending.delete(partId)
    nextMeta.delete(partId)
  } else if (nextConfirmed.has(partId)) {
    // Remove from confirmed
    nextConfirmed.delete(partId)
  } else {
    // Add to pending
    nextPending.add(partId)
    nextMeta.set(partId, { categoryId, partId, partName })
  }

  pendingIds.value = nextPending
  pendingMeta.value = nextMeta
  confirmedMap.value = nextConfirmed
}

function applyAction(action: PartAction) {
  const next = new Map(confirmedMap.value)
  pendingIds.value.forEach((partId) => {
    const meta = pendingMeta.value.get(partId)
    if (meta) {
      next.set(partId, {
        partId,
        partName: meta.partName,
        categoryId: meta.categoryId,
        action: action as 'replace' | 'adjust',
      })
    }
  })
  confirmedMap.value = next
  pendingIds.value = new Set()
  pendingMeta.value = new Map()
}

function getPartAction(partId: string): PartAction | null {
  if (pendingIds.value.has(partId)) return null
  const t = confirmedMap.value.get(partId)
  return t ? t.action as PartAction : null
}

function getPartBorderClass(partId: string) {
  if (pendingIds.value.has(partId)) return 'border-(--ui-primary)'
  if (confirmedMap.value.has(partId)) return 'border-(--ui-border-accented) bg-(--ui-bg-accented)'
  return 'border-(--ui-border-accented)'
}

function getCategoryCount(categoryId: string) {
  let n = 0
  confirmedMap.value.forEach(t => { if (t.categoryId === categoryId) n++ })
  pendingIds.value.forEach((id) => {
    const m = pendingMeta.value.get(id)
    if (m?.categoryId === categoryId) n++
  })
  return n
}

const actionLabels: Record<PartAction, string> = {
  replace: 'Replace',
  adjust: 'Adjust',
  'out-of-stock': 'Out of Stock',
}

const actionIcons: Record<PartAction, string> = {
  replace: 'i-lucide-refresh-cw',
  adjust: 'i-lucide-wrench',
  'out-of-stock': 'i-lucide-package-x',
}

function onCancel() {
  emit('update:modelValue', false)
}

function onConfirm() {
  emit('confirm', Array.from(confirmedMap.value.values()))
  emit('update:modelValue', false)
}
</script>

<style scoped>
.sheet-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }

.accordion-enter-active { transition: opacity 0.2s ease, transform 0.22s ease; }
.accordion-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.accordion-enter-from, .accordion-leave-to { opacity: 0; transform: translateY(-6px); }

.slide-up-enter-active { transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease; }
.slide-up-leave-active { transition: transform 0.18s ease-in, opacity 0.15s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }

.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
