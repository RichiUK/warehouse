<template>
  <!-- Aspect-ratio box: 359×268 → 74.65% -->
  <div class="relative w-full" style="padding-bottom: 74.65%;">
    <!-- Bike image -->
    <img
      src="/bike-parts/bike.png"
      alt="Bike"
      class="absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
      :style="{ opacity: hasSelections ? 0.5 : 1 }"
    />

    <!-- SVG overlays -->
    <template v-for="category in overlayCategories" :key="category.id">
      <img
        v-if="category.svgPath && category.overlay"
        :src="category.svgPath"
        :alt="category.name"
        class="absolute cursor-pointer"
        :class="{
          'transition-all duration-200': activeCategoryId === category.id || !selectedCategoryIds.has(category.id),
          'animate-selected': selectedCategoryIds.has(category.id) && activeCategoryId !== category.id,
        }"
        :style="{
          left:   pct(category.overlay.left,  359),
          top:    pct(category.overlay.top,   268),
          width:  pct(category.overlay.width, 359),
          height: pct(category.overlay.height, 268),
          filter: (activeCategoryId === category.id || selectedCategoryIds.has(category.id))
            ? 'brightness(0) saturate(100%) invert(85%) sepia(40%) saturate(500%) hue-rotate(10deg) brightness(1.1)'
            : 'none',
          opacity: activeCategoryId === category.id
            ? 1
            : selectedCategoryIds.has(category.id)
              ? 1
              : (hasSelections ? 0.4 : 0.8),
        }"
        @click="emit('select-category', category.id)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/composables/usePartsData'

defineProps<{
  activeCategoryId: string | null
  hasSelections: boolean
  selectedCategoryIds: Set<string>
}>()

const emit = defineEmits<{
  'select-category': [categoryId: string]
}>()

const overlayCategories = CATEGORIES.filter(c => c.svgPath && c.overlay)

function pct(px: number, total: number) {
  return `${(px / total) * 100}%`
}
</script>

<style scoped>
@keyframes selected-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
.animate-selected {
  animation: selected-pulse 1.4s ease-in-out infinite;
}
</style>
