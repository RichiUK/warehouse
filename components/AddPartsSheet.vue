<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 bg-(--ui-bg) flex flex-col h-dvh overflow-hidden">

        <!-- Header — same pattern as diagnoser, "Done" instead of Submit -->
        <div class="flex items-center justify-between px-4 pt-9 pb-2 shrink-0 bg-(--ui-bg)">
          <UButton variant="ghost" color="neutral" icon="i-lucide-x" size="sm" @click="onCancel" />
          <p class="text-base font-black uppercase tracking-wide leading-none text-(--ui-text-highlighted)">
            Add / Remove Parts
          </p>
          <UButton
            color="primary"
            icon="i-lucide-check-check"
            size="sm"
            trailing
            @click="onConfirm"
          >
            <span class="flex items-center gap-1.5">
              <span v-if="selectedIds.size > 0" class="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded">{{ selectedIds.size }}</span>
              Done
            </span>
          </UButton>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto pb-8">

          <!-- Bike viewer — shrinks when category open or search active -->
          <div
            class="transition-all duration-300 ease-in-out"
            :class="bikeSmall ? 'px-[72px] py-2' : 'px-[18.74px] py-3'"
          >
            <BikeViewer
              :active-category-id="expandedCategory"
              :has-selections="selectedIds.size > 0"
              :selected-category-ids="selectedCategoryIds"
              @select-category="handleSelectCategory"
            />
          </div>

          <!-- Live summary card -->
          <div class="px-2 mb-3">
            <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-clipboard-list" class="size-5 text-(--ui-text-muted) shrink-0" />
                <div>
                  <p class="text-sm font-medium text-(--ui-text-highlighted)">{{ liveCategory.label }}</p>
                  <p class="text-xs text-(--ui-text-muted) mt-0.5">
                    {{ selectedIds.size }} part{{ selectedIds.size !== 1 ? 's' : '' }} selected
                  </p>
                </div>
              </div>
              <UBadge :color="liveCategory.color" variant="soft" size="sm">
                {{ liveCategory.time }}
              </UBadge>
            </div>
          </div>

          <!-- Search bar -->
          <div class="px-2 mb-3">
            <UInput
              v-model="searchQuery"
              placeholder="Search part"
              icon="i-lucide-search"
              size="md"
              class="w-full"
              variant="outline"
              @focus="searchFocused = true"
              @blur="searchFocused = false"
            >
              <template v-if="searchQuery" #trailing>
                <button class="flex items-center justify-center p-0.5 rounded" @click="searchQuery = ''; searchFocused = false">
                  <UIcon name="i-lucide-x" class="size-4 text-(--ui-text-muted)" />
                </button>
              </template>
            </UInput>
          </div>

          <!-- Search results (flat list) -->
          <div v-if="searchQuery" class="px-2 flex flex-col gap-1">
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
                    <span v-if="isFromDiagnosis(part.id)" class="text-xs text-(--ui-text-dimmed) italic">Diagnosed</span>
                    <Transition name="fade">
                      <UIcon v-if="selectedIds.has(part.id)" name="i-lucide-check" class="size-4 text-(--ui-primary)" />
                    </Transition>
                  </div>
                </button>
              </div>
            </template>
          </div>

          <!-- Parts accordion (no search) -->
          <div v-else class="px-2 flex flex-col gap-2">
            <template v-for="category in CATEGORIES" :key="category.id">
              <!-- Category header -->
              <button
                class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3.5 flex items-center justify-between transition-colors duration-200"
                :class="expandedCategory === category.id ? 'border-(--ui-text-muted)' : 'border-(--ui-bg-accented)'"
                @click="handleSelectCategory(category.id)"
              >
                <span class="text-base text-(--ui-text-toned)">{{ category.name }}</span>
                <div class="flex items-center gap-1.5">
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

              <!-- Parts list -->
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
                        <span v-if="isFromDiagnosis(part.id)" class="text-xs text-(--ui-text-dimmed) italic">Diagnosed</span>
                        <Transition name="fade">
                          <UIcon v-if="selectedIds.has(part.id)" name="i-lucide-check" class="size-4 text-(--ui-primary)" />
                        </Transition>
                      </div>
                    </button>
                  </div>
                </div>
              </Transition>
            </template>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MockTask } from '~/composables/usePartsData'
import { CATEGORIES } from '~/composables/usePartsData'
import { calcRepairCategory } from '~/composables/useBikeStore'

const props = defineProps<{
  modelValue: boolean
  currentTasks: readonly MockTask[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [tasks: MockTask[]]
}>()

const selectedIds = ref<Set<string>>(new Set())
const diagnosisIds = ref<Set<string>>(new Set())
const existingTaskMap = ref<Map<string, MockTask>>(new Map())
const expandedCategory = ref<string | null>(null)
const searchQuery = ref('')
const searchFocused = ref(false)

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
    searchFocused.value = false
  }
})

// Bike viewer — shrink when category open or searching
const bikeSmall = computed(() =>
  expandedCategory.value !== null || searchFocused.value || !!searchQuery.value,
)

// Category IDs that have at least one selected part → drives yellow overlay on BikeViewer
const selectedCategoryIds = computed(() => {
  const ids = new Set<string>()
  CATEGORIES.forEach((cat) => {
    if (cat.parts.some(p => selectedIds.value.has(p.id))) ids.add(cat.id)
  })
  return ids
})

// Live category estimate based on current selection
const liveCategory = computed(() => calcRepairCategory(selectedIds.value.size))

function isFromDiagnosis(partId: string) {
  return diagnosisIds.value.has(partId)
}

function handleSelectCategory(categoryId: string) {
  expandedCategory.value = expandedCategory.value === categoryId ? null : categoryId
}

function togglePart(categoryId: string, partId: string, partName: string) {
  const next = new Set(selectedIds.value)
  if (next.has(partId)) {
    next.delete(partId)
  }
  else {
    next.add(partId)
    if (!existingTaskMap.value.has(partId)) {
      const nextMap = new Map(existingTaskMap.value)
      nextMap.set(partId, { partId, partName, categoryId, source: 'mechanic' })
      existingTaskMap.value = nextMap
    }
  }
  selectedIds.value = next
}

function getCategoryCount(categoryId: string) {
  return CATEGORIES.find(c => c.id === categoryId)?.parts.filter(p => selectedIds.value.has(p.id)).length ?? 0
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
  const result: MockTask[] = []
  CATEGORIES.forEach((cat) => {
    cat.parts.forEach((part) => {
      if (selectedIds.value.has(part.id)) {
        result.push(
          existingTaskMap.value.get(part.id)
          ?? { partId: part.id, partName: part.name, categoryId: cat.id, source: 'mechanic' },
        )
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
