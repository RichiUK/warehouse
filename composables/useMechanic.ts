import type { MockTask } from './usePartsData'
import { MOCK_TASKS } from './usePartsData'
import type { DiagnosedPart } from './useDiagnoser'

const checkedTaskIds = ref<Set<string>>(new Set())
const oosTaskIds = ref<Set<string>>(new Set())
const cannotCompleteIds = ref<Set<string>>(new Set())
// Mutable task list — starts from MOCK_TASKS, can be overridden from diagnosis
const taskList = ref<MockTask[]>([...MOCK_TASKS])
// Timer — set when mechanic accepts the job
const mechanicStartedAt = ref<number | null>(null)

export function useMechanic() {
  /** Full reset — clears all state and restores MOCK_TASKS */
  function reset() {
    checkedTaskIds.value = new Set()
    oosTaskIds.value = new Set()
    cannotCompleteIds.value = new Set()
    taskList.value = [...MOCK_TASKS]
    mechanicStartedAt.value = null
  }

  /**
   * Initialise from diagnoser-selected parts.
   * Tags each task as source: 'diagnosis' for traceability.
   * Falls back to MOCK_TASKS if the list is empty.
   */
  function initFromDiagnosis(diagnosedParts: DiagnosedPart[]) {
    checkedTaskIds.value = new Set()
    oosTaskIds.value = new Set()
    cannotCompleteIds.value = new Set()
    if (diagnosedParts.length > 0) {
      taskList.value = diagnosedParts.map(p => ({
        partId: p.partId,
        partName: p.partName,
        categoryId: p.categoryId,
        source: 'diagnosis' as const,
      }))
    }
    else {
      taskList.value = MOCK_TASKS.map(t => ({ ...t, source: 'diagnosis' as const }))
    }
    // Start timer when initialised from diagnosis (job accepted)
    if (!mechanicStartedAt.value) {
      mechanicStartedAt.value = Date.now()
    }
  }

  function startTimer() {
    if (!mechanicStartedAt.value) {
      mechanicStartedAt.value = Date.now()
    }
  }

  function toggleTask(taskId: string) {
    const next = new Set(checkedTaskIds.value)
    const nextOos = new Set(oosTaskIds.value)
    const nextCnc = new Set(cannotCompleteIds.value)
    if (next.has(taskId)) {
      next.delete(taskId)
    }
    else {
      next.add(taskId)
      nextOos.delete(taskId) // can't be OOS if checked
      nextCnc.delete(taskId) // can't be cannot-complete if checked
    }
    checkedTaskIds.value = next
    oosTaskIds.value = nextOos
    cannotCompleteIds.value = nextCnc
  }

  function toggleOos(taskId: string) {
    const next = new Set(oosTaskIds.value)
    const nextChecked = new Set(checkedTaskIds.value)
    const nextCnc = new Set(cannotCompleteIds.value)
    if (next.has(taskId)) {
      next.delete(taskId)
    }
    else {
      next.add(taskId)
      nextChecked.delete(taskId) // can't be checked if OOS
      nextCnc.delete(taskId)
    }
    oosTaskIds.value = next
    checkedTaskIds.value = nextChecked
    cannotCompleteIds.value = nextCnc
  }

  function toggleCannotComplete(taskId: string) {
    const next = new Set(cannotCompleteIds.value)
    const nextChecked = new Set(checkedTaskIds.value)
    const nextOos = new Set(oosTaskIds.value)
    if (next.has(taskId)) {
      next.delete(taskId)
    }
    else {
      next.add(taskId)
      nextChecked.delete(taskId)
      nextOos.delete(taskId)
    }
    cannotCompleteIds.value = next
    checkedTaskIds.value = nextChecked
    oosTaskIds.value = nextOos
  }

  function isChecked(taskId: string) {
    return checkedTaskIds.value.has(taskId)
  }

  function isOos(taskId: string) {
    return oosTaskIds.value.has(taskId)
  }

  function isCannotComplete(taskId: string) {
    return cannotCompleteIds.value.has(taskId)
  }

  function isDone(taskId: string) {
    return checkedTaskIds.value.has(taskId) || oosTaskIds.value.has(taskId) || cannotCompleteIds.value.has(taskId)
  }

  // Update task list from "Add more parts" — cleans up state for removed tasks
  function updateTaskList(tasks: MockTask[]) {
    const validIds = new Set(tasks.map(t => t.partId))
    taskList.value = tasks
    checkedTaskIds.value = new Set([...checkedTaskIds.value].filter(id => validIds.has(id)))
    oosTaskIds.value = new Set([...oosTaskIds.value].filter(id => validIds.has(id)))
    cannotCompleteIds.value = new Set([...cannotCompleteIds.value].filter(id => validIds.has(id)))
  }

  const allTasksDone = computed(() =>
    taskList.value.length > 0 && taskList.value.every(t => isDone(t.partId)),
  )

  const hasUnsavedProgress = computed(() =>
    checkedTaskIds.value.size > 0 || oosTaskIds.value.size > 0 || cannotCompleteIds.value.size > 0,
  )

  return {
    checkedTaskIds: readonly(checkedTaskIds),
    oosTaskIds: readonly(oosTaskIds),
    cannotCompleteIds: readonly(cannotCompleteIds),
    taskList: readonly(taskList),
    mechanicStartedAt: readonly(mechanicStartedAt),
    allTasksDone,
    hasUnsavedProgress,
    reset,
    initFromDiagnosis,
    startTimer,
    toggleTask,
    toggleOos,
    toggleCannotComplete,
    isChecked,
    isOos,
    isCannotComplete,
    isDone,
    updateTaskList,
  }
}
