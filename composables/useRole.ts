export type AppRole = 'diagnoser' | 'mechanic' | 'tester'

export const ROLE_NAMES: Record<AppRole, string> = {
  diagnoser: 'Alex',
  mechanic: 'Sam',
  tester: 'Jordan',
}

const currentRole = ref<AppRole | null>(null)

export function useRole() {
  function setRole(role: AppRole) {
    currentRole.value = role
  }

  const currentName = computed(() =>
    currentRole.value ? ROLE_NAMES[currentRole.value] : 'Alex',
  )

  return {
    currentRole: readonly(currentRole),
    currentName,
    setRole,
  }
}
