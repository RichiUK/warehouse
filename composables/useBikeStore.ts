import type { AssignedPart } from './useDiagnoser'
import { CATEGORIES } from './usePartsData'

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
  sublabel?: string
  time: string
  color: 'success' | 'info' | 'warning' | 'error'
}

export interface BikeRecord {
  bikeId: string
  totalParts: number
  category: CategoryInfo
}

const MAJOR_CATEGORY_IDS = ['cockpit', 'front-wheel-fork', 'frame-electric-core', 'rear-wheel-fender', 'drivetrain']

export function calcRepairCategory(confirmedParts: Map<string, AssignedPart>): CategoryInfo {
  const parts = Array.from(confirmedParts.values())
  const total = parts.length
  const hasOOS = parts.some(p => p.action === 'out-of-stock')

  if (hasOOS) {
    return {
      id: 'parts-out-of-stock',
      label: 'Parts Out of Stock',
      time: 'Depends',
      color: 'warning',
    }
  }

  // Refurbishment: ≥90% of major category parts confirmed
  const majorTotal = CATEGORIES
    .filter(c => MAJOR_CATEGORY_IDS.includes(c.id))
    .reduce((sum, c) => sum + c.parts.length, 0)
  const majorConfirmed = parts.filter(p => MAJOR_CATEGORY_IDS.includes(p.categoryId)).length
  if (majorTotal > 0 && majorConfirmed / majorTotal >= 0.9) {
    return { id: 'refurbishment', label: 'Refurbishment', time: '~120 min', color: 'error' }
  }

  if (total === 0) {
    return { id: 'basic-service', label: 'Basic service', time: '< 5 min', color: 'success' }
  }
  if (total <= 3) {
    return { id: 'minor', label: 'Minor repair', time: '< 30 min', color: 'info' }
  }
  if (total <= 8) {
    return { id: 'medium', label: 'Medium repair', time: '30 – 60 min', color: 'warning' }
  }
  return { id: 'major', label: 'Major repair', time: '> 60 min', color: 'error' }
}

const bikeRecords = ref<Map<string, BikeRecord>>(new Map())

export function useBikeStore() {
  function storeRecord(bikeId: string, confirmedParts: Map<string, AssignedPart>) {
    const category = calcRepairCategory(confirmedParts)
    const next = new Map(bikeRecords.value)
    next.set(bikeId, { bikeId, totalParts: confirmedParts.size, category })
    bikeRecords.value = next
  }

  function getRecord(bikeId: string): BikeRecord | null {
    return bikeRecords.value.get(bikeId) ?? null
  }

  return { storeRecord, getRecord }
}
