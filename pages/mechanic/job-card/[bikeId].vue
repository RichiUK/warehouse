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
      <!-- IoT status -->
      <div class="flex flex-col items-center justify-center py-3 gap-1">
        <div
          class="size-5 flex items-center justify-center"
        >
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
      <!-- Repair category -->
      <div class="flex flex-col items-center justify-center py-3 gap-1">
        <UIcon name="i-lucide-clock" class="size-5 text-(--ui-text-toned)" />
        <span class="text-xs font-medium text-(--ui-text-toned)">{{ repairCategory.time }}</span>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto px-4 pb-8 pt-3 flex flex-col gap-3">

      <!-- Audit trail chip -->
      <div v-if="bikeRecord" class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-2.5 flex items-center gap-2">
        <UIcon name="i-lucide-circle-check" class="size-4 text-(--ui-text-muted) shrink-0" />
        <span class="text-sm text-(--ui-text-muted)">
          Diagnosed by
          <span class="text-(--ui-text-toned) font-medium">{{ bikeRecord.diagnoserName }}</span>
        </span>
      </div>

      <div class="border-t border-(--ui-bg-accented)" />

      <!-- Parts to repair section -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-(--ui-text-highlighted)">Parts to repair</span>
          <UBadge :color="repairCategory.color" variant="soft" size="sm">{{ repairCategory.label }}</UBadge>
        </div>

        <!-- Accordion by category -->
        <div class="flex flex-col gap-1.5">
          <template v-for="(group, catId) in groupedParts" :key="catId">
            <!-- Category row -->
            <button
              class="w-full bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3.5 flex items-center justify-between"
              @click="toggleCat(catId)"
            >
              <span class="text-sm text-(--ui-text-toned)">{{ group.name }}</span>
              <div class="flex items-center gap-2">
                <UBadge color="neutral" variant="soft" size="xs">{{ group.parts.length }}</UBadge>
                <UIcon
                  :name="openCats.has(catId) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="size-4 text-(--ui-text-muted)"
                />
              </div>
            </button>

            <!-- Parts list -->
            <Transition name="accordion">
              <div v-if="openCats.has(catId)" class="flex flex-col gap-1 pl-3">
                <div
                  v-for="part in group.parts"
                  :key="part.partId"
                  class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-lg px-4 py-2.5 flex items-center gap-3"
                >
                  <UIcon name="i-lucide-wrench" class="size-3.5 text-(--ui-text-dimmed) shrink-0" />
                  <span class="text-sm text-(--ui-text-toned)">{{ part.partName }}</span>
                </div>
              </div>
            </Transition>
          </template>

          <div v-if="diagnosedParts.length === 0" class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3">
            <p class="text-sm text-(--ui-text-dimmed)">No diagnosis on file — repairs will use default task list</p>
          </div>
        </div>
      </div>

      <div class="border-t border-(--ui-bg-accented)" />

      <!-- Guardian context -->
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
        Start Task
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { calcRepairCategory, useBikeStore } from '~/composables/useBikeStore'
import { useBikeContext } from '~/composables/useBikeContext'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { getRecord } = useBikeStore()
const { initFromDiagnosis, reset } = useMechanic()
const bikeCtx = computed(() => useBikeContext(bikeId.value))

const bikeRecord = computed(() => getRecord(bikeId.value))
const diagnosedParts = computed(() => bikeRecord.value?.diagnosedParts ?? [])

const repairCategory = computed(() =>
  bikeRecord.value?.category ?? calcRepairCategory(0),
)

const firstGuardianReport = computed(() =>
  bikeCtx.value.guardianReports[0] ?? null,
)

// Group parts by category for accordion
const groupedParts = computed(() => {
  const groups: Record<string, { name: string, parts: typeof diagnosedParts.value }> = {}
  for (const part of diagnosedParts.value) {
    if (!groups[part.categoryId]) {
      groups[part.categoryId] = { name: part.categoryId.charAt(0).toUpperCase() + part.categoryId.slice(1), parts: [] }
    }
    groups[part.categoryId].parts.push(part)
  }
  return groups
})

const openCats = ref(new Set<string>())

// Auto-open first category
onMounted(() => {
  const first = Object.keys(groupedParts.value)[0]
  if (first) openCats.value.add(first)
})

function toggleCat(id: string) {
  if (openCats.value.has(id)) openCats.value.delete(id)
  else openCats.value.add(id)
}

function onAccept() {
  const record = bikeRecord.value
  if (record?.diagnosedParts?.length) {
    initFromDiagnosis(record.diagnosedParts)
  }
  else {
    reset()
  }
  router.push(`/mechanic/${encodeURIComponent(bikeId.value)}`)
}
</script>

<style scoped>
.accordion-enter-active { transition: opacity 0.2s ease, transform 0.22s ease; }
.accordion-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.accordion-enter-from, .accordion-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
