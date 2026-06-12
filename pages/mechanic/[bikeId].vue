<template>
  <div class="relative h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="shrink-0 bg-(--ui-bg) px-4 pt-9 pb-1">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
          <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" size="sm" @click="onBack" />
          <p class="text-base font-black uppercase tracking-wide leading-none">
            <span class="text-(--ui-text-highlighted)">BIKE </span><span class="text-(--ui-primary)">{{ bikeId }}</span>
          </p>
        </div>
      </div>
      <!-- Timer strip -->
      <div class="flex items-center gap-3 mt-1.5 pb-1">
        <div class="flex items-center gap-1.5 text-xs text-(--ui-text-muted)">
          <UIcon name="i-lucide-timer" class="size-3.5" />
          <span class="font-mono tabular-nums">{{ elapsedDisplay }}</span>
        </div>
        <div class="flex-1 h-1 bg-(--ui-bg-accented) rounded-full" />
        <span class="text-xs text-(--ui-text-muted)">{{ taskList.length }} part{{ taskList.length !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto px-4 pb-8 pt-3 flex flex-col gap-3">

      <!-- Audit card -->
      <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-2.5 flex items-center gap-2">
        <UIcon name="i-lucide-circle-check" class="size-4 text-(--ui-text-muted) shrink-0" />
        <span class="text-sm text-(--ui-text-muted)">
          Diagnosed by
          <span class="text-(--ui-text-toned) font-medium">{{ bikeRecord?.diagnoserName ?? '—' }}</span>
          <template v-if="mechanicAddedCount > 0">
            <span class="text-(--ui-text-dimmed)"> · </span>
            <span class="text-(--ui-primary) font-medium">+{{ mechanicAddedCount }} added by you</span>
          </template>
        </span>
      </div>

      <div class="border-t border-(--ui-bg-accented)" />

      <!-- Parts by category (read-only) -->
      <div class="flex flex-col gap-1.5">
        <template v-for="category in taskCategories" :key="category.id">
          <!-- Category header -->
          <button
            class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3.5 flex items-center justify-between transition-colors duration-200"
            :class="openCats.has(category.id) ? 'border-(--ui-text-muted)' : 'border-(--ui-bg-accented)'"
            @click="toggleCat(category.id)"
          >
            <span class="text-sm text-(--ui-text-toned)">{{ category.name }}</span>
            <div class="flex items-center gap-2">
              <UBadge color="neutral" variant="soft" size="xs">{{ getTasksForCategory(category.id).length }}</UBadge>
              <UIcon
                :name="openCats.has(category.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-4 text-(--ui-text-muted)"
              />
            </div>
          </button>

          <!-- Part rows (read-only) -->
          <Transition name="accordion">
            <div v-if="openCats.has(category.id)" class="flex flex-col gap-1 pl-3">
              <div
                v-for="task in getTasksForCategory(category.id)"
                :key="task.partId"
                class="bg-(--ui-bg-elevated) border rounded-lg px-4 py-2.5 flex items-center gap-3 transition-colors duration-150"
                :class="isOos(task.partId) ? 'border-warning/40 bg-warning/5' : 'border-(--ui-bg-accented)'"
              >
                <UIcon
                  :name="task.source === 'mechanic' ? 'i-lucide-plus-circle' : 'i-lucide-wrench'"
                  class="size-3.5 shrink-0"
                  :class="task.source === 'mechanic' ? 'text-(--ui-primary)' : 'text-(--ui-text-dimmed)'"
                />
                <span
                  class="flex-1 text-sm"
                  :class="isOos(task.partId) ? 'text-(--ui-text-muted) line-through' : 'text-(--ui-text-toned)'"
                >
                  {{ task.partName }}
                </span>
                <span
                  v-if="isOos(task.partId)"
                  class="flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-warning/10 text-warning shrink-0"
                >
                  <UIcon name="i-lucide-package-x" class="size-3" />
                  OOS
                </span>
              </div>
            </div>
          </Transition>
        </template>

        <div v-if="taskList.length === 0" class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3">
          <p class="text-sm text-(--ui-text-dimmed)">No parts on file</p>
        </div>
      </div>

    </div>

    <!-- Complete CTA -->
    <div class="shrink-0 px-4 pb-10 pt-3">
      <UButton
        block
        size="xl"
        color="success"
        icon="i-lucide-check-check"
        trailing
        class="h-14 text-base font-medium"
        @click="onSubmit"
      >
        Complete Repair
      </UButton>
    </div>

    <!-- Leave confirm -->
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
import { useBikeStore } from '~/composables/useBikeStore'

const { CATEGORIES } = usePartsData()
const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { getRecord } = useBikeStore()
const { taskList, oosTaskIds, mechanicStartedAt, isOos } = useMechanic()
const bikeRecord = computed(() => getRecord(bikeId.value))

const leaveConfirmOpen = ref(false)

// Timer (display only)
const elapsedSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
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

const mechanicAddedCount = computed(() =>
  taskList.value.filter(t => t.source === 'mechanic').length,
)

const taskCategories = computed(() =>
  CATEGORIES.filter(cat => taskList.value.some(t => t.categoryId === cat.id)),
)

function getTasksForCategory(categoryId: string) {
  return taskList.value.filter(t => t.categoryId === categoryId)
}

const openCats = ref(new Set<string>())

onMounted(() => {
  const first = taskCategories.value[0]?.id
  if (first) openCats.value.add(first)
})

function toggleCat(id: string) {
  const next = new Set(openCats.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openCats.value = next
}

function onBack() {
  leaveConfirmOpen.value = true
}

function onConfirmLeave() {
  leaveConfirmOpen.value = false
  router.push('/mechanic')
}

function onSubmit() {
  router.push(`/mechanic/submit/${encodeURIComponent(bikeId.value)}?elapsed=${elapsedDisplay.value}`)
}
</script>

<style scoped>
.accordion-enter-active { transition: opacity 0.2s ease, transform 0.22s ease; }
.accordion-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.accordion-enter-from, .accordion-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
