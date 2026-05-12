export type AppRole = 'diagnoser' | 'mechanic'

const currentRole = ref<AppRole | null>(null)

export function useRole() {
  function setRole(role: AppRole) {
    currentRole.value = role
  }

  return {
    currentRole: readonly(currentRole),
    setRole,
  }
}
