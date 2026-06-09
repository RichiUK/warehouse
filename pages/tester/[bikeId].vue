<template>
  <div class="relative h-dvh bg-(--ui-bg) flex flex-col">

    <!-- Header -->
    <div class="shrink-0 bg-(--ui-bg) px-4 pt-9 pb-2">
      <div class="flex items-center gap-3">
        <!-- Back -->
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" size="sm" @click="router.push('/tester')" />
        <!-- Title -->
        <p class="flex-1 text-base font-black uppercase tracking-wide leading-none">
          <span class="text-(--ui-text-highlighted)">BIKE </span><span class="text-(--ui-primary)">{{ bikeId }}</span>
        </p>
        <!-- Submit button — appears when all evaluated -->
        <Transition name="fade">
          <UButton
            v-if="allChecklistEvaluated"
            :color="failedChecks.length > 0 ? 'error' : 'success'"
            size="sm"
            trailing
            @click="onFinish"
          >
            {{ failedChecks.length > 0 ? `${failedChecks.length} failed` : 'All passed' }}
          </UButton>
        </Transition>
      </div>

      <!-- Timer + progress strip -->
      <div class="flex items-center gap-3 mt-2 pb-0.5">
        <div class="flex items-center gap-1.5 text-xs text-(--ui-text-muted) shrink-0">
          <UIcon name="i-lucide-timer" class="size-3.5" />
          <span class="font-mono tabular-nums">{{ elapsedDisplay }}</span>
        </div>
        <div class="flex-1 h-1 bg-(--ui-bg-accented) rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="failedChecks.length > 0 ? 'bg-error' : 'bg-(--ui-success)'"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
        <span class="text-xs text-(--ui-text-muted) shrink-0 tabular-nums">{{ evaluatedCount }}/{{ TESTER_CHECKLIST.length }}</span>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="shrink-0 mx-4 mb-3 grid grid-cols-2 divide-x divide-(--ui-bg-accented) border border-(--ui-bg-accented) rounded-xl overflow-hidden bg-(--ui-bg-elevated)">
      <div class="flex flex-col items-center justify-center py-2.5 gap-1">
        <span
          class="size-2.5 rounded-full"
          :class="bikeCtx.iotStatus === 'online' ? 'bg-success shadow-[0_0_6px_theme(colors.green.400)]' : 'bg-error'"
        />
        <span class="text-xs font-medium" :class="bikeCtx.iotStatus === 'online' ? 'text-(--ui-text-toned)' : 'text-error'">
          {{ bikeCtx.iotStatus === 'online' ? 'Online' : 'Offline' }}
        </span>
      </div>
      <div class="flex flex-col items-center justify-center py-2.5 gap-1">
        <UIcon
          :name="bikeCtx.batteryLevel > 60 ? 'i-lucide-battery-full' : bikeCtx.batteryLevel > 25 ? 'i-lucide-battery-medium' : 'i-lucide-battery-low'"
          class="size-5"
          :class="bikeCtx.batteryLevel <= 25 ? 'text-error' : 'text-(--ui-text-toned)'"
        />
        <span class="text-xs font-medium" :class="bikeCtx.batteryLevel <= 25 ? 'text-error' : 'text-(--ui-text-toned)'">
          {{ bikeCtx.batteryLevel }}%
        </span>
      </div>
    </div>

    <!-- Divider -->
    <div class="shrink-0 mx-4 border-t border-(--ui-bg-accented) mb-3" />

    <!-- Scrollable checklist -->
    <div class="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-2.5">
      <div
        v-for="check in TESTER_CHECKLIST"
        :key="check.id"
        class="flex gap-2 items-stretch"
      >
        <!-- Label card -->
        <div
          class="flex-1 bg-(--ui-bg-elevated) border rounded-xl px-4 py-3 flex flex-col justify-center transition-colors duration-150 min-w-0"
          :class="checkCardClass(check.id)"
        >
          <p class="text-sm font-medium leading-snug" :class="getResult(check.id) ? 'text-(--ui-text-highlighted)' : 'text-(--ui-text-toned)'">
            {{ check.label }}
          </p>
          <p class="text-xs text-(--ui-text-muted) mt-0.5 leading-relaxed">{{ check.description }}</p>
        </div>

        <!-- Pass button -->
        <button
          class="shrink-0 w-[82px] flex flex-col items-center justify-center gap-1.5 rounded-xl border transition-all duration-150 active:scale-95"
          :class="getResult(check.id) === 'pass'
            ? 'bg-success border-success text-white'
            : 'bg-success/10 border-success/25 text-success/70 hover:bg-success/20'"
          @click="setResult(check.id, 'pass')"
        >
          <UIcon name="i-lucide-check" class="size-5 shrink-0" />
          <span class="text-xs font-semibold tracking-wide">Pass</span>
        </button>

        <!-- Fail button -->
        <button
          class="shrink-0 w-[82px] flex flex-col items-center justify-center gap-1.5 rounded-xl border transition-all duration-150 active:scale-95"
          :class="getResult(check.id) === 'fail'
            ? 'bg-error border-error text-white'
            : 'bg-error/10 border-error/25 text-error/70 hover:bg-error/20'"
          @click="setResult(check.id, 'fail')"
        >
          <UIcon name="i-lucide-x" class="size-5 shrink-0" />
          <span class="text-xs font-semibold tracking-wide">Fail</span>
        </button>
      </div>
    </div>

    <!-- Fail flow modal -->
    <UModal v-model:open="failModalOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-error/15 flex items-center justify-center">
            <UIcon name="i-lucide-alert-circle" class="size-6 text-error" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              {{ failedChecks.length }} check{{ failedChecks.length !== 1 ? 's' : '' }} failed
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1">
              Bike returns to Diagnoser · supervisor on shift notified
            </p>
          </div>
          <!-- Failed items list -->
          <div class="flex flex-col gap-1">
            <div
              v-for="check in failedChecks"
              :key="check.id"
              class="flex items-center gap-2 px-3 py-2 bg-error/5 border border-error/20 rounded-lg"
            >
              <UIcon name="i-lucide-x-circle" class="size-3.5 text-error shrink-0" />
              <span class="text-sm text-(--ui-text-toned)">{{ check.label }}</span>
            </div>
          </div>
          <!-- Required notes -->
          <div>
            <p class="text-xs text-(--ui-text-muted) mb-1.5">Notes <span class="text-error">*required</span></p>
            <UTextarea
              v-model="failNotes"
              placeholder="Describe what failed and what the Diagnoser should check..."
              :rows="3"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="failModalOpen = false">Back</UButton>
          <UButton block color="error" :disabled="!failNotes.trim()" @click="onConfirmFail">
            Send back to Diagnoser
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Pass modal -->
    <UModal v-model:open="passModalOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-success/15 flex items-center justify-center">
            <UIcon name="i-lucide-check-circle" class="size-6 text-success" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              All checks passed!
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              <span class="font-medium text-(--ui-text-highlighted)">BIKE {{ bikeId }}</span> → Ready for deployment
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-0.5">
              Test time: <span class="font-mono text-(--ui-text-toned)">{{ elapsedDisplay }}</span>
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="passModalOpen = false">Cancel</UButton>
          <UButton block color="success" @click="onConfirmPass">Confirm pass</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { TESTER_CHECKLIST } from '~/composables/useTester'
