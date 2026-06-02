<template>
  <div class="relative h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-20 bg-(--ui-bg) px-4 pt-9 pb-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
          <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" size="sm" @click="router.push('/tester')" />
          <p class="text-base font-black uppercase tracking-wide leading-none">
            <span class="text-(--ui-text-highlighted)">BIKE </span><span class="text-(--ui-primary)">{{ bikeId }}</span>
          </p>
        </div>
        <Transition name="fade">
          <UButton
            v-if="allEvaluated(evaluableTaskIds)"
            :color="hasFailures(evaluableTaskIds) ? 'error' : 'success'"
            icon="i-lucide-check-check"
            size="sm"
            trailing
            @click="onSubmit"
          >
            Submit
          </UButton>
        </Transition>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto pt-16 pb-24">
      <!-- Bike viewer -->
      <div
        class="relative transition-all duration-300 ease-in-out"
        :class="expandedCategory ? 'px-[72px] py-2' : 'px-[18.74px] py-4'"
      >
        <BikeViewer
          :active-category-id="expandedCategory"
          :has-selections="evaluableTaskIds.length > 0"
          :selected-category-ids="partialCategoryIds"
          :completed-category-ids="passedCategoryIds"
          @select-category="handleSelectCategory"
        />
      </div>

      <!-- People card -->
      <div class="px-2 mb-2">
        <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3 flex items-center gap-3">
          <UIcon name="i-lucide-users" class="size-4 text-(--ui-text-muted) shrink-0" />
          <div class="flex items-center gap-3 text-xs text-(--ui-text-muted) flex-wrap">
            <span>Diagnosed by <span class="text-(--ui-text-highlighted) font-medium">{{ bikeRecord?.diagnoserName ?? '—' }}</span></span>
            <span class="text-(--ui-text-dimmed)">·</span>
            <span>Repaired by <span class="text-(--ui-text-highlighted) font-medium">{{ bikeRecord?.mechanicName ?? '—' }}</span></span>
          </div>
        </div>
      </div>

      <!-- Category card -->
      <div class="px-2 mb-3">
        <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-clipboard-list" class="size-5 text-(--ui-text-muted) shrink-0" />
            <div>
              <p class="text-sm font-medium text-(--ui-text-highlighted)">{{ categoryInfo.label }}</p>
              <p class="text-xs text-(--ui-text-muted) mt-0.5">{{ categoryInfo.time }} estimated</p>
            </div>
          </div>
          <UBadge :color="categoryInfo.color" variant="soft" size="sm">{{ categoryInfo.time }}</UBadge>
        </div>
      </div>

      <!-- Tasks accordion -->
      <div class="px-2 flex flex-col gap-2">
        <template v-for="category in taskCategories" :key="category.id">
          <!-- Category header -->
          <button
            class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-4 flex items-center justify-between transition-colors duration-200"
            :class="expandedCategory === category.id ? 'border-(--ui-text-muted)' : 'border-(--ui-bg-accented)'"
            @click="toggleExpanded(category.id)"
          >
            <span class="text-base text-(--ui-text-toned)">{{ category.name }}</span>
            <div class="flex items-center gap-2">
              <UBadge
                :color="isCategoryDone(category.id) ? (isCategoryPassed(category.id) ? 'success' : 'error') : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ isCategoryDone(category.id)
                  ? (isCategoryPassed(category.id) ? 'Passed' : 'Failed')
                  : `${getCategoryEvaluatedCount(category.id)}/${getTasksForCategory(category.id).length} tested` }}
              </UBadge>
              <UIcon
                :name="expandedCategory === category.id ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                class="size-6 text-(--ui-text-toned)"
              />
            </div>
          </button>

          <!-- Task rows -->
          <Transition name="accordion">
            <div v-if="expandedCategory === category.id" class="flex flex-col gap-2 overflow-hidden">
              <div v-for="task in getTasksForCategory(category.id)" :key="task.partId" class="pl-4">

                <!-- OOS task (not testable) -->
                <div
                  v-if="isOosTask(task.partId)"
                  class="w-full bg-(--ui-bg-elevated) border border-warning/30 rounded-md px-4 py-3.5 flex items-center justify-between opacity-60"
                >
                  <span class="text-base text-(--ui-text-muted) line-through">{{ task.partName }}</span>
                  <span class="flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-warning/10 text-warning">
                    <UIcon name="i-lucide-package-x" class="size-3" />
                    Out of Stock
                  </span>
                </div>

                <!-- Normal task (testable) -->
                <div
                  v-else
                  class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3.5 flex items-center justify-between transition-all duration-150"
                  :class="taskRowClass(task.partId)"
                >
                  <span class="text-base text-(--ui-text-toned)">{{ task.partName }}</span>
                  <div class="flex items-center gap-2 shrink-0">
                    <!-- Action badge -->
                    <span
                      class="flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                      :class="task.action === 'replace' ? 'bg-error/10 text-error' : 'bg-info/10 text-info'"
                    >
                      <UIcon :name="task.action === 'replace' ? 'i-lucide-refresh-cw' : 'i-lucide-wrench'" class="size-3" />
                      {{ task.action === 'replace' ? 'Replace' : 'Adjust' }}
                    </span>

                    <!-- Pass button -->
                    <button
                      class="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 border text-xs font-bold"
                      :class="getResult(task.partId) === 'pass'
                        ? 'bg-(--ui-success) border-(--ui-success) text-white'
                        : 'border-(--ui-border-accented) text-(--ui-text-muted) hover:border-(--ui-success) hover:text-(--ui-success)'"
                      @click="setResult(task.partId, 'pass')"
                    >
                      <UIcon name="i-lucide-check" class="size-3.5" />
                    </button>

                    <!-- Fail button -->
                    <button
                      class="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 border text-xs font-bold"
                      :class="getResult(task.partId) === 'fail'
                        ? 'bg-error border-error text-white'
                        : 'border-(--ui-border-accented) text-(--ui-text-muted) hover:border-error hover:text-error'"
                      @click="setResult(task.partId, 'fail')"
                    >
                      <UIcon name="i-lucide-x" class="size-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </Transition>
        </template>
      </div>
    </div>

    <!-- Confirm submit modal -->
    <UModal v-model:open="confirmOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div
            class="w-11 h-11 rounded-full flex items-center justify-center"
            :class="hasFails ? 'bg-error/15' : 'bg-success/15'"
          >
            <UIcon
              :name="hasFails ? 'i-lucide-alert-circle' : 'i-lucide-check-circle'"
              class="size-6"
              :class="hasFails ? 'text-error' : 'text-success'"
            />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              {{ hasFails ? 'Bike failed quality check' : 'Bike passed quality check' }}
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              {{ hasFails
                ? `${failCount} task(s) failed. The bike will be flagged for re-work.`
                : 'All tasks verified. The bike is ready to deploy.' }}
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="confirmOpen = false">Cancel</UButton>
          <UButton block :color="hasFails ? 'error' : 'success'" @click="onConfirm">Confirm</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { MockTask } from '~/composables/usePartsData'
