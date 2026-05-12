<template>
  <div class="relative h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-9 pb-2 bg-(--ui-bg)">
      <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" size="sm" @click="onBack" />
      <Transition name="fade">
        <UButton
          v-if="allTasksChecked"
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

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto pt-16 pb-36">
      <!-- Bike viewer -->
      <div
        class="relative transition-all duration-300 ease-in-out"
        :class="bikeSmall ? 'px-[72px] py-2' : 'px-[18.74px] py-4'"
      >
        <BikeViewer
          :active-category-id="expandedCategory"
          :has-selections="checkedTaskIds.size > 0"
          :selected-category-ids="pendingCategoryIds"
          :completed-category-ids="completedCategoryIds"
          @select-category="handleSelectCategory"
        />
      </div>

      <!-- Parts accordion -->
      <div class="px-2 flex flex-col gap-2">
        <template v-for="category in taskCategories" :key="category.id">
          <!-- Category header -->
          <button
            class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-4 flex items-center justify-between transition-colors duration-200"
            :class="expandedCategory === category.id
              ? 'border-(--ui-text-muted)'
              : 'border-(--ui-bg-accented)'"
            @click="toggleExpanded(category.id)"
          >
            <span class="text-base text-(--ui-text-toned)">{{ category.name }}</span>
            <div class="flex items-center gap-2">
              <!-- Task count badge — yellow when pending, green when all done -->
              <UBadge
                :color="isCategoryComplete(category.id) ? 'success' : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ isCategoryComplete(category.id)
                  ? 'Done'
                  : `${getCategoryCheckedCount(category.id)}/${getCategoryTaskCount(category.id)} tasks` }}
              </UBadge>
              <UIcon
                :name="expandedCategory === category.id ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                class="size-6 text-(--ui-text-toned) transition-transform duration-200"
              />
            </div>
          </button>

          <!-- Task rows -->
          <Transition name="accordion">
            <div
              v-if="expandedCategory === category.id"
              class="flex flex-col gap-2 overflow-hidden"
            >
              <div
                v-for="task in getTasksForCategory(category.id)"
                :key="task.partId"
                class="pl-4"
              >
                <button
                  class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-4 flex items-center justify-between transition-all duration-150"
                  :class="isChecked(task.partId)
                    ? 'border-(--ui-success) bg-(--ui-success)/5'
                    : 'border-(--ui-bg-accented)'"
                  @click="toggleTask(task.partId)"
                >
                  <span class="text-base text-(--ui-text-toned)">{{ task.partName }}</span>
                  <div class="flex items-center gap-2">
                    <!-- Action badge -->
                    <span
                      class="flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                      :class="task.action === 'replace'
                        ? 'bg-error/10 text-error'
                        : 'bg-info/10 text-info'"
                    >
                      <UIcon
                        :name="task.action === 'replace' ? 'i-lucide-refresh-cw' : 'i-lucide-wrench'"
                        class="size-3"
                      />
                      {{ task.action === 'replace' ? 'Replace' : 'Adjust' }}
                    </span>
                    <!-- Checkbox -->
                    <div
                      class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 shrink-0"
                      :class="isChecked(task.partId)
                        ? 'bg-(--ui-success) border-(--ui-success)'
                        : 'border-(--ui-border-accented) bg-transparent'"
                    >
                      <UIcon
                        v-if="isChecked(task.partId)"
                        name="i-lucide-check"
                        class="size-3 text-white"
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </Transition>
        </template>
      </div>
    </div>

    <!-- Controls drawer -->
    <ControlsDrawer v-model="controlsOpen" />

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
              Your progress on this bike will be lost if you go back now.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="leaveConfirmOpen = false">
            Cancel
          </UButton>
          <UButton block color="error" @click="onConfirmLeave">
            Leave
          </UButton>
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
              All tasks are complete. This will log the repair and return to your shift.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="confirmOpen = false">
            Cancel
          </UButton>
          <UButton block color="success" @click="onConfirm">
            Confirm
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { MOCK_TASKS } from '~/composables/usePartsData'

const { CATEGORIES } = usePartsData()
const router = useRouter()
const toast = useToast()
const { incrementRepaired } = useMechanicShift()
const { checkedTaskIds, reset, toggleTask, isChecked } = useMechanic()

const expandedCategory = ref<string | null>(null)
const controlsOpen = ref(true)
const leaveConfirmOpen = ref(false)
const confirmOpen = ref(false)

onMounted(() => {
  reset()
})

// Only show categories that have mock tasks
const taskCategories = computed(() =>
  CATEGORIES.filter(cat => MOCK_TASKS.some(t => t.categoryId === cat.id)),
)

function getTasksForCategory(categoryId: string) {
  return MOCK_TASKS.filter(t => t.categoryId === categoryId)
}

function getCategoryTaskCount(categoryId: string) {
  return MOCK_TASKS.filter(t => t.categoryId === categoryId).length
}

function getCategoryCheckedCount(categoryId: string) {
  return MOCK_TASKS.filter(t => t.categoryId === categoryId && isChecked(t.partId)).length
}

function isCategoryComplete(categoryId: string) {
  const tasks = getTasksForCategory(categoryId)
  return tasks.length > 0 && tasks.every(t => isChecked(t.partId))
}

// All tasks checked → enable submit
const allTasksChecked = computed(() =>
  MOCK_TASKS.length > 0 && MOCK_TASKS.every(t => isChecked(t.partId)),
)

// Categories with some checked (but not complete) → yellow highlight on bike
const pendingCategoryIds = computed(() => {
  const ids = new Set<string>()
  MOCK_TASKS.forEach((task) => {
    if (isChecked(task.partId) && !isCategoryComplete(task.categoryId)) {
      ids.add(task.categoryId)
    }
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

// Shrink bike when a category is expanded
const bikeSmall = computed(() => expandedCategory.value !== null)

function toggleExpanded(categoryId: string) {
  controlsOpen.value = false
  expandedCategory.value = expandedCategory.value === categoryId ? null : categoryId
}

function handleSelectCategory(categoryId: string) {
  // Only respond to clicks on categories that have tasks
  if (taskCategories.value.some(c => c.id === categoryId)) {
    toggleExpanded(categoryId)
  }
}

function onBack() {
  if (checkedTaskIds.value.size > 0) {
    leaveConfirmOpen.value = true
  } else {
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
  incrementRepaired()
  toast.add({
    title: 'The bike was successfully repaired.',
    color: 'success',
    icon: 'i-lucide-check-circle',
    duration: 4000,
  })
  router.push('/mechanic')
}
</script>

<style scoped>
/* Accordion open/close */
.accordion-enter-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}
.accordion-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.accordion-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Generic fade */
.fade-enter-active {
  transition: opacity 0.2s ease;
}
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
