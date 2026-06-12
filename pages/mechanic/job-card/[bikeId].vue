<template>
  <div class="h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="shrink-0 bg-(--ui-bg) px-4 pt-9 pb-2">
      <div class="flex items-center justify-between">
        <p class="text-base font-black uppercase tracking-wide leading-none">
          <span class="text-(--ui-text-highlighted)">BIKE </span><span class="text-(--ui-primary)">{{ bikeId }}</span>
        </p>
        <UButton variant="ghost" color="neutral" icon="i-lucide-x" size="sm" @click="router.push('/mechanic')" />
      </div>
    </div>

    <!-- Stats strip -->
    <div class="shrink-0 mx-4 mb-1 grid grid-cols-3 divide-x divide-(--ui-bg-accented) border border-(--ui-bg-accented) rounded-xl overflow-hidden bg-(--ui-bg-elevated)">
      <div class="flex flex-col items-center justify-center py-3 gap-1">
        <span
          class="size-2.5 rounded-full"
          :class="bikeCtx.iotStatus === 'online' ? 'bg-success shadow-[0_0_6px_theme(colors.green.400)]' : 'bg-error'"
        />
        <span class="text-xs font-medium" :class="bikeCtx.iotStatus === 'online' ? 'text-(--ui-text-toned)' : 'text-error'">
          {{ bikeCtx.iotStatus === 'online' ? 'Online' : 'Offline' }}
        </span>
      </div>
      <div class="flex flex-col items-center justify-center py-3 gap-1">
        <UIcon
          :name="bikeCtx.batteryLevel > 60 ? 'i-lucide-battery-full' : bikeCtx.batteryLevel > 25 ? 'i-lucide-battery-medium' : 'i-lucide-battery-low'"
          class="size-5"
          :class="bikeCtx.batteryLevel <= 25 ? 'text-error' : 'text-(--ui-text-toned)'"
        />
        <span class="text-xs font-medium" :class="bikeCtx.batteryLevel <= 25 ? 'text-error' : 'text-(--ui-text-toned)'">
          {{ bikeCtx.batteryLevel }}%
        </span>
      </div>
      <div class="flex flex-col items-center justify-center py-3 gap-1">
        <UIcon name="i-lucide-clock" class="size-5 text-(--ui-text-toned)" />
        <span class="text-xs font-medium text-(--ui-text-toned)">{{ liveCategory.time }}</span>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto px-4 pb-8 pt-3 flex flex-col gap-3">

      <!-- Audit trail -->
      <div v-if="bikeRecord" class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-2.5 flex items-center gap-2">
        <UIcon name="i-lucide-circle-check" class="size-4 text-(--ui-text-muted) shrink-0" />
        <span class="text-sm text-(--ui-text-muted)">
          Diagnosed by <span class="text-(--ui-text-toned) font-medium">{{ bikeRecord.diagnoserName }}</span>
        </span>
      </div>

      <div class="border-t border-(--ui-bg-accented)" />

      <!-- Diagnosed parts -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-(--ui-text-highlighted)">Parts to repair</span>
          <UBadge :color="liveCategory.color" variant="soft" size="sm">{{ liveCategory.label }}</UBadge>
        </div>

        <div class="flex flex-col gap-1.5">
          <div v-if="diagnosedParts.length === 0" class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3">
            <p class="text-sm text-(--ui-text-dimmed)">No diagnosis on file — repairs will use default task list</p>
          </div>

          <div
            v-for="part in diagnosedParts"
            :key="part.partId"
            class="bg-(--ui-bg-elevated) border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors duration-150"
            :class="localOosIds.has(part.partId) ? 'border-warning/40 bg-warning/5' : 'border-(--ui-bg-accented)'"
          >
            <UIcon name="i-lucide-wrench" class="size-3.5 text-(--ui-text-dimmed) shrink-0" />
            <span
              class="flex-1 text-sm transition-colors duration-150"
              :class="localOosIds.has(part.partId) ? 'text-(--ui-text-muted) line-through' : 'text-(--ui-text-toned)'"
            >
              {{ part.partName }}
            </span>
            <span
              v-if="localOosIds.has(part.partId)"
              class="flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-warning/10 text-warning shrink-0"
            >
              <UIcon name="i-lucide-package-x" class="size-3" />
              OOS
            </span>
            <button
              class="w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0"
              :class="localOosIds.has(part.partId)
                ? 'bg-warning/15 text-warning'
                : 'text-(--ui-text-dimmed) hover:text-warning hover:bg-warning/10'"
              :title="localOosIds.has(part.partId) ? 'Remove OOS' : 'Mark as out of stock'"
              @click="onOosTap(part.partId)"
            >
              <UIcon name="i-lucide-package-x" class="size-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Mechanic-added parts -->
      <template v-if="addedParts.length > 0">
        <div class="border-t border-(--ui-bg-accented)" />
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-(--ui-primary) mb-2">Added by you</p>
          <div class="flex flex-col gap-1.5">
            <div
              v-for="part in addedParts"
              :key="part.partId"
              class="bg-(--ui-bg-elevated) border border-(--ui-primary)/20 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <UIcon name="i-lucide-plus-circle" class="size-3.5 text-(--ui-primary) shrink-0" />
              <span class="flex-1 text-sm text-(--ui-text-toned)">{{ part.partName }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Add parts -->
      <UButton
        block
        variant="outline"
        color="neutral"
        icon="i-lucide-plus"
        @click="addPartsOpen = true"
      >
        Add parts
      </UButton>

      <!-- Guardian report -->
      <div v-if="firstGuardianReport" class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3">
        <div class="flex items-start gap-2.5">
          <UIcon name="i-lucide-shield-alert" class="size-4 text-(--ui-text-muted) shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 mb-1">
              <p class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted)">Guardian Report</p>
              <UBadge
                :color="firstGuardianReport.severity === 'high' ? 'error' : firstGuardianReport.severity === 'medium' ? 'warning' : 'neutral'"
                variant="soft"
                size="xs"
              >
                {{ firstGuardianReport.severity }}
              </UBadge>
            </div>
            <p class="text-sm text-(--ui-text-toned)">{{ firstGuardianReport.text }}</p>
          </div>
        </div>
      </div>

      <!-- Diagnoser notes -->
      <div v-if="bikeRecord?.diagnoserNotes" class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3">
        <div class="flex items-start gap-2.5">
          <UIcon name="i-lucide-message-square" class="size-4 text-(--ui-text-muted) shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted) mb-1">Diagnoser Notes</p>
            <p class="text-sm text-(--ui-text-toned)">{{ bikeRecord.diagnoserNotes }}</p>
          </div>
        </div>
      </div>

    </div>

    <!-- CTA -->
    <div class="shrink-0 px-4 pb-10 pt-3">
      <UButton
        block
        size="xl"
        color="success"
        icon="i-lucide-play"
        trailing
        class="h-14 text-base font-medium"
        @click="onAccept"
      >
        Confirm &amp; Start
      </UButton>
    </div>

    <!-- Add parts sheet — only shows mechanic-added parts, not diagnosed -->
    <AddPartsSheet
      v-model="addPartsOpen"
      :current-tasks="addedParts"
      @confirm="onAddPartsConfirm"
    />

    <!-- OOS confirm modal -->
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
  </div>
