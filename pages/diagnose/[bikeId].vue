<template>
  <div class="relative h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-20 bg-(--ui-bg) px-4 pt-9 pb-2">
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
            @click="onSubmit"
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
    <div class="flex-1 overflow-y-auto pt-16 pb-8">

      <!-- Bike context card — IoT + Battery -->
      <div class="px-2 pt-3 mb-2">
        <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <!-- IoT Status -->
          <div class="flex items-center gap-2">
            <span
              class="size-2 rounded-full shrink-0"
              :class="bikeCtx.iotStatus === 'online' ? 'bg-success shadow-[0_0_5px_theme(colors.green.400)]' : 'bg-error'"
            />
            <span class="text-sm" :class="bikeCtx.iotStatus === 'online' ? 'text-(--ui-text-toned)' : 'text-error'">
              IoT {{ bikeCtx.iotStatus }}
            </span>
          </div>
          <!-- Battery -->
          <div class="flex items-center gap-1.5">
            <UIcon
              :name="bikeCtx.batteryLevel > 60 ? 'i-lucide-battery-full' : bikeCtx.batteryLevel > 25 ? 'i-lucide-battery-medium' : 'i-lucide-battery-low'"
              class="size-4"
              :class="bikeCtx.batteryLevel <= 25 ? 'text-error' : bikeCtx.batteryLevel <= 60 ? 'text-warning' : 'text-(--ui-text-muted)'"
            />
            <span
              class="text-sm"
              :class="bikeCtx.batteryLevel <= 25 ? 'text-error font-medium' : 'text-(--ui-text-toned)'"
            >{{ bikeCtx.batteryLevel }}%</span>
          </div>
        </div>
      </div>

      <!-- Forest Guardian Reports -->
      <div class="px-2 mb-3">
        <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl overflow-hidden">
          <div class="px-4 py-2.5 border-b border-(--ui-bg-accented) flex items-center gap-2">
            <UIcon name="i-lucide-shield-alert" class="size-4 text-(--ui-text-muted)" />
            <span class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted)">Forest Guardian Reports</span>
            <UBadge v-if="bikeCtx.guardianReports.length > 0" color="warning" variant="soft" size="xs" class="ml-auto">
              {{ bikeCtx.guardianReports.length }}
            </UBadge>
          </div>

          <!-- Reports list -->
          <template v-if="bikeCtx.guardianReports.length > 0">
            <div
              v-for="(report, i) in bikeCtx.guardianReports"
              :key="report.id"
              class="px-4 py-2.5 flex items-center gap-3"
              :class="i < bikeCtx.guardianReports.length - 1 ? 'border-b border-(--ui-bg-accented)' : ''"
            >
              <span
                class="size-1.5 rounded-full shrink-0 mt-px"
                :class="{
                  'bg-error': report.severity === 'high',
                  'bg-warning': report.severity === 'medium',
                  'bg-(--ui-text-dimmed)': report.severity === 'low',
                }"
              />
              <span class="text-sm text-(--ui-text-toned) flex-1">{{ report.text }}</span>
              <UBadge
                :color="report.severity === 'high' ? 'error' : report.severity === 'medium' ? 'warning' : 'neutral'"
                variant="soft"
                size="xs"
                class="shrink-0"
              >
                {{ report.severity }}
              </UBadge>
            </div>
          </template>

          <!-- No reports -->
          <div v-else class="px-4 py-3 flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="size-4 text-(--ui-text-dimmed)" />
            <span class="text-sm text-(--ui-text-dimmed)">No field reports for this bike</span>
          </div>
        </div>
      </div>

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

      <!-- Live damage report card -->
      <div class="px-2 mb-3">
        <div class="bg-(--ui-bg-elevated) border border-(--ui-bg-accented) rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-clipboard-list" class="size-5 text-(--ui-text-muted) shrink-0" />
            <div>
              <p class="text-sm font-medium text-(--ui-text-highlighted)">{{ liveCategory.label }}</p>
              <p class="text-xs text-(--ui-text-muted) mt-0.5">{{ liveCategory.time }} estimated</p>
            </div>
          </div>
          <UBadge :color="liveCategory.color" variant="soft" size="sm">
            {{ liveCategory.time }}
          </UBadge>
        </div>
      </div>

      <!-- Search -->
      <div class="px-2 mb-3">
        <UInput
          v-model="searchQuery"
          placeholder="Search part"
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
      <div v-if="searchQuery" class="px-2 flex flex-col gap-1">
        <template v-for="category in filteredCategories" :key="category.id">
          <p class="text-xs text-(--ui-text-muted) uppercase tracking-wider px-1 pt-2 pb-1">{{ category.name }}</p>
          <div v-for="part in filteredParts(category)" :key="part.id">
            <button
              class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3 flex items-center justify-between transition-all duration-150"
              :class="isSelected(part.id) ? 'border-(--ui-primary) bg-(--ui-primary)/5' : 'border-(--ui-border-accented)'"
              @click="togglePart(category.id, part.id, part.name)"
            >
              <span class="text-base text-(--ui-text-toned)">{{ part.name }}</span>
              <Transition name="fade">
                <UIcon
                  v-if="isSelected(part.id)"
                  name="i-lucide-check"
                  class="size-4 text-(--ui-primary)"
                />
              </Transition>
            </button>
          </div>
        </template>
      </div>

      <!-- Parts accordion (no search) -->
      <div v-else class="px-2 flex flex-col gap-2">
        <template v-for="category in filteredCategories" :key="category.id">
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
                <UBadge
                  v-if="getCategorySelectedCount(category.id) > 0"
                  color="primary"
                  variant="soft"
                  size="sm"
                >
                  {{ getCategorySelectedCount(category.id) }}
                </UBadge>
              </Transition>
              <UIcon
                :name="expandedCategory === category.id ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
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
                  :class="isSelected(part.id) ? 'border-(--ui-primary) bg-(--ui-primary)/5' : 'border-(--ui-border-accented)'"
                  @click="togglePart(category.id, part.id, part.name)"
                >
                  <span class="text-base text-(--ui-text-toned)">{{ part.name }}</span>
                  <Transition name="fade">
                    <UIcon
                      v-if="isSelected(part.id)"
                      name="i-lucide-check"
                      class="size-4 text-(--ui-primary)"
                    />
                  </Transition>
                </button>
              </div>
            </div>
          </Transition>
        </template>
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
          <div class="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center">
            <UIcon name="i-lucide-clipboard-check" class="size-6 text-(--ui-primary)" />
          </div>
          <div>
            <p class="text-base font-semibold text-(--ui-text-highlighted) leading-snug">
              Finish diagnosis?
            </p>
            <p class="text-sm text-(--ui-text-muted) mt-1.5">
              <span class="text-(--ui-text-highlighted) font-medium">{{ selectedParts.size }} part{{ selectedParts.size !== 1 ? 's' : '' }}</span>
              flagged — classified as
              <span class="font-medium" :class="`text-${liveCategory.color}`">{{ liveCategory.label }}</span>.
              This will be passed to the mechanic as a starting point.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton block variant="ghost" color="neutral" @click="confirmOpen = false">
            Cancel
          </UButton>
          <UButton block color="primary" @click="onConfirm">
            Confirm
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { calcRepairCategory } from '~/composables/useBikeStore'
import { useBikeContext } from '~/composables/useBikeContext'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { CATEGORIES } = usePartsData()
const {
  expandedCategory,
  selectedParts,
  searchQuery,
  reset,
  toggleCategory,
  togglePart,
  isSelected,
  getCategorySelectedCount,
} = useDiagnoser()

