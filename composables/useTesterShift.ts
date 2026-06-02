const isShiftActive = ref(false)
const currentSessionCount = ref(0)

const _dummyYesterday = new Date()
_dummyYesterday.setDate(_dummyYesterday.getDate() - 1)
_dummyYesterday.setHours(16, 5, 0, 0)

const lastShiftCount = ref(8)
const lastShiftEndedAt = ref<Date>(_dummyYesterday)

export function useTesterShift() {
  function startShift() {
    isShiftActive.value = true
    currentSessionCount.value = 0
  }

  function endShift() {
    lastShiftCount.value = currentSessionCount.value
    lastShiftEndedAt.value = new Date()
    isShiftActive.value = false
  }

  function incrementTested() {
    currentSessionCount.value++
  }

  return {
    isShiftActive: readonly(isShiftActive),
    currentSessionCount: readonly(currentSessionCount),
    lastShiftCount: readonly(lastShiftCount),
    lastShiftEndedAt: readonly(lastShiftEndedAt),
    startShift,
    endShift,
    incrementTested,
  }
}
