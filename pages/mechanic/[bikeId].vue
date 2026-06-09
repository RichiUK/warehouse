<template>
  <div class="relative h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-20 bg-(--ui-bg) px-4 pt-9 pb-2">
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
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto pt-16 pb-8">

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
                  <!-- Tap area for done toggle -->
                  <button class="flex-1 text-left min-w-0 pr-3" @click="toggleTask(task.partId)">
                    <p
                      class="text-base leading-snug"
                      :class="isOos(task.partId) ? 'text-(--ui-text-muted) line-through' : 'text-(--ui-text-toned)'"
                    >
                      {{ task.partName }}
                    </p>
                    <!-- Source tag — only shown for mechanic-added parts -->
                    <p v-if="task.source === 'mechanic'" class="text-xs text-(--ui-primary) mt-0.5 font-medium">
                      + Added by you
                    </p>
                  </button>

                  <div class="flex items-center gap-2 shrink-0">
                    <!-- OOS tag (when marked OOS) -->
                    <span
                      v-if="isOos(task.partId)"
                      class="flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-warning/10 text-warning"
                    >
                      <UIcon name="i-lucide-package-x" class="size-3" />
                      OOS
                    </span>

                    <!-- OOS toggle button -->
                    <button
                      class="w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0"
                      :class="isOos(task.partId)
                        ? 'bg-warning/15 text-warning'
                        : 'text-(--ui-text-dimmed) hover:text-warning hover:bg-warning/10'"
                      :title="isOos(task.partId) ? 'Remove OOS tag' : 'Mark as out of stock'"
                      @click="toggleOos(task.partId)"
                    >
                      <UIcon name="i-lucide-package-x" class="size-4" />
                    </button>

                    <!-- Done checkbox (disabled when OOS) -->
                    <button
                      class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 shrink-0"
                      :class="isChecked(task.partId)
                        ? 'bg-(--ui-success) border-(--ui-success)'
                        : isOos(task.partId)
                          ? 'border-(--ui-border-accented) opacity-30 cursor-not-allowed'
                          : 'border-(--ui-border-accented) bg-transparent'"
                      :disabled="isOos(task.partId)"
                      @click="!isOos(task.partId) && toggleTask(task.partId)"
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

    <!-- Confirm submit modal -->
    <UModal v-model:open="confirmOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-success/15 flex items-center justify-center">
            <UIcon name="i-lucide-check-circle" class="size-6 text-success" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              Mark bike as repaired?
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              {{ taskList.length }} task{{ taskList.length !== 1 ? 's' : '' }} complete
              <template v-if="oosTaskIds.size > 0">, {{ oosTaskIds.size }} out of stock</template>.
              <template v-if="mechanicAddedCount > 0"> You added {{ mechanicAddedCount }} part{{ mechanicAddedCount !== 1 ? 's' : '' }} beyond the diagnosis.</template>
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="confirmOpen = false">Cancel</UButton>
          <UButton block color="success" @click="onConfirm">Confirm</UButton>
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
const { getRecord, storeMechanicWork } = useBikeStore()
const { currentName } = useRole()
const toast = useToast()
const { incrementRepaired } = useMechanicShift()
const {
  checkedTaskIds,
  oosTaskIds,
  taskList,
  allTasksDone,
  hasUnsavedProgress,
  reset,
  initFromDiagnosis,
  toggleTask,
  toggleOos,
  isChecked,
  isOos,
  isDone,
  updateTaskList,
} = useMechanic()

const expandedCategory = ref<string | null>(null)
const controlsOpen = ref(true)
const leaveConfirmOpen = ref(false)
const confirmOpen = ref(false)
const addPartsOpen = ref(false)

onMounted(() => {
  const record = getRecord(bikeId.value)
  if (record?.diagnosedParts?.length) {
    initFromDiagnosis(record.diagnosedParts)
  }
  else {
    reset()
  }
})

const bikeRecord = computed(() => getRecord(bikeId.value))

// Live repair category — recalculates as tasks/OOS changes
const liveCategory = computed(() =>
  calcRepairCategory(taskList.value.length, oosTaskIds.value.size > 0),
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
  confirmOpen.value = true
}

function onConfirm() {
  confirmOpen.value = false
  storeMechanicWork(
    bikeId.value,
    currentName.value,
    taskList.value as MockTask[],
    Array.from(oosTaskIds.value),
  )
  incrementRepaired()
  toast.add({
    title: 'Bike repair logged.',
    description: `${taskList.value.length} tasks · ${oosTaskIds.value.size} OOS${mechanicAddedCount.value > 0 ? ` · ${mechanicAddedCount.value} added by you` : ''}`,
    color: 'success',
    icon: 'i-lucide-check-circle',
    duration: 4000,
  })
  router.push('/mechanic')
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
