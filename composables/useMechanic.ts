const checkedTaskIds = ref<Set<string>>(new Set())

export function useMechanic() {
  function reset() {
    checkedTaskIds.value = new Set()
  }

  function toggleTask(taskId: string) {
    const next = new Set(checkedTaskIds.value)
    if (next.has(taskId)) {
      next.delete(taskId)
    } else {
      next.add(taskId)
    }
    checkedTaskIds.value = next
  }

  function isChecked(taskId: string) {
    return checkedTaskIds.value.has(taskId)
  }

  return {
    checkedTaskIds: readonly(checkedTaskIds),
    reset,
    toggleTask,
    isChecked,
  }
}
