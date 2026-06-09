export type TaskResult = 'pass' | 'fail' | null

export interface TesterCheck {
  id: string
  label: string
  description: string
}

export const TESTER_CHECKLIST: TesterCheck[] = [
  { id: 'lights', label: 'Lights', description: 'Proper operation of all lights' },
  { id: 'seat-post', label: 'Seat Post', description: 'Lock mechanism + securely fixed at desired height' },
  { id: 'alignment', label: 'Alignment', description: 'Front wheel + handlebar correctly aligned' },
  { id: 'chain-tension', label: 'Chain Tension', description: 'Optimal range + no noise' },
  { id: 'crank-pedals', label: 'Crank Arms & Pedals', description: 'Securely fitted' },
  { id: 'handling', label: 'Handling & Control', description: 'Sweep left/right test' },
  { id: 'electric-assist', label: 'Electric Assist & Speed', description: 'Torque sensor + 25km/h top speed + km/h display' },
  { id: 'brakes', label: 'Brakes & Braking System', description: 'Balance + emergency stop within one car length from 25km/h' },
  { id: 'kickstand', label: 'Kickstand', description: 'Upright and straight parking' },
  { id: 'battery', label: 'Battery', description: 'Securely locked' },
  { id: 'connectivity', label: 'Reachable/Online', description: 'If offline → pass to Forest staff' },
  { id: 'screws', label: 'Screw', description: 'Loose screw check' },
]

const taskResults = ref<Map<string, TaskResult>>(new Map())
const testerStartedAt = ref<number | null>(null)

export function useTester() {
  function reset() {
    taskResults.value = new Map()
    testerStartedAt.value = null
  }

  function start() {
    if (!testerStartedAt.value) {
      testerStartedAt.value = Date.now()
    }
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

  const evaluatedCount = computed(() =>
    TESTER_CHECKLIST.filter(c => taskResults.value.get(c.id) !== null && taskResults.value.get(c.id) !== undefined).length,
  )

  const allChecklistEvaluated = computed(() =>
    TESTER_CHECKLIST.every(c => taskResults.value.get(c.id) !== null && taskResults.value.get(c.id) !== undefined),
  )

  const failedChecks = computed(() =>
    TESTER_CHECKLIST.filter(c => taskResults.value.get(c.id) === 'fail'),
  )

  return {
    taskResults: readonly(taskResults),
    testerStartedAt: readonly(testerStartedAt),
    evaluatedCount,
    allChecklistEvaluated,
    failedChecks,
    reset,
    start,
    setResult,
    getResult,
    allEvaluated,
    hasFailures,
  }
}