const { incrementDiagnosed } = useShift()
const { storeRecord } = useBikeStore()
const { currentName } = useRole()
const toast = useToast()

const searchFocused = ref(false)
const confirmOpen = ref(false)
const leaveConfirmOpen = ref(false)
const categoryRefs: Record<string, HTMLElement> = {}

// Mock bike context (IoT, battery, Guardian reports)
const bikeCtx = computed(() => useBikeContext(bikeId.value))

onMounted(() => reset())

// Shrink bike viewer when a category is open or search is active
const bikeSmall = computed(() =>
  expandedCategory.value !== null || searchFocused.value || !!searchQuery.value,
)

// Category IDs that have at least one selected part (drives yellow overlay)
const selectedCategoryIds = computed(() => {
  const ids = new Set<string>()
  selectedParts.value.forEach(p => ids.add(p.categoryId))
  return ids
})

// Live repair category based on current selection
const liveCategory = computed(() => calcRepairCategory(selectedParts.value.size))

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

function onBack() {
  if (selectedParts.value.size > 0) {
    leaveConfirmOpen.value = true
  }
  else {
    router.push('/diagnoser')
  }
}

function onConfirmLeave() {
  leaveConfirmOpen.value = false
  toast.add({
    title: 'Changes discarded',
    description: 'No parts were saved for this bike.',
    color: 'warning',
    icon: 'i-lucide-alert-triangle',
    duration: 3000,
  })
  router.push('/diagnoser')
}

function onSubmit() {
  confirmOpen.value = true
}

function onConfirm() {
  confirmOpen.value = false
  storeRecord(bikeId.value, selectedParts.value, currentName.value)
  incrementDiagnosed()
  toast.add({
    title: 'Diagnosis complete.',
    description: `${selectedParts.value.size} part${selectedParts.value.size !== 1 ? 's' : ''} flagged for the mechanic.`,
    color: 'success',
    icon: 'i-lucide-check-circle',
    duration: 4000,
  })
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
