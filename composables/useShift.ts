const isShiftActive = ref(false)
const currentSessionCount = ref(0)

// Dummy initial data — last shift was "yesterday"
const _dummyYesterday = new Date()
_dummyYesterday.setDate(_dummyYesterday.getDate() - 1)
_dummyYesterday.setHours(14, 39, 0, 0)

const lastShiftCount = ref(16)
const lastShiftEndedAt = ref<Date>(_dummyYesterday)

export function useShift() {
  function startShift() {
    isShiftActive.value = true
    currentSessionCount.value = 0
  }

  function endShift() {
    lastShiftCount.value = currentSessionCount.value
    lastShiftEndedAt.value = new Date()
    isShiftActive.value = false
  }

  function incrementDiagnosed() {
    currentSessionCount.value++
  }

  return {
    isShiftActive: readonly(isShiftActive),
    currentSessionCount: readonly(currentSessionCount),
    lastShiftCount: readonly(lastShiftCount),
    lastShiftEndedAt: readonly(lastShiftEndedAt),
    startShift,
    endShift,
    incrementDiagnosed,
  }
}