import { MOCK_TASKS } from '~/composables/usePartsData'
import { calcRepairCategory, useBikeStore } from '~/composables/useBikeStore'
import type { AssignedPart } from '~/composables/useDiagnoser'

const { CATEGORIES } = usePartsData()
const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))
const { getRecord } = useBikeStore()
const { incrementTested } = useTesterShift()
const { reset, setResult, getResult, allEvaluated, hasFailures } = useTester()
const toast = useToast()

const expandedCategory = ref<string | null>(null)
const confirmOpen = ref(false)

onMounted(() => reset())

const bikeRecord = computed(() => getRecord(bikeId.value))

// Task list: from mechanic's actual work or fall back to mock
const taskList = computed<MockTask[]>(() => bikeRecord.value?.mechanicTasks ?? [...MOCK_TASKS])
const oosIds = computed<string[]>(() => bikeRecord.value?.mechanicOosIds ?? [])

function isOosTask(partId: string) {
  return oosIds.value.includes(partId)
}

// Only evaluable (non-OOS) tasks
const evaluableTaskIds = computed(() =>
  taskList.value.filter(t => !isOosTask(t.partId)).map(t => t.partId),
)

const categoryInfo = computed(() => {
  if (bikeRecord.value) return bikeRecord.value.category
  const mockParts = new Map<string, AssignedPart>(
    taskList.value.map(t => [t.partId, { categoryId: t.categoryId, partId: t.partId, partName: t.partName, action: t.action }]),
  )
  return calcRepairCategory(mockParts)
})

