export type AppRole = 'diagnoser' | 'mechanic' | 'tester'

export const ROLE_NAME_POOLS: Record<AppRole, string[]> = {
  diagnoser: ['Alex', 'Maria', 'James', 'Sofia', 'Tom'],
  mechanic: ['Sam', 'Carlos', 'Nina', 'Ben', 'Priya'],
  tester: ['Jordan', 'Lena', 'Daniel', 'Zara', 'Luke'],
}

// Keep first entry as the default display name on the selector screen
export const ROLE_NAMES: Record<AppRole, string> = {
  diagnoser: ROLE_NAME_POOLS.diagnoser[0],
  mechanic: ROLE_NAME_POOLS.mechanic[0],
  tester: ROLE_NAME_POOLS.tester[0],
}

const currentRole = ref<AppRole | null>(null)
const currentName = ref<string>(ROLE_NAMES.diagnoser)

export function useRole() {
  function setRole(role: AppRole) {
    currentRole.value = role
    const pool = ROLE_NAME_POOLS[role]
    currentName.value = pool[Math.floor(Math.random() * pool.length)]
  }

  return {
    currentRole: readonly(currentRole),
    currentName: readonly(currentName),
    setRole,
  }
}
