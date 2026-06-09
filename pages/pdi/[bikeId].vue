<template>
  <div class="h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="shrink-0 bg-(--ui-bg) px-4 pt-9 pb-2">
      <div class="flex items-center justify-between">
        <p class="text-base font-black uppercase tracking-wide leading-none">
          <span class="text-(--ui-text-highlighted)">BIKE </span><span class="text-(--ui-primary)">{{ bikeId }}</span>
        </p>
        <UButton variant="ghost" color="neutral" icon="i-lucide-x" size="sm" @click="router.push('/pdi')" />
      </div>
    </div>

    <!-- Stats strip -->
    <div class="shrink-0 mx-4 mb-1 grid grid-cols-2 divide-x divide-(--ui-bg-accented) border border-(--ui-bg-accented) rounded-xl overflow-hidden bg-(--ui-bg-elevated)">
      <!-- IoT status -->
      <div class="flex flex-col items-center justify-center py-3 gap-1">
        <div class="size-5 flex items-center justify-center">
          <span
            class="size-2.5 rounded-full"
            :class="bikeCtx.iotStatus === 'online' ? 'bg-success shadow-[0_0_6px_theme(colors.green.400)]' : 'bg-error'"
          />
        </div>
        <span
          class="text-xs font-medium"
          :class="bikeCtx.iotStatus === 'online' ? 'text-(--ui-text-toned)' : 'text-error'"
        >
          {{ bikeCtx.iotStatus === 'online' ? 'Online' : 'Offline' }}
        </span>
      </div>
      <!-- Battery -->
      <div class="flex flex-col items-center justify-center py-3 gap-1">
        <UIcon
          :name="bikeCtx.batteryLevel > 60 ? 'i-lucide-battery-full' : bikeCtx.batteryLevel > 25 ? 'i-lucide-battery-medium' : 'i-lucide-battery-low'"
          class="size-5"
          :class="bikeCtx.batteryLevel <= 25 ? 'text-error' : 'text-(--ui-text-toned)'"
        />
        <span
          class="text-xs font-medium"
          :class="bikeCtx.batteryLevel <= 25 ? 'text-error' : 'text-(--ui-text-toned)'"
        >
          {{ bikeCtx.batteryLevel }}%
        </span>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto px-4 pb-8 pt-3 flex flex-col gap-3">

      <!-- Audit trail chips -->
      <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl overflow-hidden">
        <div class="px-4 py-2.5 flex items-center gap-2">
          <UIcon name="i-lucide-circle-check" class="size-4 text-(--ui-text-muted) shrink-0" />
          <span class="text-sm text-(--ui-text-muted)">
            Diagnosed by
            <span class="text-(--ui-text-toned) font-medium">{{ bikeRecord?.diagnoserName ?? '—' }}</span>
          </span>
        </div>
        <div class="border-t border-(--ui-bg-accented) px-4 py-2.5 flex items-center gap-2">
          <UIcon name="i-lucide-circle-check" class="size-4 text-(--ui-text-muted) shrink-0" />
          <span class="text-sm text-(--ui-text-muted)">
            Repaired by
            <span class="text-(--ui-text-toned) font-medium">{{ bikeRecord?.mechanicName ?? '—' }}</span>
          </span>
        </div>
      </div>

      <div class="border-t border-(--ui-bg-accented)" />

      <!-- PDI Checklist -->
      <div class="flex flex-col gap-1.5">
        <div
          v-for="task in PDI_TASKS"
          :key="task.id"
          class="bg-(--ui-bg-elevated) border rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-colors duration-150"
          :class="isCompleted(task.id) ? 'border-(--ui-success) bg-success/5' : 'border-(--ui-bg-accented)'"
          @click="toggleTask(task.id)"
        >
          <!-- Icon -->
          <UIcon
            :name="task.icon"
            class="size-5 shrink-0 transition-colors duration-150"
            :class="isCompleted(task.id) ? 'text-success' : 'text-(--ui-text-muted)'"
          />
          <!-- Label -->
          <span
            class="flex-1 text-left text-sm transition-colors duration-150"
            :class="isCompleted(task.id) ? 'text-(--ui-text-highlighted) font-medium' : 'text-(--ui-text-toned)'"
          >
            {{ task.label }}
          </span>
          <!-- Checkbox -->
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 shrink-0"
            :class="isCompleted(task.id)
              ? 'bg-success border-success'
              : 'border-(--ui-border-accented) bg-transparent'"
          >
            <UIcon v-if="isCompleted(task.id)" name="i-lucide-check" class="size-3 text-white" />
          </div>
        </div>
      </div>

      <!-- Notes field -->
      <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl overflow-hidden">
        <div class="px-4 py-2.5 border-b border-(--ui-bg-accented) flex items-center gap-2">
          <UIcon name="i-lucide-message-square" class="size-4 text-(--ui-text-muted)" />
          <span class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted)">Notes</span>
          <span class="ml-auto text-xs text-(--ui-text-dimmed)">Optional</span>
        </div>
        <UTextarea
          v-model="pdiNotes"
          placeholder="Add any observations..."
          :rows="3"
          class="w-full border-none rounded-none bg-transparent"
          variant="none"
        />
      </div>

    </div>

    <!-- Submit CTA — pinned bottom -->
    <div class="shrink-0 px-4 pb-10 pt-3">
      <UButton
        block
        size="xl"
        color="success"
        :disabled="!allDone"
        class="h-14 text-base font-medium"
        @click="confirmOpen = true"
      >
        Submit PDI
      </UButton>
    </div>

    <!-- Confirm submit modal -->
    <UModal v-model:open="confirmOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-success/15 flex items-center justify-center">
            <UIcon name="i-lucide-sparkles" class="size-6 text-success" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              Submit PDI?
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              The bike will be ready for testing.
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
import { useBikeStore } from '~/composables/useBikeStore'
import { useBikeContext } from '~/composables/useBikeContext'
import { PDI_TASKS } from '~/composables/usePdi'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { getRecord, storePdiResult } = useBikeStore()
const { allDone, pdiNotes, reset, toggleTask, isCompleted } = usePdi()
const { incrementPdi } = usePdiShift()
const { dequeuePdi, enqueueTester } = useBikeQueue()
const { currentName } = useRole()
const bikeCtx = computed(() => useBikeContext(bikeId.value))
const toast = useToast()

const confirmOpen = ref(false)

const bikeRecord = computed(() => getRecord(bikeId.value))

onMounted(() => reset())

function onConfirm() {
  confirmOpen.value = false
  storePdiResult(bikeId.value, currentName.value)
  dequeuePdi(bikeId.value)
  enqueueTester(bikeId.value)
  incrementPdi()
  toast.add({
    title: 'PDI complete.',
    description: `Bike ${bikeId.value} is ready for testing.`,
    color: 'success',
    icon: 'i-lucide-sparkles',
    duration: 4000,
  })
  reset()
  router.push('/pdi')
}
</script>

<style scoped>
.fade-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from   { opacity: 0; transform: translateY(6px); }
.fade-leave-to     { opacity: 0; }
</style>