import { useBikeStore } from '~/composables/useBikeStore'
import { useBikeContext } from '~/composables/useBikeContext'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { getRecord, storeTesterResult } = useBikeStore()
const { incrementTested } = useTesterShift()
const { currentName } = useRole()
const { dequeueTester } = useBikeQueue()
const bikeCtx = computed(() => useBikeContext(bikeId.value))
const {
  testerStartedAt,
  evaluatedCount,
  allChecklistEvaluated,
  failedChecks,
  start,
  reset,
  setResult,
  getResult,
} = useTester()
const toast = useToast()

const failModalOpen = ref(false)
const passModalOpen = ref(false)
const failNotes = ref('')

// Timer
const elapsedSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  reset()
  start()
  timerInterval = setInterval(() => {
    if (testerStartedAt.value) {
      elapsedSeconds.value = Math.floor((Date.now() - testerStartedAt.value) / 1000)
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

const progressPercent = computed(() =>
  Math.round((evaluatedCount.value / TESTER_CHECKLIST.length) * 100),
)

function checkCardClass(checkId: string) {
  const r = getResult(checkId)
  if (r === 'pass') return 'border-success/40 bg-success/5'
  if (r === 'fail') return 'border-error/40 bg-error/5'
  return 'border-(--ui-bg-accented)'
}

function onFinish() {
  if (failedChecks.value.length > 0) {
    failNotes.value = ''
    failModalOpen.value = true
  }
  else {
    passModalOpen.value = true
  }
}

function onConfirmFail() {
  failModalOpen.value = false
  const failIds = failedChecks.value.map(c => c.id)
  storeTesterResult(bikeId.value, currentName.value, 'fail', failIds, failNotes.value)
  dequeueTester(bikeId.value)
  incrementTested()
  toast.add({
    title: 'Bike failed quality check.',
    description: `${failedChecks.value.length} check(s) failed. Sent back to Diagnoser.`,
    color: 'error',
    icon: 'i-lucide-alert-circle',
    duration: 4000,
  })
  router.push('/tester')
}

function onConfirmPass() {
  passModalOpen.value = false
  storeTesterResult(bikeId.value, currentName.value, 'pass')
  dequeueTester(bikeId.value)
  incrementTested()
  toast.add({
    title: 'Bike passed — ready for deployment!',
    description: `BIKE ${bikeId.value} · Test time: ${elapsedDisplay.value}`,
    color: 'success',
    icon: 'i-lucide-check-circle',
    duration: 4000,
  })
  router.push('/tester')
}
</script>

<style scoped>
.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
