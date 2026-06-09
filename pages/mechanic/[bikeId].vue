<template>
  <div class="relative h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-20 bg-(--ui-bg) px-4 pt-9 pb-1">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
          <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" size="sm" @click="onBack" />
          <p class="text-base font-black uppercase tracking-wide leading-none">
            <span class="text-(--ui-text-highlighted)">BIKE </span><span class="text-(--ui-primary)">{{ bikeId }}</span>
          </p>
        </div>
        <Transition name="fade">
          <UButton
            v-if="allTasksDone"
            color="success"
            icon="i-lucide-check-check"
            size="sm"
            trailing
            @click="onSubmit"
          >
            Submit
          </UButton>
        </Transition>
      </div>
      <!-- Timer + progress strip -->
      <div class="flex items-center gap-3 mt-1.5 pb-1">
        <div class="flex items-center gap-1.5 text-xs text-(--ui-text-muted)">
          <UIcon name="i-lucide-timer" class="size-3.5" />
          <span class="font-mono">{{ elapsedDisplay }}</span>
        </div>
        <div class="flex-1 h-1.5 bg-(--ui-bg-accented) rounded-full overflow-hidden">
          <div
            class="h-full bg-(--ui-success) rounded-full transition-all duration-300"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
        <span class="text-xs text-(--ui-text-muted)">{{ doneCount }}/{{ taskList.length }}</span>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto pt-20 pb-8">

      <!-- Bike viewer -->
      <div
        class="relative transition-all duration-300 ease-in-out"
        :class="bikeSmall ? 'px-[72px] py-2' : 'px-[18.74px] py-4'"
      >
        <BikeViewer
          :active-category-id="expandedCategory"
          :has-selections="taskList.length > 0"
          :selected-category-ids="partialCategoryIds"
          :completed-category-ids="completedCategoryIds"
          @select-category="handleSelectCategory"
        />
      </div>

      <!-- Handoff card — shows diagnosis origin -->
      <div class="px-2 mb-2">
        <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3 flex items-center gap-3">
          <UIcon name="i-lucide-user" class="size-4 text-(--ui-text-muted) shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-xs text-(--ui-text-muted)">
              Diagnosed by
              <span class="text-(--ui-text-highlighted) font-medium">{{ bikeRecord?.diagnoserName ?? '—' }}</span>
            </p>
            <p v-if="diagnosisCount > 0" class="text-xs text-(--ui-text-dimmed) mt-0.5">
              {{ diagnosisCount }} part{{ diagnosisCount !== 1 ? 's' : '' }} flagged
              <template v-if="mechanicAddedCount > 0">
                · <span class="text-(--ui-primary)">+{{ mechanicAddedCount }} added by you</span>
              </template>
            </p>
          </div>
        </div>
      </div>

      <!-- Live repair category card — updates as tasks change -->
      <div class="px-2 mb-3">
        <div
          class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-colors duration-300"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-clock" class="size-5 text-(--ui-text-muted) shrink-0" />
            <div>
              <p class="text-sm font-medium text-(--ui-text-highlighted)">{{ liveCategory.label }}</p>
              <p class="text-xs text-(--ui-text-muted) mt-0.5">
                {{ taskList.length }} task{{ taskList.length !== 1 ? 's' : '' }}
                <template v-if="oosTaskIds.size > 0">
                  · <span class="text-warning">{{ oosTaskIds.size }} OOS</span>
                </template>
                <template v-if="cannotCompleteIds.size > 0">
                  · <span class="text-error">{{ cannotCompleteIds.size }} cannot complete</span>
                </template>
              </p>
            </div>
          </div>
          <UBadge :color="liveCategory.color" variant="soft" size="sm">
            {{ liveCategory.time }}
          </UBadge>
        </div>
      </div>

      <!-- Add more parts button (above task list) -->
      <div class="px-2 pb-2">
        <UButton
          block
          variant="outline"
          color="neutral"
          icon="i-lucide-plus"
          @click="addPartsOpen = true"
        >
          Add more parts
        </UButton>
      </div>

      <!-- Task accordion -->
      <div class="px-2 flex flex-col gap-2">
        <template v-for="category in taskCategories" :key="category.id">
          <!-- Category header -->
          <button
            class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3.5 flex items-center justify-between transition-colors duration-200"
            :class="expandedCategory === category.id ? 'border-(--ui-text-muted)' : 'border-(--ui-bg-accented)'"
            @click="toggleExpanded(category.id)"
          >
            <span class="text-base text-(--ui-text-toned)">{{ category.name }}</span>
            <div class="flex items-center gap-2">
              <UBadge
                :color="isCategoryComplete(category.id) ? 'success' : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ isCategoryComplete(category.id)
                  ? 'Done'
                  : `${getCategoryDoneCount(category.id)}/${getTasksForCategory(category.id).length}` }}
              </UBadge>
              <UIcon
                :name="expandedCategory === category.id ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                class="size-5 text-(--ui-text-toned)"
              />
            </div>
          </button>

          <!-- Task rows -->
          <Transition name="accordion">
            <div v-if="expandedCategory === category.id" class="flex flex-col gap-1.5 overflow-hidden">
              <div v-for="task in getTasksForCategory(category.id)" :key="task.partId" class="pl-4">
                <div
                  class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3 flex items-center justify-between transition-all duration-150"
                  :class="taskRowClass(task.partId)"
                >
                  <!-- Part name + source tag -->
                  <div class="flex-1 min-w-0 pr-3">
                    <p
                      class="text-base leading-snug"
                      :class="isOos(task.partId) || isCannotComplete(task.partId) ? 'text-(--ui-text-muted) line-through' : 'text-(--ui-text-toned)'"
                    >
                      {{ task.partName }}
                    </p>
                    <p v-if="task.source === 'mechanic'" class="text-xs text-(--ui-primary) mt-0.5 font-medium">
                      + Added by you
                    </p>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <!-- OOS tag (when marked OOS) -->
                    <span
                      v-if="isOos(task.partId)"
                      class="flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-warning/10 text-warning"
                    >
                      <UIcon name="i-lucide-package-x" class="size-3" />
                      OOS
                    </span>

                    <!-- Cannot complete tag -->
                    <span
                      v-if="isCannotComplete(task.partId)"
                      class="flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-error/10 text-error"
                    >
                      <UIcon name="i-lucide-alert-circle" class="size-3" />
                      Can't do
                    </span>

                    <!-- OOS button -->
                    <button
                      class="w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0"
                      :class="isOos(task.partId)
                        ? 'bg-warning/15 text-warning'
                        : 'text-(--ui-text-dimmed) hover:text-warning hover:bg-warning/10'"
                      :title="isOos(task.partId) ? 'Remove OOS tag' : 'Mark as out of stock'"
                      @click="onOosTap(task.partId)"
                    >
                      <UIcon name="i-lucide-package-x" class="size-4" />
                    </button>

                    <!-- Cannot complete button -->
                    <button
                      class="w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0"
                      :class="isCannotComplete(task.partId)
                        ? 'bg-error/15 text-error'
                        : 'text-(--ui-text-dimmed) hover:text-error hover:bg-error/10'"
                      :title="isCannotComplete(task.partId) ? 'Remove cannot-complete' : 'Mark as cannot complete'"
                      @click="toggleCannotComplete(task.partId)"
                    >
                      <UIcon name="i-lucide-ban" class="size-4" />
                    </button>

                    <!-- Done checkbox (disabled when OOS or cannot-complete) -->
                    <button
                      class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 shrink-0"
                      :class="isChecked(task.partId)
                        ? 'bg-(--ui-success) border-(--ui-success)'
                        : (isOos(task.partId) || isCannotComplete(task.partId))
                          ? 'border-(--ui-border-accented) opacity-30 cursor-not-allowed'
                          : 'border-(--ui-border-accented) bg-transparent'"
                      :disabled="isOos(task.partId) || isCannotComplete(task.partId)"
                      @click="!isOos(task.partId) && !isCannotComplete(task.partId) && toggleTask(task.partId)"
                    >
                      <UIcon v-if="isChecked(task.partId)" name="i-lucide-check" class="size-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </template>
      </div>

    </div>

    <!-- Controls drawer -->
    <ControlsDrawer v-model="controlsOpen" />

    <!-- Add more parts sheet -->
    <AddPartsSheet
      v-model="addPartsOpen"
      :current-tasks="taskList"
      @confirm="onAddPartsConfirm"
    />

    <!-- OOS confirmation modal -->
    <UModal v-model:open="oosConfirmOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-warning/15 flex items-center justify-center">
            <UIcon name="i-lucide-package-x" class="size-6 text-warning" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              Tag as Out of Stock?
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              The bike stays in <strong class="text-(--ui-text-toned)">Greenhouse</strong>. Only a tag is added — bike does not change state.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="oosConfirmOpen = false; pendingOosId = null">Cancel</UButton>
          <UButton block color="warning" @click="onOosConfirm">Tag &amp; continue</UButton>
        </div>
      </template>
    </UModal>

    <!-- Leave without saving modal -->
    <UModal v-model:open="leaveConfirmOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-warning/15 flex items-center justify-center">
            <UIcon name="i-lucide-alert-circle" class="size-6 text-warning" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              Leave without finishing?
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              Your progress on this bike will be lost.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="leaveConfirmOpen = false">Cancel</UButton>
          <UButton block color="error" @click="onConfirmLeave">Leave</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { MockTask } from '~/composables/usePartsData'
