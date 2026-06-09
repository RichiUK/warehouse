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
  diagnosedAt?: number
  // Parts flagged by diagnoser — passed to mechanic as starting task list
  diagnosedParts: DiagnosedPart[]
  diagnoserNotes?: string
  // Populated after mechanic accepts job
  mechanicAcceptedAt?: number
  // Populated after mechanic submits
  mechanicName?: string
  mechanicCompletedAt?: number
  mechanicTasks?: MockTask[]
  mechanicOosIds?: string[]
  mechNotes?: string
  // Populated after PDI
  pdiName?: string
  pdiCompletedAt?: number
  // Populated after tester submits
  testerName?: string
  testedAt?: number
  testResult?: 'pass' | 'fail'
  failedChecks?: string[]
  testerNotes?: string
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
    diagnoserNotes?: string,
  ) {
    const diagnosedParts = Array.from(selectedParts.values())
    const category = calcRepairCategory(diagnosedParts.length)
    const next = new Map(bikeRecords.value)
    next.set(bikeId, {
      bikeId,
      totalParts: diagnosedParts.length,
      category,
      diagnoserName,
      diagnosedAt: Date.now(),
      diagnosedParts,
      diagnoserNotes,
    })
    bikeRecords.value = next
  }

  function storeMechanicWork(
    bikeId: string,
    mechanicName: string,
    tasks: MockTask[],
    oosIds: string[],
    notes?: string,
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
      mechanicCompletedAt: Date.now(),
      mechanicTasks: tasks,
      mechanicOosIds: oosIds,
      mechNotes: notes,
    })
    bikeRecords.value = next
  }

  function storePdiResult(
    bikeId: string,
    pdiName: string,
  ) {
    const existing = bikeRecords.value.get(bikeId)
    const next = new Map(bikeRecords.value)
    next.set(bikeId, {
      ...(existing ?? {
        bikeId,
        totalParts: 0,
        category: calcRepairCategory(0),
        diagnoserName: '—',
        diagnosedParts: [],
      }),
      pdiName,
      pdiCompletedAt: Date.now(),
    })
    bikeRecords.value = next
  }

  function storeTesterResult(
    bikeId: string,
    testerName: string,
    result: 'pass' | 'fail',
    failedChecks?: string[],
    testerNotes?: string,
  ) {
    const existing = bikeRecords.value.get(bikeId)
    const next = new Map(bikeRecords.value)
    next.set(bikeId, {
      ...(existing ?? {
        bikeId,
        totalParts: 0,
        category: calcRepairCategory(0),
        diagnoserName: '—',
        diagnosedParts: [],
      }),
      testerName,
      testedAt: Date.now(),
      testResult: result,
      failedChecks,
      testerNotes,
    })
    bikeRecords.value = next
  }

  function getRecord(bikeId: string): BikeRecord | null {
    return bikeRecords.value.get(bikeId) ?? null
  }

  return { storeRecord, storeMechanicWork, storePdiResult, storeTesterResult, getRecord }
}
