<template>
  <div class="relative h-dvh bg-(--ui-bg) flex flex-col">

    <!-- Header -->
    <div class="shrink-0 bg-(--ui-bg) px-4 pt-9 pb-2 z-10">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
          <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" size="sm" @click="onBack" />
          <p class="text-base font-black uppercase tracking-wide leading-none">
            <span class="text-(--ui-text-highlighted)">BIKE </span><span class="text-(--ui-primary)">{{ bikeId }}</span>
          </p>
        </div>
        <Transition name="fade">
          <UButton
            v-if="selectedParts.size > 0"
            color="primary"
            icon="i-lucide-check-check"
            size="sm"
            trailing
            @click="confirmOpen = true"
          >
            <span class="flex items-center gap-1.5">
              <span class="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded">{{ selectedParts.size }}</span>
              Submit
            </span>
          </UButton>
        </Transition>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto pb-2">

      <!-- Bike viewer -->
      <div
        class="relative transition-all duration-300 ease-in-out"
        :class="bikeSmall ? 'px-[72px] py-2' : 'px-[18.74px] py-3'"
      >
        <BikeViewer
          :active-category-id="expandedCategory"
          :has-selections="selectedParts.size > 0"
          :selected-category-ids="selectedCategoryIds"
          @select-category="handleSelectCategory"
        />
      </div>

      <!-- IoT + Battery compact strip -->
      <div class="px-4 mb-3 flex items-center gap-3">
        <div
          class="flex items-center gap-1.5 text-sm"
          :class="bikeCtx.iotStatus === 'online' ? 'text-(--ui-text-toned)' : 'text-error'"
        >
          <span
            class="size-2 rounded-full shrink-0"
            :class="bikeCtx.iotStatus === 'online' ? 'bg-success shadow-[0_0_5px_theme(colors.green.400)]' : 'bg-error'"
          />
          {{ bikeCtx.iotStatus === 'online' ? 'Online' : 'Offline' }}
        </div>
        <div
          class="flex items-center gap-1 text-sm"
          :class="bikeCtx.batteryLevel <= 25 ? 'text-error' : 'text-(--ui-text-toned)'"
        >
          <UIcon
            :name="bikeCtx.batteryLevel > 60 ? 'i-lucide-battery-full' : bikeCtx.batteryLevel > 25 ? 'i-lucide-battery-medium' : 'i-lucide-battery-low'"
            class="size-4"
          />
          {{ bikeCtx.batteryLevel }}%
        </div>
      </div>

      <!-- Search -->
      <div class="px-2 mb-3">
        <UInput
          v-model="searchQuery"
          placeholder="Search Part"
          icon="i-lucide-search"
          size="md"
          class="w-full"
          variant="outline"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
        >
          <template v-if="searchQuery" #trailing>
            <button class="flex items-center justify-center p-0.5 rounded" @click="searchQuery = ''; searchFocused = false">
              <UIcon name="i-lucide-x" class="size-4 text-(--ui-text-muted)" />
            </button>
          </template>
        </UInput>
      </div>

      <!-- Search results (flat list) -->
      <div v-if="searchQuery" class="px-2 flex flex-col gap-1 pb-2">
        <template v-for="category in filteredCategories" :key="category.id">
          <p class="text-xs text-(--ui-text-muted) uppercase tracking-wider px-1 pt-2 pb-1">{{ category.name }}</p>
          <div v-for="part in filteredParts(category)" :key="part.id">
            <button
              class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3 flex items-center justify-between transition-all duration-150"
              :class="isSelected(part.id) ? 'border-(--ui-success) bg-(--ui-success)/5' : 'border-(--ui-border-accented)'"
              @click="togglePart(category.id, part.id, part.name)"
            >
              <span class="text-base text-(--ui-text-toned)">{{ part.name }}</span>
              <Transition name="fade">
                <UIcon v-if="isSelected(part.id)" name="i-lucide-check" class="size-4 text-(--ui-success)" />
              </Transition>
            </button>
          </div>
        </template>
      </div>

      <!-- Parts accordion (no search) -->
      <div v-else class="px-2 flex flex-col gap-2 pb-2">
        <template v-for="category in CATEGORIES" :key="category.id">
          <!-- Category header -->
          <button
            :ref="el => { if (el) categoryRefs[category.id] = el as HTMLElement }"
            class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3.5 flex items-center justify-between transition-colors duration-200"
            :class="expandedCategory === category.id ? 'border-(--ui-text-muted)' : 'border-(--ui-bg-accented)'"
            @click="handleSelectCategory(category.id)"
          >
            <span class="text-base text-(--ui-text-toned)">{{ category.name }}</span>
            <div class="flex items-center gap-1.5">
              <Transition name="fade">
                <span
                  v-if="getCategorySelectedCount(category.id) > 0"
                  class="text-xs text-(--ui-success) font-medium"
                >
                  {{ getCategorySelectedCount(category.id) }} added
                </span>
              </Transition>
              <UIcon
                :name="expandedCategory === category.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-5 text-(--ui-text-toned) transition-transform duration-200"
              />
            </div>
          </button>

          <!-- Parts list -->
          <Transition name="accordion">
            <div v-if="expandedCategory === category.id" class="flex flex-col gap-1.5 overflow-hidden">
              <div v-for="part in category.parts" :key="part.id" class="pl-4">
                <button
                  class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3 flex items-center justify-between transition-all duration-150"
                  :class="isSelected(part.id) ? 'border-(--ui-success) bg-(--ui-success)/5' : 'border-(--ui-border-accented)'"
                  @click="togglePart(category.id, part.id, part.name)"
                >
                  <span class="text-base text-(--ui-text-toned)">{{ part.name }}</span>
                  <Transition name="fade">
                    <UIcon v-if="isSelected(part.id)" name="i-lucide-check" class="size-4 text-(--ui-success)" />
                  </Transition>
                </button>
              </div>
            </div>
          </Transition>
        </template>
      </div>

      <!-- Notes field -->
      <div class="px-2 mt-2 mb-2">
        <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl overflow-hidden">
          <div class="px-4 py-2.5 border-b border-(--ui-bg-accented) flex items-center gap-2">
            <UIcon name="i-lucide-message-square" class="size-4 text-(--ui-text-muted)" />
            <span class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted)">Notes for mechanic</span>
            <span class="ml-auto text-xs text-(--ui-text-dimmed)">Optional</span>
          </div>
          <UTextarea
            v-model="notes"
            placeholder="Describe any adjustments, context or observations..."
            :rows="3"
            class="w-full border-none rounded-none bg-transparent"
            variant="none"
          />
        </div>
      </div>

    </div>

    <!-- IoT Controls bottom bar -->
    <div class="shrink-0 bg-(--ui-bg) border-t border-(--ui-bg-accented) pb-safe">
      <div class="grid grid-cols-4 gap-px bg-(--ui-bg-accented)">
        <button
          v-for="action in iotActions"
          :key="action.label"
          class="bg-(--ui-bg-elevated) flex flex-col items-center justify-center py-3 gap-1.5 active:bg-(--ui-bg-accented) transition-colors"
          @click="onIotAction(action.label)"
        >
          <UIcon :name="action.icon" class="size-5 text-(--ui-text-toned)" />
          <span class="text-xs text-(--ui-text-muted) leading-none">{{ action.label }}</span>
        </button>
      </div>
    </div>

    <!-- Leave without saving modal -->
    <UModal v-model:open="leaveConfirmOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-warning/15 flex items-center justify-center">
            <UIcon name="i-lucide-alert-circle" class="size-6 text-warning" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              Leave without saving?
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              Your part selections will be lost if you go back now.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="leaveConfirmOpen = false">
            Cancel
          </UButton>
          <UButton block color="error" @click="onConfirmLeave">
            Leave
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Confirm submit modal -->
    <UModal v-model:open="confirmOpen" :close="false">
      <template #body>
        <div class="flex flex-col gap-4 px-1 pt-1">
          <div class="w-11 h-11 rounded-full bg-warning/15 flex items-center justify-center">
            <UIcon name="i-lucide-circle-alert" class="size-6 text-warning" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              Are you sure you want to finish the diagnosis?
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              The bike will be ready for the mechanic to start work.
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
import { useBikeContext } from '~/composables/useBikeContext'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { CATEGORIES } = usePartsData()
const {
  expandedCategory,
  selectedParts,
  searchQuery,
  notes,
  reset,
  toggleCategory,
  togglePart,
  isSelected,
  getCategorySelectedCount,
} = useDiagnoser()

