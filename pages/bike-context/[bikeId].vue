<template>
  <div class="h-dvh bg-(--ui-bg) flex flex-col overflow-hidden">

    <!-- Header -->
    <div class="shrink-0 flex items-center justify-between px-4 pt-10 pb-2">
      <p class="text-base font-black uppercase tracking-wide leading-none">
        <span class="text-(--ui-text-highlighted)">BIKE </span><span class="text-(--ui-primary)">{{ bikeId }}</span>
      </p>
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-x"
        size="sm"
        @click="router.push('/diagnoser')"
      />
    </div>

    <!-- Stats strip -->
    <div class="shrink-0 mx-4 mt-2 grid grid-cols-2 divide-x divide-(--ui-bg-accented) border border-(--ui-bg-accented) rounded-xl overflow-hidden bg-(--ui-bg-elevated)">
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

    <!-- Divider -->
    <div class="shrink-0 mx-4 mt-4 border-t border-(--ui-bg-accented)" />

    <!-- Scrollable reports -->
    <div class="flex-1 overflow-y-auto px-4 pt-4 pb-2 flex flex-col gap-3">

      <!-- Guardian report -->
      <div class="bg-(--ui-bg-elevated)/50 border border-(--ui-border-accented) rounded-xl px-4 py-2.5 flex items-start gap-2.5">
        <UIcon name="i-lucide-wrench" class="size-5 text-(--ui-text-muted) shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-(--ui-text-highlighted) mb-1">Guardian report</p>
          <template v-if="bikeCtx.guardianReports.length > 0">
            <p
              v-for="report in bikeCtx.guardianReports"
              :key="report.id"
              class="text-sm text-(--ui-text-toned)"
            >
              {{ report.text }}
            </p>
          </template>
          <p v-else class="text-sm text-(--ui-text-muted)">No issues reported by Forest Guardians.</p>
        </div>
      </div>

      <!-- Damage report -->
      <div class="bg-(--ui-bg-elevated)/50 border border-(--ui-border-accented) rounded-xl px-4 py-2.5 flex items-start gap-2.5">
        <UIcon name="i-lucide-triangle-alert" class="size-5 text-(--ui-text-muted) shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-(--ui-text-highlighted) mb-1">Damage report</p>
          <template v-if="highSeverityReports.length > 0">
            <p
              v-for="report in highSeverityReports"
              :key="report.id"
              class="text-sm text-(--ui-text-toned)"
            >
              {{ report.text }}
            </p>
          </template>
          <p v-else class="text-sm text-(--ui-text-muted)">No damage reported.</p>
        </div>
      </div>

    </div>

    <!-- Bottom gradient + CTA -->
    <div class="relative shrink-0">
      <!-- Gradient fade -->
      <div class="absolute bottom-full left-0 right-0 h-16 bg-gradient-to-t from-(--ui-bg) to-transparent pointer-events-none" />
      <!-- Button -->
      <div class="px-4 pb-10 pt-3">
        <UButton
          block
          size="xl"
          color="primary"
          variant="soft"
          icon="i-lucide-check-check"
          class="h-14 text-base font-medium"
          @click="router.push(`/diagnose/${encodeURIComponent(bikeId)}`)"
        >
          Start Diagnose
        </UButton>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useBikeContext } from '~/composables/useBikeContext'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))
const bikeCtx = computed(() => useBikeContext(bikeId.value))

const highSeverityReports = computed(() =>
  bikeCtx.value.guardianReports.filter(r => r.severity === 'high' || r.severity === 'medium'),
)
</script>
