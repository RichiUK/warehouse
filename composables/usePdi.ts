export const PDI_TASKS = [
  { id: 'cleaning', label: 'Cleaning', icon: 'i-lucide-sparkles' },
  { id: 'stickers', label: 'Bike sticker replacement', icon: 'i-lucide-sticker' },
  { id: 'painting', label: 'Painting', icon: 'i-lucide-paintbrush' },
] as const

const completedTaskIds = ref<Set<string>>(new Set())
const pdiNotes = ref('')
const pdiStartedAt = ref<number | null>(null)

export function usePdi() {
  function reset() {
    completedTaskIds.value = new Set()
    pdiNotes.value = ''
    pdiStartedAt.value = null
  }

  function start() {
    pdiStartedAt.value = Date.now()
  }

  function toggleTask(id: string) {
    const next = new Set(completedTaskIds.value)
    if (next.has(id)) {
      next.delete(id)
    }
    else {
      next.add(id)
    }
    completedTaskIds.value = next
  }

  function isCompleted(id: string): boolean {
    return completedTaskIds.value.has(id)
  }

  const allDone = computed(() =>
    PDI_TASKS.length > 0 && PDI_TASKS.every(t => completedTaskIds.value.has(t.id)),
  )

  return {
    completedTaskIds: readonly(completedTaskIds),
    pdiNotes,
    pdiStartedAt: readonly(pdiStartedAt),
    allDone,
    reset,
    start,
    toggleTask,
    isCompleted,
  }
}
