export type PartAction = 'replace' | 'adjust' | 'out-of-stock'

export interface AssignedPart {
  categoryId: string
  partId: string
  partName: string
  action: PartAction
}

const expandedCategory = ref<string | null>(null)
const pendingPartIds = ref<Set<string>>(new Set())
const assignedParts = ref<Map<string, AssignedPart>>(new Map())
// Metadata store for pending parts (not yet action-confirmed)
const partMeta = ref<Map<string, { categoryId: string; partId: string; partName: string }>>(new Map())
const searchQuery = ref('')

export function useDiagnoser() {
  function reset() {
    expandedCategory.value = null
    pendingPartIds.value = new Set()
    assignedParts.value = new Map()
    partMeta.value = new Map()
    searchQuery.value = ''
  }

  function toggleCategory(categoryId: string) {
    expandedCategory.value = expandedCategory.value === categoryId ? null : categoryId
  }

  function applyAction(action: PartAction) {
    const next = new Map(assignedParts.value)
    pendingPartIds.value.forEach((partId) => {
      const meta = partMeta.value.get(partId)
      if (meta) {
        next.set(partId, { ...meta, action })
      }
    })
    assignedParts.value = next
    pendingPartIds.value = new Set()
  }

  function togglePart(categoryId: string, partId: string, partName: string) {
    const next = new Set(pendingPartIds.value)
    if (next.has(partId)) {
      // Deselecting: remove from pending and clean up meta (keep confirmed action if exists)
      next.delete(partId)
      const nextMeta = new Map(partMeta.value)
      nextMeta.delete(partId)
      partMeta.value = nextMeta
    } else {
      // Selecting: add to pending and store metadata
      next.add(partId)
      const nextMeta = new Map(partMeta.value)
      nextMeta.set(partId, { categoryId, partId, partName })
      partMeta.value = nextMeta
    }
    pendingPartIds.value = next
  }

  // Pending count = parts selected but no action confirmed yet
  const pendingCount = computed(() => pendingPartIds.value.size)

  // Parts that have had an action applied (confirmed)
  const confirmedParts = computed(() => {
    const confirmed = new Map<string, AssignedPart>()
    assignedParts.value.forEach((part, key) => {
      if (!pendingPartIds.value.has(key)) {
        confirmed.set(key, part)
      }
    })
    return confirmed
  })

  function getCategoryConfirmedCount(categoryId: string) {
    let count = 0
    confirmedParts.value.forEach((part) => {
      if (part.categoryId === categoryId) count++
    })
    return count
  }

  function getPartAction(partId: string): PartAction | null {
    if (pendingPartIds.value.has(partId)) return null // pending, no action yet
    const part = assignedParts.value.get(partId)
    return part ? part.action : null
  }

  const actionLabels: Record<PartAction, string> = {
    'replace': 'Replace',
    'adjust': 'Adjust',
    'out-of-stock': 'Out of Stock',
  }

  const actionIcons: Record<PartAction, string> = {
    'replace': 'i-lucide-refresh-cw',
    'adjust': 'i-lucide-wrench',
    'out-of-stock': 'i-lucide-square-dashed',
  }

  return {
    expandedCategory: readonly(expandedCategory),
    pendingPartIds: readonly(pendingPartIds),
    assignedParts: readonly(assignedParts),
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
  }
}
