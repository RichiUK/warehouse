// PartAction is still exported here — used by ActionDrawer & AddPartsSheet (mechanic flow)
export type PartAction = 'replace' | 'adjust' | 'out-of-stock'

export interface DiagnosedPart {
  categoryId: string
  partId: string
  partName: string
}

const expandedCategory = ref<string | null>(null)
const selectedParts = ref<Map<string, DiagnosedPart>>(new Map())
const searchQuery = ref('')

export function useDiagnoser() {
  function reset() {
    expandedCategory.value = null
    selectedParts.value = new Map()
    searchQuery.value = ''
  }

  function toggleCategory(categoryId: string) {
    expandedCategory.value = expandedCategory.value === categoryId ? null : categoryId
  }

  function togglePart(categoryId: string, partId: string, partName: string) {
    const next = new Map(selectedParts.value)
    if (next.has(partId)) {
      next.delete(partId)
    }
    else {
      next.set(partId, { categoryId, partId, partName })
    }
    selectedParts.value = next
  }

  function isSelected(partId: string): boolean {
    return selectedParts.value.has(partId)
  }

  function getCategorySelectedCount(categoryId: string): number {
    let count = 0
    selectedParts.value.forEach(p => { if (p.categoryId === categoryId) count++ })
    return count
  }

  return {
    expandedCategory: readonly(expandedCategory),
    selectedParts: readonly(selectedParts),
    searchQuery,
    reset,
    toggleCategory,
    togglePart,
    isSelected,
    getCategorySelectedCount,
  }
}
