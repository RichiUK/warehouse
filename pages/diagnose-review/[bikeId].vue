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
            :to="`/diagnose/${encodeURIComponent(bikeId)}`"
          />
          <p class="text-base font-black uppercase tracking-wide leading-none text-(--ui-text-highlighted)">
            Review
          </p>
        </div>
        <UButton
          color="success"
          size="sm"
          icon="i-lucide-send"
          trailing
          :disabled="submitting"
          :loading="submitting"
          @click="confirmOpen = true"
        >
          Submit
        </UButton>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto px-2 pb-8 pt-2 flex flex-col gap-3">

      <!-- Outcome card -->
      <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            :class="`bg-${liveCategory.color}/15`"
          >
            <UIcon name="i-lucide-clipboard-list" class="size-5" :class="`text-${liveCategory.color}`" />
          </div>
          <div>
            <p class="text-sm font-medium text-(--ui-text-highlighted)">{{ liveCategory.label }}</p>
            <p class="text-xs text-(--ui-text-muted) mt-0.5">{{ liveCategory.time }} estimated</p>
          </div>
        </div>
        <UBadge :color="liveCategory.color" variant="soft" size="sm">
          {{ liveCategory.time }}
        </UBadge>
      </div>

      <!-- Parts flagged card -->
      <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl overflow-hidden">
        <div class="px-4 py-2.5 border-b border-(--ui-bg-accented) flex items-center gap-2">
          <UIcon name="i-lucide-list-checks" class="size-4 text-(--ui-text-muted)" />
          <span class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted)">
            Parts flagged ({{ partsArray.length }})
          </span>
        </div>

        <div v-if="partsArray.length > 0" class="flex flex-col">
          <div
            v-for="(part, i) in partsArray"
            :key="part.partId"
            class="px-4 py-2.5 flex items-center gap-3"
            :class="i < partsArray.length - 1 ? 'border-b border-(--ui-bg-accented)' : ''"
          >
            <UIcon name="i-lucide-check" class="size-4 text-(--ui-primary) shrink-0" />
            <span class="text-sm text-(--ui-text-toned)">{{ part.partName }}</span>
          </div>
        </div>

        <div v-else class="px-4 py-3 flex items-center gap-2">
          <UIcon name="i-lucide-info" class="size-4 text-(--ui-text-dimmed)" />
          <span class="text-sm text-(--ui-text-dimmed)">No parts flagged — basic service</span>
        </div>
      </div>

      <!-- Notes card (if notes exist) -->
      <div v-if="diagnoserNotes" class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3">
        <div class="flex items-start gap-2.5">
          <UIcon name="i-lucide-message-square" class="size-4 text-(--ui-text-muted) shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted) mb-1">Notes</p>
            <p class="text-sm text-(--ui-text-toned)">{{ diagnoserNotes }}</p>
          </div>
        </div>
      </div>

    </div>

    <!-- Submit confirmation modal -->
    <UModal v-model:open="confirmOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-success/15 flex items-center justify-center">
            <UIcon name="i-lucide-send" class="size-6 text-success" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              Submit diagnosis?
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              Bike queued for Mechanic repair ·
              <span class="font-medium" :class="`text-${liveCategory.color}`">{{ liveCategory.label }}</span>
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" :disabled="submitting" @click="confirmOpen = false">
            Cancel
          </UButton>
          <UButton block color="success" :loading="submitting" @click="onConfirm">
            Confirm
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { calcRepairCategory, useBikeStore } from '~/composables/useBikeStore'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { selectedParts, notes, reset } = useDiagnoser()
const { storeRecord } = useBikeStore()
const { currentName } = useRole()
const { incrementDiagnosed } = useShift()
const toast = useToast()

const confirmOpen = ref(false)
const submitting = ref(false)

// If no parts selected, redirect back to diagnose screen
onMounted(() => {
  if (selectedParts.value.size === 0) {
    router.replace(`/diagnose/${encodeURIComponent(bikeId.value)}`)
  }
})

const partsArray = computed(() => Array.from(selectedParts.value.values()))
const liveCategory = computed(() => calcRepairCategory(selectedParts.value.size))
const diagnoserNotes = computed(() => notes.value)

async function onConfirm() {
  submitting.value = true
  confirmOpen.value = false
  storeRecord(bikeId.value, selectedParts.value, currentName.value, notes.value)
  incrementDiagnosed()
  await new Promise(r => setTimeout(r, 800))
  toast.add({
    title: 'Diagnosis submitted.',
    description: `${selectedParts.value.size} part${selectedParts.value.size !== 1 ? 's' : ''} flagged for the mechanic.`,
    color: 'success',
    icon: 'i-lucide-check-circle',
    duration: 4000,
  })
  reset()
  router.push('/diagnoser')
}
</script>

<style scoped>
.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
