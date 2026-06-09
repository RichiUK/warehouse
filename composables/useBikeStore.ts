import type { DiagnosedPart } from './useDiagnoser'
import type { MockTask } from './usePartsData'

export type RepairCategoryId =
  | 'basic-service'
  | 'minor'
  | 'medium'
  | 'major'
  | 'refurbishment'
  | 'parts-out-of-stock'

export interface CategoryInfo {
  id: RepairCategoryId
  label: string
  time: string
  color: 'success' | 'info' | 'warning' | 'error'
}

export interface BikeRecord {
  bikeId: string
  totalParts: number
  category: CategoryInfo
  diagnoserName: string
  // Parts flagged by diagnoser — passed to mechanic as starting task list
  diagnosedParts: DiagnosedPart[]
  // Populated after mechanic submits
  mechanicName?: string
  mechanicTasks?: MockTask[]
  mechanicOosIds?: string[]
}

/**
 * Calculate repair category from part count and OOS flag.
 * Called at diagnosis time (no OOS) and optionally at mechanic submit time.
 */
export function calcRepairCategory(partCount: number, hasOOS = false): CategoryInfo {
  if (hasOOS) {
    return { id: 'parts-out-of-stock', label: 'Parts Out of Stock', time: 'Depends', color: 'warning' }
  }
  if (partCount === 0) return { id: 'basic-service', label: 'Basic service', time: '< 5 min', color: 'success' }
  if (partCount <= 3) return { id: 'minor', label: 'Minor repair', time: '< 30 min', color: 'info' }
  if (partCount <= 8) return { id: 'medium', label: 'Medium repair', time: '30 – 60 min', color: 'warning' }
  return { id: 'major', label: 'Major repair', time: '> 60 min', color: 'error' }
}

const bikeRecords = ref<Map<string, BikeRecord>>(new Map())

export function useBikeStore() {
  function storeRecord(
    bikeId: string,
    selectedParts: Map<string, DiagnosedPart>,
    diagnoserName: string,
  ) {
    const diagnosedParts = Array.from(selectedParts.values())
    const category = calcRepairCategory(diagnosedParts.length)
    const next = new Map(bikeRecords.value)
    next.set(bikeId, {
      bikeId,
      totalParts: diagnosedParts.length,
      category,
      diagnoserName,
      diagnosedParts,
    })
    bikeRecords.value = next
  }

  function storeMechanicWork(
    bikeId: string,
    mechanicName: string,
    tasks: MockTask[],
    oosIds: string[],
  ) {
    const existing = bikeRecords.value.get(bikeId)
    const hasOOS = oosIds.length > 0
    const next = new Map(bikeRecords.value)
    next.set(bikeId, {
      ...(existing ?? {
        bikeId,
        totalParts: tasks.length,
        category: calcRepairCategory(tasks.length, hasOOS),
        diagnoserName: '—',
        diagnosedParts: [],
      }),
      mechanicName,
      mechanicTasks: tasks,
      mechanicOosIds: oosIds,
    })
    bikeRecords.value = next
  }

  function getRecord(bikeId: string): BikeRecord | null {
    return bikeRecords.value.get(bikeId) ?? null
  }

  return { storeRecord, storeMechanicWork, getRecord }
}
