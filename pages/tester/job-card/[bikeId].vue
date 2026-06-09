<template>
  <div class="h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="shrink-0 bg-(--ui-bg) px-4 pt-9 pb-2">
      <div class="flex items-center justify-between">
        <p class="text-base font-black uppercase tracking-wide leading-none">
          <span class="text-(--ui-text-highlighted)">BIKE </span><span class="text-(--ui-primary)">{{ bikeId }}</span>
        </p>
        <UButton variant="ghost" color="neutral" icon="i-lucide-x" size="sm" @click="router.push('/tester')" />
      </div>
    </div>

    <!-- Stats strip -->
    <div class="shrink-0 mx-4 mb-1 grid grid-cols-3 divide-x divide-(--ui-bg-accented) border border-(--ui-bg-accented) rounded-xl overflow-hidden bg-(--ui-bg-elevated)">
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
      <!-- Test info -->
      <div class="flex flex-col items-center justify-center py-3 gap-1">
        <UIcon name="i-lucide-route" class="size-5 text-(--ui-text-toned)" />
        <span class="text-xs font-medium text-(--ui-text-toned)">3 min</span>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto px-4 pb-8 pt-3 flex flex-col gap-3">

      <!-- Audit trail -->
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
        <div class="border-t border-(--ui-bg-accented) px-4 py-2.5 flex items-center gap-2">
          <UIcon name="i-lucide-circle-check" class="size-4 text-(--ui-text-muted) shrink-0" />
          <span class="text-sm text-(--ui-text-muted)">
            PDI by
            <span class="text-(--ui-text-toned) font-medium">{{ bikeRecord?.pdiName ?? '—' }}</span>
          </span>
        </div>
      </div>

      <!-- Test info card -->
      <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3">
        <div class="flex items-start gap-2.5">
          <UIcon name="i-lucide-route" class="size-5 text-(--ui-text-muted) shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-(--ui-text-highlighted)">
              300m test route · 3 min target · 12 checks
            </p>
            <p class="text-xs text-(--ui-text-muted) mt-1">
              Ride bike following test route and run checks during/after
            </p>
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
        @click="onStart"
      >
        Start Test
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBikeStore } from '~/composables/useBikeStore'
import { useBikeContext } from '~/composables/useBikeContext'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { getRecord } = useBikeStore()
const bikeCtx = computed(() => useBikeContext(bikeId.value))
const bikeRecord = computed(() => getRecord(bikeId.value))

function onStart() {
  router.push(`/tester/${encodeURIComponent(bikeId.value)}`)
}
</script>
