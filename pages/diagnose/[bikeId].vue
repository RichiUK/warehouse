<template>
  <div class="relative h-dvh bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-9 pb-2 bg-(--ui-bg)">
      <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" size="sm" @click="onBack" />
      <Transition name="fade">
        <UButton
          v-if="confirmedParts.size > 0"
          variant="outline"
          color="primary"
          icon="i-lucide-check-check"
          size="sm"
          trailing
          @click="onSubmit"
        >
          Submit
        </UButton>
      </Transition>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto pt-16 pb-36">
      <!-- Bike viewer -->
      <div
        class="relative transition-all duration-300 ease-in-out"
        :class="bikeSmall ? 'px-[72px] py-2' : 'px-[18.74px] py-4'"
      >
        <BikeViewer
          :active-category-id="expandedCategory"
          :has-selections="confirmedParts.size > 0 || pendingCount > 0"
          :selected-category-ids="selectedCategoryIds"
          @select-category="handleSelectCategory"
        />
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
          @focus="onSearchFocus"
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
          <!-- Category label -->
          <p class="text-xs text-(--ui-text-muted) uppercase tracking-wider px-1 pt-2 pb-1">
            {{ category.name }}
          </p>
          <TransitionGroup name="parts-list" tag="div" class="flex flex-col gap-1">
            <div
              v-for="part in filteredParts(category)"
              :key="part.id"
            >
              <button
                class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-3 flex items-center justify-between transition-all duration-150"
                :class="getPartBorderClass(part.id)"
                @click="togglePart(category.id, part.id, part.name)"
              >
                <span class="text-base text-(--ui-text-toned)">{{ part.name }}</span>
                <Transition name="fade">
                  <span
                    v-if="getPartAction(part.id) && !pendingPartIds.has(part.id)"
                    class="flex items-center gap-1 bg-(--ui-bg) border border-(--ui-border-accented) rounded-md px-2 py-1"
                  >
                    <UIcon :name="actionIcons[getPartAction(part.id)!]" class="size-3 text-(--ui-text)" />
                    <span class="text-xs text-(--ui-text)">{{ actionLabels[getPartAction(part.id)!] }}</span>
                  </span>
                </Transition>
              </button>
            </div>
          </TransitionGroup>
        </template>
      </div>

      <!-- Parts accordion (no search) -->
      <div v-else class="px-2 flex flex-col gap-2">
        <template v-for="category in filteredCategories" :key="category.id">
          <!-- Category header -->
          <button
            :ref="el => { if (el) categoryRefs[category.id] = el as HTMLElement }"
            class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-4 flex items-center justify-between transition-colors duration-200"
            :class="expandedCategory === category.id
              ? 'border-(--ui-text-muted)'
              : 'border-(--ui-bg-accented)'"
            @click="handleSelectCategory(category.id)"
          >
            <span class="text-base text-(--ui-text-toned)">{{ category.name }}</span>
            <div class="flex items-center gap-1">
              <Transition name="fade">
                <UBadge
                  v-if="getCategoryConfirmedCount(category.id) > 0"
                  color="primary"
                  variant="soft"
                  size="sm"
                >
                  {{ getCategoryConfirmedCount(category.id) }} selected
                </UBadge>
              </Transition>
              <UIcon
                :name="expandedCategory === category.id ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                class="size-6 text-(--ui-text-toned) transition-transform duration-200"
              />
            </div>
          </button>

          <!-- Sub-parts -->
          <Transition name="accordion">
            <div
              v-if="expandedCategory === category.id"
              class="flex flex-col gap-2 overflow-hidden"
            >
              <TransitionGroup name="parts-list" tag="div" class="flex flex-col gap-2">
                <div
                  v-for="part in filteredParts(category)"
                  :key="part.id"
                  class="pl-4"
                >
                  <button
                    class="w-full bg-(--ui-bg-elevated) border rounded-md px-4 py-4 flex items-center justify-between transition-all duration-150"
                    :class="getPartBorderClass(part.id)"
                    @click="togglePart(category.id, part.id, part.name)"
                  >
                    <span class="text-base text-(--ui-text-toned)">{{ part.name }}</span>
                    <Transition name="fade">
                      <span
                        v-if="getPartAction(part.id) && !pendingPartIds.has(part.id)"
                        class="flex items-center gap-1 bg-(--ui-bg) border border-(--ui-border-accented) rounded-md px-2 py-1"
                      >
                        <UIcon :name="actionIcons[getPartAction(part.id)!]" class="size-3 text-(--ui-text)" />
                        <span class="text-xs text-(--ui-text)">{{ actionLabels[getPartAction(part.id)!] }}</span>
                      </span>
                    </Transition>
                  </button>
                </div>
              </TransitionGroup>
            </div>
          </Transition>
        </template>
      </div>
    </div>

    <!-- Action drawer (when parts pending) -->
    <Transition name="slide-up">
      <ActionDrawer
        v-if="pendingCount > 0"
        :count="pendingCount"
        @action="applyAction"
      />
    </Transition>

    <!-- Controls drawer (bike actions) -->
    <ControlsDrawer v-model="controlsOpen" />

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
            <UIcon name="i-lucide-alert-circle" class="size-6 text-warning" />
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
          <UButton block variant="ghost" color="neutral" @click="confirmOpen = false">
            Cancel
          </UButton>
          <UButton block color="success" @click="onConfirm">
            Confirm
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { PartAction } from '~/composables/useDiagnoser'

