import type { MockTask } from './usePartsData'
import { MOCK_TASKS } from './usePartsData'
import type { DiagnosedPart } from './useDiagnoser'

const checkedTaskIds = ref<Set<string>>(new Set())
const oosTaskIds = ref<Set<string>>(new Set())
// Mutable task list — starts from MOCK_TASKS, can be overridden from diagnosis
const taskList = ref<MockTask[]>([...MOCK_TASKS])

export function useMechanic() {
  /** Full reset — clears all state and restores MOCK_TASKS */
  function reset() {
    checkedTaskIds.value = new Set()
    oosTaskIds.value = new Set()
    taskList.value = [...MOCK_TASKS]
  }

  /**
   * Initialise from diagnoser-selected parts.
   * Parts have no pre-assigned action; mechanic marks OOS or checks them off.
   * Falls back to MOCK_TASKS if the list is empty.
   */
  function initFromDiagnosis(diagnosedParts: DiagnosedPart[]) {
    checkedTaskIds.value = new Set()
    oosTaskIds.value = new Set()
    if (diagnosedParts.length > 0) {
      taskList.value = diagnosedParts.map(p => ({
        partId: p.partId,
        partName: p.partName,
        categoryId: p.categoryId,
        action: undefined,
      }))
    }
    else {
      taskList.value = [...MOCK_TASKS]
    }
  }

  function toggleTask(taskId: string) {
    const next = new Set(checkedTaskIds.value)
    const nextOos = new Set(oosTaskIds.value)
    if (next.has(taskId)) {
      next.delete(taskId)
    }
    else {
      next.add(taskId)
      nextOos.delete(taskId) // can't be OOS if checked
    }
    checkedTaskIds.value = next
    oosTaskIds.value = nextOos
  }

  function toggleOos(taskId: string) {
    const next = new Set(oosTaskIds.value)
    const nextChecked = new Set(checkedTaskIds.value)
    if (next.has(taskId)) {
      next.delete(taskId)
    }
    else {
      next.add(taskId)
      nextChecked.delete(taskId) // can't be checked if OOS
    }
    oosTaskIds.value = next
    checkedTaskIds.value = nextChecked
  }

  function isChecked(taskId: string) {
    return checkedTaskIds.value.has(taskId)
  }

  function isOos(taskId: string) {
    return oosTaskIds.value.has(taskId)
  }

  function isDone(taskId: string) {
    return checkedTaskIds.value.has(taskId) || oosTaskIds.value.has(taskId)
  }

  // Update task list from "Add more parts" — cleans up state for removed tasks
  function updateTaskList(tasks: MockTask[]) {
    const validIds = new Set(tasks.map(t => t.partId))
    taskList.value = tasks
    checkedTaskIds.value = new Set([...checkedTaskIds.value].filter(id => validIds.has(id)))
    oosTaskIds.value = new Set([...oosTaskIds.value].filter(id => validIds.has(id)))
  }

  const allTasksDone = computed(() =>
    taskList.value.length > 0 && taskList.value.every(t => isDone(t.partId)),
  )

  const hasUnsavedProgress = computed(() =>
    checkedTaskIds.value.size > 0 || oosTaskIds.value.size > 0,
  )

  return {
    checkedTaskIds: readonly(checkedTaskIds),
    oosTaskIds: readonly(oosTaskIds),
    taskList: readonly(taskList),
    allTasksDone,
    hasUnsavedProgress,
    reset,
    initFromDiagnosis,
    toggleTask,
    toggleOos,
    isChecked,
    isOos,
    isDone,
    updateTaskList,
  }
}
