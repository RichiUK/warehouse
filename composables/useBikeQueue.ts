export interface QueueEntry {
  bikeId: string
  addedAt: number
}

// Bikes diagnosed → waiting for Mechanic
const mechanicQueue = ref<QueueEntry[]>([])
// Bikes repaired by Mechanic → waiting for PDI
const pdiQueue = ref<QueueEntry[]>([])
// Bikes PDI'd → waiting for Tester
const testerQueue = ref<QueueEntry[]>([])

export function useBikeQueue() {
  function enqueueMechanic(bikeId: string) {
    if (!mechanicQueue.value.find(e => e.bikeId === bikeId)) {
      mechanicQueue.value = [...mechanicQueue.value, { bikeId, addedAt: Date.now() }]
    }
  }

  function dequeueMechanic(bikeId: string) {
    mechanicQueue.value = mechanicQueue.value.filter(e => e.bikeId !== bikeId)
  }

  function enqueuePdi(bikeId: string) {
    if (!pdiQueue.value.find(e => e.bikeId === bikeId)) {
      pdiQueue.value = [...pdiQueue.value, { bikeId, addedAt: Date.now() }]
    }
  }

  function dequeuePdi(bikeId: string) {
    pdiQueue.value = pdiQueue.value.filter(e => e.bikeId !== bikeId)
  }

  function enqueueTester(bikeId: string) {
    if (!testerQueue.value.find(e => e.bikeId === bikeId)) {
      testerQueue.value = [...testerQueue.value, { bikeId, addedAt: Date.now() }]
    }
  }

  function dequeueTester(bikeId: string) {
    testerQueue.value = testerQueue.value.filter(e => e.bikeId !== bikeId)
  }

  return {
    mechanicQueue: readonly(mechanicQueue),
    pdiQueue: readonly(pdiQueue),
    testerQueue: readonly(testerQueue),
    enqueueMechanic,
    dequeueMechanic,
    enqueuePdi,
    dequeuePdi,
    enqueueTester,
    dequeueTester,
  }
}

/** Returns a human-readable time elapsed string from a timestamp */
export function queueTimeAgo(addedAt: number, now: number): string {
  const secs = Math.floor((now - addedAt) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}