const route = useRoute()
const router = useRouter()
const bikeId = computed(() => decodeURIComponent(route.params.bikeId as string))

const { CATEGORIES } = usePartsData()
const {
  expandedCategory,
  pendingPartIds,
  confirmedParts,
  pendingCount,
  searchQuery,
  reset,
  toggleCategory,
  togglePart,
  applyAction,
  getCategoryConfirmedCount,
  getPartAction,
  actionLabels,
  actionIcons,
} = useDiagnoser()

const { incrementDiagnosed } = useShift()
const toast = useToast()

const controlsOpen = ref(true)
const confirmOpen = ref(false)
const leaveConfirmOpen = ref(false)

function onBack() {
  if (confirmedParts.value.size > 0 || pendingCount.value > 0) {
    leaveConfirmOpen.value = true
  } else {
    router.push('/')
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
  router.push('/')
}
const searchFocused = ref(false)
const categoryRefs: Record<string, HTMLElement> = {}

// Categories that have at least one pending part selected
const selectedCategoryIds = computed(() => {
  const ids = new Set<string>()
  pendingPartIds.value.forEach((partId) => {
    const cat = CATEGORIES.find(c => c.parts.some(p => p.id === partId))
    if (cat) ids.add(cat.id)
  })
  return ids
})

// Shrink bike when a category is open OR search is active
const bikeSmall = computed(() => expandedCategory.value !== null || searchFocused.value || !!searchQuery.value)

function onSearchFocus() {
  searchFocused.value = true
  controlsOpen.value = false
}



function handleSelectCategory(categoryId: string) {
  controlsOpen.value = false
  toggleCategory(categoryId)
}

onMounted(() => {
  reset()
})

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
  return category.parts.filter(p => p.name.toLowerCase().includes(q))
}

function getPartBorderClass(partId: string) {
  if (pendingPartIds.value.has(partId)) {
    return 'border-(--ui-primary)'
  }
  if (getPartAction(partId)) {
    return 'border-(--ui-border-accented) bg-(--ui-bg-accented)'
  }
  return 'border-(--ui-border-accented)'
}

function onSubmit() {
  confirmOpen.value = true
}

function onConfirm() {
  confirmOpen.value = false
  incrementDiagnosed()
  toast.add({
    title: 'The bike was successfully diagnosed.',
    color: 'success',
    icon: 'i-lucide-check-circle',
    duration: 4000,
  })
  router.push('/')
}
</script>

<style scoped>
/* Accordion open/close */
.accordion-enter-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}
.accordion-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.accordion-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Parts list stagger */
.parts-list-enter-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.parts-list-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.parts-list-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
.parts-list-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

/* Action drawer slide up */
.slide-up-enter-active {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}
.slide-up-leave-active {
  transition: transform 0.18s ease-in, opacity 0.15s ease;
}
.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Generic fade */
.fade-enter-active {
  transition: opacity 0.2s ease;
}
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