</template>

<script setup lang="ts">
import type { MockTask } from '~/composables/usePartsData'
import { calcRepairCategory, useBikeStore } from '~/composables/useBikeStore'
import { useBikeContext } from '~/composables/useBikeContext'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { getRecord } = useBikeStore()
const { setPreTaskState } = useMechanic()
const bikeCtx = computed(() => useBikeContext(bikeId.value))
const bikeRecord = computed(() => getRecord(bikeId.value))
const diagnosedParts = computed(() => bikeRecord.value?.diagnosedParts ?? [])
const firstGuardianReport = computed(() => useBikeContext(bikeId.value).guardianReports[0] ?? null)

const localOosIds = ref(new Set<string>())
const addedParts = ref<MockTask[]>([])
const addPartsOpen = ref(false)
const oosConfirmOpen = ref(false)
const pendingOosId = ref<string | null>(null)

const totalParts = computed(() => diagnosedParts.value.length + addedParts.value.length)
const liveCategory = computed(() => calcRepairCategory(totalParts.value, localOosIds.value.size > 0))

function onOosTap(partId: string) {
  if (localOosIds.value.has(partId)) {
    const next = new Set(localOosIds.value)
    next.delete(partId)
    localOosIds.value = next
  }
  else {
    pendingOosId.value = partId
    oosConfirmOpen.value = true
  }
}

function onOosConfirm() {
  if (pendingOosId.value) {
    localOosIds.value = new Set([...localOosIds.value, pendingOosId.value])
  }
  pendingOosId.value = null
  oosConfirmOpen.value = false
}

function onAddPartsConfirm(tasks: MockTask[]) {
  addedParts.value = tasks
}

function onAccept() {
  setPreTaskState(diagnosedParts.value, addedParts.value, localOosIds.value)
  router.push(`/mechanic/${encodeURIComponent(bikeId.value)}`)
}
</script>