import { calcRepairCategory, useBikeStore } from '~/composables/useBikeStore'

const { CATEGORIES } = usePartsData()
const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))
const { getRecord } = useBikeStore()
const { currentName } = useRole()
const {
  checkedTaskIds,
  oosTaskIds,
  cannotCompleteIds,
  taskList,
  mechanicStartedAt,
  allTasksDone,
  hasUnsavedProgress,
  reset,
  initFromDiagnosis,
  startTimer,
  toggleTask,
  toggleOos,
  toggleCannotComplete,
  isChecked,
  isOos,
  isCannotComplete,
  isDone,
  updateTaskList,
} = useMechanic()

const expandedCategory = ref<string | null>(null)
const controlsOpen = ref(true)
const leaveConfirmOpen = ref(false)
const addPartsOpen = ref(false)
const oosConfirmOpen = ref(false)
const pendingOosId = ref<string | null>(null)

// Timer
const elapsedSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  const record = getRecord(bikeId.value)
  if (record?.diagnosedParts?.length) {
    initFromDiagnosis(record.diagnosedParts)
  }
  else {
    reset()
    startTimer()
  }
  // Start elapsed counter
  timerInterval = setInterval(() => {
    if (mechanicStartedAt.value) {
      elapsedSeconds.value = Math.floor((Date.now() - mechanicStartedAt.value) / 1000)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const elapsedDisplay = computed(() => {
  const s = elapsedSeconds.value
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
})

const bikeRecord = computed(() => getRecord(bikeId.value))

// Live repair category — recalculates as tasks/OOS changes
const liveCategory = computed(() =>
  calcRepairCategory(taskList.value.length, oosTaskIds.value.size > 0),
)

// Progress
const doneCount = computed(() =>
  taskList.value.filter(t => isDone(t.partId)).length,
)
const progressPercent = computed(() =>
  taskList.value.length > 0 ? Math.round((doneCount.value / taskList.value.length) * 100) : 0,
)

// Traceability counters
const diagnosisCount = computed(() =>
  taskList.value.filter(t => t.source === 'diagnosis').length,
)
const mechanicAddedCount = computed(() =>
  taskList.value.filter(t => t.source === 'mechanic').length,
)

// Categories that have tasks
const taskCategories = computed(() =>
  CATEGORIES.filter(cat => taskList.value.some(t => t.categoryId === cat.id)),
)

function getTasksForCategory(categoryId: string) {
  return taskList.value.filter(t => t.categoryId === categoryId)
}

function getCategoryDoneCount(categoryId: string) {
  return taskList.value.filter(t => t.categoryId === categoryId && isDone(t.partId)).length
}

function isCategoryComplete(categoryId: string) {
  const tasks = getTasksForCategory(categoryId)
  return tasks.length > 0 && tasks.every(t => isDone(t.partId))
}

function taskRowClass(partId: string) {
  if (isChecked(partId)) return 'border-(--ui-success) bg-(--ui-success)/5'
  if (isOos(partId)) return 'border-warning/40 bg-warning/5'
  if (isCannotComplete(partId)) return 'border-error/40 bg-error/5'
  return 'border-(--ui-bg-accented)'
}

// Partially done categories → yellow pulse on bike
const partialCategoryIds = computed(() => {
  const ids = new Set<string>()
  taskCategories.value.forEach((cat) => {
    const done = getCategoryDoneCount(cat.id)
    const total = getTasksForCategory(cat.id).length
    if (done > 0 && done < total) ids.add(cat.id)
  })
  return ids
})

// Fully completed categories → green on bike
const completedCategoryIds = computed(() => {
  const ids = new Set<string>()
  taskCategories.value.forEach((cat) => {
    if (isCategoryComplete(cat.id)) ids.add(cat.id)
  })
  return ids
})

const bikeSmall = computed(() => expandedCategory.value !== null)

function toggleExpanded(categoryId: string) {
  controlsOpen.value = false
  expandedCategory.value = expandedCategory.value === categoryId ? null : categoryId
}

function handleSelectCategory(categoryId: string) {
  if (taskCategories.value.some(c => c.id === categoryId)) toggleExpanded(categoryId)
}

function onAddPartsConfirm(newTasks: MockTask[]) {
  updateTaskList(newTasks)
}

// OOS flow — show confirmation modal first
function onOosTap(taskId: string) {
  if (isOos(taskId)) {
    // Already OOS — remove directly
    toggleOos(taskId)
  }
  else {
    pendingOosId.value = taskId
    oosConfirmOpen.value = true
  }
}

function onOosConfirm() {
  if (pendingOosId.value) {
    toggleOos(pendingOosId.value)
  }
  pendingOosId.value = null
  oosConfirmOpen.value = false
}

function onBack() {
  if (hasUnsavedProgress.value) {
    leaveConfirmOpen.value = true
  }
  else {
    router.push('/mechanic')
  }
}

function onConfirmLeave() {
  leaveConfirmOpen.value = false
  router.push('/mechanic')
}

function onSubmit() {
  // Navigate to submit + photos screen with elapsed time
  router.push(`/mechanic/submit/${encodeURIComponent(bikeId.value)}?elapsed=${elapsedDisplay.value}`)
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