const { incrementDiagnosed } = useShift()
const { storeRecord } = useBikeStore()
const { currentName } = useRole()
const { enqueueMechanic } = useBikeQueue()
const toast = useToast()

const searchFocused = ref(false)
const confirmOpen = ref(false)
const leaveConfirmOpen = ref(false)
const submitting = ref(false)
const categoryRefs: Record<string, HTMLElement> = {}

const bikeCtx = computed(() => useBikeContext(bikeId.value))

onMounted(() => reset())

const bikeSmall = computed(() =>
  expandedCategory.value !== null || searchFocused.value || !!searchQuery.value,
)

const selectedCategoryIds = computed(() => {
  const ids = new Set<string>()
  selectedParts.value.forEach(p => ids.add(p.categoryId))
  return ids
})

function handleSelectCategory(categoryId: string) {
  toggleCategory(categoryId)
}

const filteredCategories = computed(() => {
  if (!searchQuery.value) return CATEGORIES
  const q = searchQuery.value.toLowerCase()
  return CATEGORIES.filter(cat =>
    cat.name.toLowerCase().includes(q)
    || cat.parts.some(p => p.name.toLowerCase().includes(q)),
  )
})

function filteredParts(category: typeof CATEGORIES[0]) {
  if (!searchQuery.value) return category.parts
  const q = searchQuery.value.toLowerCase()
  return category.parts.filter(p =>
    p.name.toLowerCase().includes(q) || category.name.toLowerCase().includes(q),
  )
}