const taskCategories = computed(() =>
  CATEGORIES.filter(cat => taskList.value.some(t => t.categoryId === cat.id)),
)

function getTasksForCategory(categoryId: string) {
  return taskList.value.filter(t => t.categoryId === categoryId)
}

function getCategoryEvaluatedCount(categoryId: string) {
  return getTasksForCategory(categoryId)
    .filter(t => !isOosTask(t.partId) && getResult(t.partId) !== null)
    .length
}

function isCategoryDone(categoryId: string) {
  const tasks = getTasksForCategory(categoryId).filter(t => !isOosTask(t.partId))
  return tasks.length > 0 && tasks.every(t => getResult(t.partId) !== null)
}

function isCategoryPassed(categoryId: string) {
  return getTasksForCategory(categoryId)
    .filter(t => !isOosTask(t.partId))
    .every(t => getResult(t.partId) === 'pass')
}

function taskRowClass(partId: string) {
  const r = getResult(partId)
  if (r === 'pass') return 'border-(--ui-success) bg-(--ui-success)/5'
  if (r === 'fail') return 'border-error bg-error/5'
  return 'border-(--ui-bg-accented)'
}

// Bike overlay: partially tested → yellow, all passed → green
const partialCategoryIds = computed(() => {
  const ids = new Set<string>()
  taskCategories.value.forEach((cat) => {
    const count = getCategoryEvaluatedCount(cat.id)
    const total = getTasksForCategory(cat.id).filter(t => !isOosTask(t.partId)).length
    if (count > 0 && count < total) ids.add(cat.id)
  })
  return ids
})

const passedCategoryIds = computed(() => {
  const ids = new Set<string>()
  taskCategories.value.forEach((cat) => {
    if (isCategoryDone(cat.id) && isCategoryPassed(cat.id)) ids.add(cat.id)
  })
  return ids
})

function toggleExpanded(categoryId: string) {
  expandedCategory.value = expandedCategory.value === categoryId ? null : categoryId
}

function handleSelectCategory(categoryId: string) {
  if (taskCategories.value.some(c => c.id === categoryId)) toggleExpanded(categoryId)
}

const hasFails = computed(() => hasFailures(evaluableTaskIds.value))
const failCount = computed(() =>
  evaluableTaskIds.value.filter(id => getResult(id) === 'fail').length,
)

function onSubmit() {
  confirmOpen.value = true
}

function onConfirm() {
  confirmOpen.value = false
  incrementTested()
  toast.add({
    title: hasFails.value ? 'Bike failed quality check.' : 'Bike passed quality check.',
    color: hasFails.value ? 'error' : 'success',
    icon: hasFails.value ? 'i-lucide-alert-circle' : 'i-lucide-check-circle',
    duration: 4000,
  })
  router.push('/tester')
}
</script>

<style scoped>
.accordion-enter-active { transition: opacity 0.2s ease, transform 0.22s ease; }
.accordion-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.accordion-enter-from, .accordion-leave-to { opacity: 0; transform: translateY(-6px); }

.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
