<template>
  <div class="h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="shrink-0 bg-(--ui-bg) px-4 pt-9 pb-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
            size="sm"
            :to="`/mechanic/${encodeURIComponent(bikeId)}`"
          />
          <p class="text-base font-black uppercase tracking-wide leading-none">
            <span class="text-(--ui-text-highlighted)">BIKE </span><span class="text-(--ui-primary)">{{ bikeId }}</span>
          </p>
        </div>
        <Transition name="fade">
          <UButton
            v-if="photoAdded"
            color="success"
            size="sm"
            icon="i-lucide-send"
            trailing
            @click="confirmOpen = true"
          >
            Submit
          </UButton>
        </Transition>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto px-2 pb-8 pt-2 flex flex-col gap-3">

      <!-- Timer summary card -->
      <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-timer" class="size-5 text-(--ui-text-muted) shrink-0" />
          <div>
            <p class="text-sm font-medium text-(--ui-text-highlighted)">Repair time</p>
            <p class="text-xs text-(--ui-text-muted) mt-0.5">Total duration</p>
          </div>
        </div>
        <span class="text-base font-mono font-semibold text-(--ui-text-highlighted)">
          {{ elapsedDisplay }}
        </span>
      </div>

      <!-- Parts summary -->
      <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl overflow-hidden">
        <div class="px-4 py-2.5 border-b border-(--ui-bg-accented) flex items-center gap-2">
          <UIcon name="i-lucide-list-checks" class="size-4 text-(--ui-text-muted)" />
          <span class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted)">
            Parts summary
          </span>
        </div>

        <!-- Counts row -->
        <div class="px-4 py-3 flex items-center justify-around border-b border-(--ui-bg-accented)">
          <div class="flex flex-col items-center gap-0.5">
            <span class="text-lg font-bold text-success">{{ doneCount }}</span>
            <span class="text-xs text-(--ui-text-dimmed)">Done</span>
          </div>
          <div class="w-px h-8 bg-(--ui-bg-accented)" />
          <div class="flex flex-col items-center gap-0.5">
            <span class="text-lg font-bold text-warning">{{ oosCount }}</span>
            <span class="text-xs text-(--ui-text-dimmed)">OOS</span>
          </div>
        </div>

        <!-- Parts list -->
        <div v-if="taskList.length > 0" class="flex flex-col">
          <div
            v-for="(task, i) in taskList"
            :key="task.partId"
            class="px-4 py-2.5 flex items-center justify-between gap-3"
            :class="i < taskList.length - 1 ? 'border-b border-(--ui-bg-accented)' : ''"
          >
            <span class="text-sm text-(--ui-text-toned)">{{ task.partName }}</span>
            <UBadge
              :color="isOos(task.partId) ? 'warning' : isChecked(task.partId) ? 'success' : 'neutral'"
              variant="soft"
              size="xs"
            >
              {{ isOos(task.partId) ? 'OOS' : isChecked(task.partId) ? 'Done' : 'Pending' }}
            </UBadge>
          </div>
        </div>

        <div v-else class="px-4 py-3 flex items-center gap-2">
          <UIcon name="i-lucide-info" class="size-4 text-(--ui-text-dimmed)" />
          <span class="text-sm text-(--ui-text-dimmed)">No tasks recorded</span>
        </div>
      </div>

      <!-- Photo upload zone -->
      <button
        class="w-full border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 transition-colors duration-200"
        :class="photoAdded
          ? 'border-success/50 bg-success/5'
          : 'border-(--ui-bg-accented) bg-(--ui-bg-elevated) active:bg-(--ui-bg-accented)'"
        @click="photoAdded = true"
      >
        <UIcon
          :name="photoAdded ? 'i-lucide-camera' : 'i-lucide-camera'"
          class="size-8"
          :class="photoAdded ? 'text-success' : 'text-(--ui-text-dimmed)'"
        />
        <span
          class="text-sm font-medium"
          :class="photoAdded ? 'text-success' : 'text-(--ui-text-muted)'"
        >
          {{ photoAdded ? 'Photo added ✓' : 'Add photo (required)' }}
        </span>
        <span v-if="!photoAdded" class="text-xs text-(--ui-text-dimmed)">
          Tap to attach a photo of the completed repair
        </span>
      </button>

      <!-- Comments field -->
      <UTextarea
        v-model="repairNotes"
        placeholder="Add any notes for the tester..."
        :rows="3"
        class="w-full"
      />

      <!-- Submit button -->
      <UButton
        block
        size="xl"
        color="success"
        :disabled="!photoAdded"
        class="h-14 text-base font-medium"
        @click="confirmOpen = true"
      >
        Submit repair
      </UButton>

    </div>

    <!-- Confirmation modal -->
    <UModal v-model:open="confirmOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-success/15 flex items-center justify-center">
            <UIcon name="i-lucide-check-circle" class="size-6 text-success" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              Submit repair?
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              {{ doneCount }} part{{ doneCount !== 1 ? 's' : '' }} done
              <template v-if="oosCount > 0">, {{ oosCount }} out of stock</template>.
              This will log the repair and send the bike to testing.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="confirmOpen = false">Cancel</UButton>
          <UButton block color="success" :loading="submitting" @click="onConfirm">Confirm</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { MockTask } from '~/composables/usePartsData'
import { useBikeStore } from '~/composables/useBikeStore'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { storeMechanicWork } = useBikeStore()
const { currentName } = useRole()
const { incrementRepaired } = useMechanicShift()
const { dequeueMechanic, enqueuePdi } = useBikeQueue()
const { taskList, checkedTaskIds, oosTaskIds, isChecked, isOos } = useMechanic()
const toast = useToast()

const photoAdded = ref(false)
const repairNotes = ref('')
const confirmOpen = ref(false)
const submitting = ref(false)

// Pull elapsed from query param e.g. ?elapsed=04:32
const elapsedDisplay = computed(() => {
  const q = route.query.elapsed
  return typeof q === 'string' && q ? q : '—'
})

const doneCount = computed(() => checkedTaskIds.value.size)
const oosCount = computed(() => oosTaskIds.value.size)

async function onConfirm() {
  submitting.value = true
  confirmOpen.value = false
  storeMechanicWork(
    bikeId.value,
    currentName.value,
    taskList.value as MockTask[],
    Array.from(oosTaskIds.value),
  )
  dequeueMechanic(bikeId.value)
  enqueuePdi(bikeId.value)
  incrementRepaired()
  toast.add({
    title: 'Bike repair logged.',
    description: `${doneCount.value} part${doneCount.value !== 1 ? 's' : ''} done${oosCount.value > 0 ? `, ${oosCount.value} OOS` : ''}.`,
    color: 'success',
    icon: 'i-lucide-check-circle',
    duration: 4000,
  })
  router.push('/mechanic')
}
</script>

<style scoped>
.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
