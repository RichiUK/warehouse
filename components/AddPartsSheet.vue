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

        <!-- Search bar -->
        <div class="px-2 pt-3 pb-2 shrink-0">
          <UInput
            v-model="searchQuery"
            placeholder="Search part"
            icon="i-lucide-search"
            size="md"
            class="w-full"
            variant="outline"
          >
            <template v-if="searchQuery" #trailing>
              <button class="flex items-center justify-center p-0.5 rounded" @click="searchQuery = ''">
                <UIcon name="i-lucide-x" class="size-4 text-(--ui-text-muted)" />
              </button>
            </template>
          </UInput>
        </div>

        <!-- Counter -->
        <div v-if="selectedIds.size > 0" class="px-3 pb-2 shrink-0">
          <p class="text-xs text-(--ui-text-muted)">
            <span class="text-(--ui-primary) font-semibold">{{ selectedIds.size }}</span> part{{ selectedIds.size !== 1 ? 's' : '' }} selected
          </p>
        </div>

        <!-- Scrollable parts list -->
        <div class="flex-1 overflow-y-auto pb-8 px-2 flex flex-col gap-2">

          <!-- Flat search results -->
          <template v-if="searchQuery">
            <template v-for="category in filteredCategories" :key="category.id">
              <p class="text-xs text-(--ui-text-muted) uppercase tracking-wider px-1 pt-2 pb-1">{{ category.name }}</p>
              <div v-for="part in filteredParts(category)" :key="part.id">
                <button
                  class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3 flex items-center justify-between transition-all duration-150"
                  :class="selectedIds.has(part.id)
                    ? 'border-(--ui-primary) bg-(--ui-primary)/5'
                    : 'border-(--ui-border-accented)'"
                  @click="togglePart(category.id, part.id, part.name)"
                >
                  <span class="text-base text-(--ui-text-toned)">{{ part.name }}</span>
                  <div class="flex items-center gap-2 shrink-0">
                    <span
                      v-if="isFromDiagnosis(part.id)"
                      class="text-xs text-(--ui-text-dimmed) italic"
                    >Diagnosed</span>
                    <Transition name="fade">
                      <UIcon
                        v-if="selectedIds.has(part.id)"
                        name="i-lucide-check"
                        class="size-4 text-(--ui-primary)"
                      />
                    </Transition>
                  </div>
                </button>
              </div>
            </template>
          </template>

          <!-- Accordion (no search) -->
          <template v-else>
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
                      {{ getCategoryCount(category.id) }}
                    </UBadge>
                  </Transition>
                  <UIcon
                    :name="expandedCategory === category.id ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                    class="size-5 text-(--ui-text-toned)"
                  />
                </div>
              </button>

              <Transition name="accordion">
                <div v-if="expandedCategory === category.id" class="flex flex-col gap-1.5 overflow-hidden">
                  <div v-for="part in category.parts" :key="part.id" class="pl-4">
                    <button
                      class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3 flex items-center justify-between transition-all duration-150"
                      :class="selectedIds.has(part.id)
                        ? 'border-(--ui-primary) bg-(--ui-primary)/5'
                        : 'border-(--ui-border-accented)'"
                      @click="togglePart(category.id, part.id, part.name)"
                    >
                      <span class="text-base text-(--ui-text-toned)">{{ part.name }}</span>
                      <div class="flex items-center gap-2 shrink-0">
                        <span
                          v-if="isFromDiagnosis(part.id)"
                          class="text-xs text-(--ui-text-dimmed) italic"
                        >Diagnosed</span>
                        <Transition name="fade">
                          <UIcon
                            v-if="selectedIds.has(part.id)"
                            name="i-lucide-check"
                            class="size-4 text-(--ui-primary)"
                          />
                        </Transition>
                      </div>
                    </button>
                  </div>
                </div>
              </Transition>
            </template>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MockTask } from '~/composables/usePartsData'
import { CATEGORIES } from '~/composables/usePartsData'

const props = defineProps<{
  modelValue: boolean
  currentTasks: readonly MockTask[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [tasks: MockTask[]]
}>()

// Which partIds are currently in the task list (pre-selected on open)
const selectedIds = ref<Set<string>>(new Set())
// Which parts came from diagnosis (so we can display "Diagnosed" indicator)
const diagnosisIds = ref<Set<string>>(new Set())
const expandedCategory = ref<string | null>(null)
const searchQuery = ref('')

// Build a lookup: partId → existing task metadata (preserves source etc.)
const existingTaskMap = ref<Map<string, MockTask>>(new Map())

watch(() => props.modelValue, (open) => {
  if (open) {
    const sel = new Set<string>()
    const diag = new Set<string>()
    const map = new Map<string, MockTask>()
    props.currentTasks.forEach((t) => {
      sel.add(t.partId)
      map.set(t.partId, t)
      if (t.source === 'diagnosis') diag.add(t.partId)
    })
    selectedIds.value = sel
    diagnosisIds.value = diag
    existingTaskMap.value = map
    expandedCategory.value = null
    searchQuery.value = ''
  }
})

function isFromDiagnosis(partId: string) {
  return diagnosisIds.value.has(partId)
}

function toggleCategory(id: string) {
  expandedCategory.value = expandedCategory.value === id ? null : id
}

function togglePart(categoryId: string, partId: string, partName: string) {
  const next = new Set(selectedIds.value)
  if (next.has(partId)) {
    next.delete(partId)
  }
  else {
    next.add(partId)
    // If it's a new part (not in existing), add metadata for later use
    if (!existingTaskMap.value.has(partId)) {
      const nextMap = new Map(existingTaskMap.value)
      nextMap.set(partId, { partId, partName, categoryId, source: 'mechanic' })
      existingTaskMap.value = nextMap
    }
  }
  selectedIds.value = next
}

function getCategoryCount(categoryId: string) {
  let n = 0
  CATEGORIES.find(c => c.id === categoryId)?.parts.forEach((p) => {
    if (selectedIds.value.has(p.id)) n++
  })
  return n
}

const filteredCategories = computed(() => {
  if (!searchQuery.value) return CATEGORIES
  const q = searchQuery.value.toLowerCase()
  return CATEGORIES.filter(cat =>
    cat.name.toLowerCase().includes(q)
    || cat.parts.some(p => p.name.toLowerCase().includes(q)),
  )
})

function filteredParts(category: typeof CATEGORIES[0]) {
  if (!searchQuery.value) return category.parts
  const q = searchQuery.value.toLowerCase()
  return category.parts.filter(p =>
    p.name.toLowerCase().includes(q) || category.name.toLowerCase().includes(q),
  )
}

function onCancel() {
  emit('update:modelValue', false)
}

function onConfirm() {
  // Build final task list in category order, preserving existing metadata
  const result: MockTask[] = []
  CATEGORIES.forEach((cat) => {
    cat.parts.forEach((part) => {
      if (selectedIds.value.has(part.id)) {
        const existing = existingTaskMap.value.get(part.id)
        if (existing) {
          result.push(existing)
        }
        else {
          // Fallback: shouldn't happen since togglePart registers new parts
          result.push({ partId: part.id, partName: part.name, categoryId: cat.id, source: 'mechanic' })
        }
      }
    })
  })
  emit('confirm', result)
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

.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
