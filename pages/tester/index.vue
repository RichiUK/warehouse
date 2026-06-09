<template>
  <div class="h-dvh bg-(--ui-bg) flex flex-col overflow-hidden">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 pt-10 pb-2 shrink-0 h-16">
      <template v-if="isShiftActive">
        <p class="text-sm text-(--ui-text-muted)">
          {{ testerQueue.length > 0 ? `${testerQueue.length} bike${testerQueue.length !== 1 ? 's' : ''} waiting` : 'No bikes in queue' }}
        </p>
      </template>
      <UButton
        v-else
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        size="sm"
        to="/"
      />
      <Transition name="fade">
        <UButton
          v-if="isShiftActive"
          color="error"
          size="sm"
          icon="i-lucide-arrow-right"
          trailing
          @click="endShiftConfirmOpen = true"
        >
          End Shift
        </UButton>
      </Transition>
    </div>

    <!-- Centered greeting (pre-shift) -->
    <template v-if="!isShiftActive">
      <div class="flex-1 flex flex-col items-center justify-center text-center px-4">
        <p class="text-3xl font-semibold text-(--ui-text-highlighted) leading-snug">
          {{ greeting }},<br />{{ currentName }}
        </p>
      </div>
    </template>

    <!-- Active shift: queue list or empty state -->
    <template v-else>
      <div class="flex-1 overflow-y-auto px-4 pt-2 pb-4 flex flex-col gap-3">
        <Transition name="fade" mode="out-in">
          <!-- Queue list -->
          <div v-if="testerQueue.length > 0" key="queue" class="flex flex-col gap-2">
            <p class="text-xs text-(--ui-text-dimmed) uppercase tracking-wider px-1 mb-1">Ready for testing</p>
            <button
              v-for="entry in testerQueue"
              :key="entry.bikeId"
              class="w-full bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3.5 flex items-center gap-3 text-left active:bg-(--ui-bg-accented) transition-colors"
              @click="router.push(`/tester/job-card/${encodeURIComponent(entry.bikeId)}`)"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-base font-black uppercase tracking-wide text-(--ui-text-highlighted)">
                    BIKE <span class="text-(--ui-primary)">{{ entry.bikeId }}</span>
                  </p>
                  <UBadge color="success" variant="soft" size="xs">PDI done</UBadge>
                </div>
                <p class="text-xs text-(--ui-text-muted)">
                  PDI by
                  <span class="font-medium text-(--ui-text-toned)">{{ getRecord(entry.bikeId)?.pdiName ?? '—' }}</span>
                  <span class="text-(--ui-text-dimmed)"> · {{ queueTimeAgo(entry.addedAt, now) }}</span>
                </p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="size-5 text-(--ui-text-dimmed) shrink-0" />
            </button>
          </div>

          <!-- Empty queue -->
          <div v-else key="empty" class="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div class="w-14 h-14 rounded-full bg-(--ui-bg-accented) flex items-center justify-center mb-3">
              <UIcon name="i-lucide-inbox" class="size-7 text-(--ui-text-dimmed)" />
            </div>
            <p class="text-lg font-semibold text-(--ui-text-highlighted)">No bikes yet</p>
            <p class="text-sm text-(--ui-text-muted) mt-1">Bikes will appear here after PDI</p>
          </div>
        </Transition>
      </div>
    </template>

    <!-- Stats card -->
    <div class="px-4 pb-3 shrink-0">
      <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-4 flex items-center justify-between w-full">
        <div class="flex flex-col gap-0.5">
          <span class="text-base text-(--ui-text-muted)">
            {{ isShiftActive ? 'Bikes Tested' : 'Last Shift Bikes Tested' }}
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
        block size="xl" color="info"
        class="h-14 text-base font-medium"
        @click="startShift"
      >
        Start shift
      </UButton>
      <UButton
        v-else
        block size="xl" color="neutral"
        variant="outline"
        icon="i-lucide-scan-qr-code"
        to="/scan"
        class="h-12 text-sm font-medium"
      >
        Scan a bike manually
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
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="endShiftConfirmOpen = false">Cancel</UButton>
          <UButton block color="success" @click="onConfirmEndShift">Confirm</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { queueTimeAgo } from '~/composables/useBikeQueue'
import { useBikeStore } from '~/composables/useBikeStore'

const router = useRouter()
const { isShiftActive, currentSessionCount, lastShiftCount, lastShiftEndedAt, startShift, endShift } = useTesterShift()
const { currentName } = useRole()
const { testerQueue } = useBikeQueue()
const { getRecord } = useBikeStore()

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const greetings: Record<string, string> = {
  Sunday: 'Happy Sunday', Monday: 'Happy Monday', Tuesday: 'Happy Tuesday',
  Wednesday: 'Happy Wednesday', Thursday: 'Happy Thursday', Friday: 'Happy Friday', Saturday: 'Happy Saturday',
}
const greeting = computed(() => greetings[days[new Date().getDay()]])

const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval>
onMounted(() => { ticker = setInterval(() => { now.value = Date.now() }, 15_000) })
onUnmounted(() => clearInterval(ticker))

const lastShiftTimeAgo = computed(() => {
  const endedAt = lastShiftEndedAt.value
  if (!endedAt) return null
  const nowDate = new Date(now.value)
  const yest = new Date(nowDate)
  yest.setDate(yest.getDate() - 1)
  const hh = String(endedAt.getHours()).padStart(2, '0')
  const mm = String(endedAt.getMinutes()).padStart(2, '0')
  if (endedAt.toDateString() === yest.toDateString()) return `yesterday at ${hh}:${mm} hrs.`
  if (endedAt.toDateString() === nowDate.toDateString()) {
    const secs = Math.floor((now.value - endedAt.getTime()) / 1000)
    if (secs < 60) return 'just now'
    const mins = Math.floor(secs / 60)
    return mins < 60 ? `${mins} min${mins > 1 ? 's' : ''} ago` : `${Math.floor(mins / 60)} hour(s) ago`
  }
  return `${endedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${hh}:${mm} hrs.`
})

const endShiftConfirmOpen = ref(false)
function onConfirmEndShift() { endShiftConfirmOpen.value = false; endShift() }
</script>

<style scoped>
.fade-enter-active { transition: opacity 0.3s ease; }
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
