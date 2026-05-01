<template>
  <div class="h-dvh bg-(--ui-bg) flex flex-col overflow-hidden">
    <!-- Top bar -->
    <div class="flex items-center justify-end px-4 pt-10 pb-2 shrink-0 h-16">
      <Transition name="fade">
        <UButton
          v-if="isShiftActive"
          color="error"
          size="sm"
          icon="i-lucide-log-out"
          trailing
          @click="endShiftConfirmOpen = true"
        >
          End Shift
        </UButton>
      </Transition>
    </div>

    <!-- Centered greeting (fills remaining space) -->
    <div class="flex-1 flex flex-col items-center justify-center text-center px-4">
      <Transition name="greeting" mode="out-in">
        <div v-if="!isShiftActive" key="pre">
          <p class="text-3xl font-semibold text-(--ui-text-highlighted) leading-snug">
            {{ greeting }},<br />Alex
          </p>
        </div>
        <div v-else key="active">
          <p class="text-3xl font-semibold text-(--ui-text-highlighted) leading-snug">
            {{ scanPrompt }}
          </p>
          <p class="text-base text-(--ui-text-muted) mt-3">
            Tap the button below to scan a bike
          </p>
        </div>
      </Transition>
    </div>

    <!-- Stats card -->
    <div class="px-4 pb-3 shrink-0">
      <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-4 flex items-center justify-between w-full">
        <div class="flex flex-col gap-0.5">
          <span class="text-base text-(--ui-text-muted)">
            {{ isShiftActive ? 'Bikes Diagnosed' : 'Last Shift Bikes Diagnosed' }}
          </span>
          <Transition name="fade">
            <span v-if="!isShiftActive && lastShiftTimeAgo" class="text-xs text-(--ui-text-dimmed)">
              {{ lastShiftTimeAgo }}
            </span>
          </Transition>
        </div>
        <span class="text-2xl font-bold text-(--ui-text-highlighted)">
          {{ isShiftActive ? currentSessionCount : lastShiftCount }}
        </span>
      </div>
    </div>

    <!-- CTA button -->
    <div class="px-4 pb-10 shrink-0">
      <UButton
        v-if="!isShiftActive"
        block
        size="xl"
        color="info"
        class="h-14 text-base font-medium"
        @click="startShift"
      >
        Start shift
      </UButton>
      <UButton
        v-else
        block
        size="xl"
        color="success"
        icon="i-lucide-scan-qr-code"
        to="/scan"
        class="h-14 text-base font-medium"
      >
        Scan a Bike
      </UButton>
    </div>

    <!-- End shift confirmation modal -->
    <UModal v-model:open="endShiftConfirmOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-warning/15 flex items-center justify-center">
            <UIcon name="i-lucide-alert-circle" class="size-6 text-warning" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              Are you sure you want to End Shift?
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              This will end your shift and stop counting tasks.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="endShiftConfirmOpen = false">
            Cancel
          </UButton>
          <UButton block color="success" @click="onConfirmEndShift">
            Confirm
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { isShiftActive, currentSessionCount, lastShiftCount, lastShiftEndedAt, startShift, endShift } = useShift()

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const greetings: Record<string, string> = {
  Sunday:    'Happy Sunday',
  Monday:    'Happy Monday',
  Tuesday:   'Happy Tuesday',
  Wednesday: 'Happy Wednesday',
  Thursday:  'Happy Thursday',
  Friday:    'Happy Friday',
  Saturday:  'Happy Saturday',
}

const greeting = computed(() => greetings[days[new Date().getDay()]])

const scanPrompts = [
  "Let's find your bike",
  'Scan to get started',
  'Point at the QR code',
  'Ready when you are',
]
const scanPrompt = scanPrompts[Math.floor(Math.random() * scanPrompts.length)]

// Live timestamp for last shift
const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval>
onMounted(() => { ticker = setInterval(() => { now.value = Date.now() }, 15_000) })
onUnmounted(() => clearInterval(ticker))

const lastShiftTimeAgo = computed(() => {
  const endedAt = lastShiftEndedAt.value
  if (!endedAt) return null

  const nowDate = new Date(now.value)

  const isToday = endedAt.toDateString() === nowDate.toDateString()
  const yest = new Date(nowDate)
  yest.setDate(yest.getDate() - 1)
  const isYesterday = endedAt.toDateString() === yest.toDateString()

  const hh = String(endedAt.getHours()).padStart(2, '0')
  const mm = String(endedAt.getMinutes()).padStart(2, '0')

  if (isYesterday) return `yesterday at ${hh}:${mm} hrs.`

  if (isToday) {
    const secs = Math.floor((now.value - endedAt.getTime()) / 1000)
    if (secs < 60) return 'just now'
    const mins = Math.floor(secs / 60)
    if (mins < 60) return mins === 1 ? '1 min ago' : `${mins} mins ago`
    const hrs = Math.floor(mins / 60)
    return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`
  }

  // Older than yesterday
  const day = endedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${day} at ${hh}:${mm} hrs.`
})

// End shift modal
const endShiftConfirmOpen = ref(false)

function onConfirmEndShift() {
  endShiftConfirmOpen.value = false
  endShift()
}
</script>

<style scoped>
.greeting-enter-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.greeting-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.greeting-enter-from   { opacity: 0; transform: translateY(10px); }
.greeting-leave-to     { opacity: 0; transform: translateY(-8px); }

.fade-enter-active { transition: opacity 0.3s ease; }
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }

</style>