// IoT control actions
const iotActions = [
  { label: 'Unlock', icon: 'i-lucide-lock-open' },
  { label: 'Lock', icon: 'i-lucide-lock' },
  { label: 'Lights on', icon: 'i-lucide-lightbulb' },
  { label: 'Light Off', icon: 'i-lucide-lightbulb-off' },
  { label: 'Honk', icon: 'i-lucide-bell' },
  { label: 'Open B/C', icon: 'i-lucide-battery-charging' },
  { label: 'Set speed', icon: 'i-lucide-gauge' },
]

function onIotAction(label: string) {
  toast.add({
    title: `${label} sent`,
    description: `Command sent to BIKE ${bikeId.value}`,
    icon: 'i-lucide-zap',
    color: 'success',
    duration: 2000,
  })
}

function onBack() {
  if (selectedParts.value.size > 0) {
    leaveConfirmOpen.value = true
  }
  else {
    router.push(`/bike-context/${encodeURIComponent(bikeId.value)}`)
  }
}

function onConfirmLeave() {
  leaveConfirmOpen.value = false
  router.push(`/bike-context/${encodeURIComponent(bikeId.value)}`)
}

async function onConfirm() {
  submitting.value = true
  confirmOpen.value = false
  storeRecord(bikeId.value, selectedParts.value, currentName.value, notes.value)
  enqueueMechanic(bikeId.value)
  incrementDiagnosed()
  await new Promise(r => setTimeout(r, 600))
  toast.add({
    title: 'The bike was successfully diagnosed.',
    color: 'success',
    icon: 'i-lucide-check-circle',
    duration: 4000,
  })
  reset()
  router.push('/diagnoser')
}
</script>

<style scoped>
.accordion-enter-active { transition: opacity 0.2s ease, transform 0.22s ease; }
.accordion-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.accordion-enter-from, .accordion-leave-to { opacity: 0; transform: translateY(-6px); }

.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
