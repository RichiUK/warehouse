export type TaskResult = 'pass' | 'fail' | null

const taskResults = ref<Map<string, TaskResult>>(new Map())

export function useTester() {
  function reset() {
    taskResults.value = new Map()
  }

  function setResult(taskId: string, result: TaskResult) {
    const next = new Map(taskResults.value)
    // Toggle: if already this result, clear it
    next.set(taskId, taskResults.value.get(taskId) === result ? null : result)
    taskResults.value = next
  }

  function getResult(taskId: string): TaskResult {
    return taskResults.value.get(taskId) ?? null
  }

  const allEvaluated = (taskIds: string[]) =>
    taskIds.length > 0 && taskIds.every(id => taskResults.value.get(id) !== null && taskResults.value.get(id) !== undefined)

  const hasFailures = (taskIds: string[]) =>
    taskIds.some(id => taskResults.value.get(id) === 'fail')

  return {
    taskResults: readonly(taskResults),
    reset,
    setResult,
    getResult,
    allEvaluated,
    hasFailures,
  }
}
