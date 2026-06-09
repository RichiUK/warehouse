<template>
  <div class="role-selector h-dvh flex flex-col overflow-hidden">
    <!-- Logo -->
    <div class="flex items-center justify-center pt-14 pb-0 shrink-0">
      <span class="text-xl font-black tracking-[0.3em] text-[#4ade80] uppercase">forestfleet</span>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 gap-10">
      <!-- Greeting — name changes per role as user hovers/selects -->
      <div class="text-center">
        <p class="text-[2.1rem] font-black text-white uppercase tracking-tight leading-none">
          WELCOME BACK,
        </p>
        <p class="text-[2.1rem] font-black text-[#4ade80] uppercase tracking-tight leading-tight">
          {{ hoveredName }}
        </p>
        <p class="text-sm text-white/45 mt-4 tracking-wide">
          Please select your role to continue
        </p>
      </div>

      <!-- Role cards -->
      <div class="w-full flex flex-col gap-3">
        <button
          v-for="role in roles"
          :key="role.id"
          class="w-full border border-white/10 bg-white/5 rounded-2xl px-5 py-5 flex items-center justify-between active:bg-white/10 transition-colors"
          @pointerenter="hoveredRole = role.id"
          @pointerleave="hoveredRole = null"
          @click="selectRole(role.id)"
        >
          <div class="flex items-center gap-4">
            <div class="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
              <UIcon :name="role.icon" class="size-5 text-white/70" />
            </div>
            <span class="text-base font-bold text-white uppercase tracking-widest">{{ role.label }}</span>
          </div>
          <UIcon name="i-lucide-chevron-right" class="size-5 text-white/30" />
        </button>
      </div>
    </div>

    <!-- Bottom spacer -->
    <div class="pb-10 shrink-0" />
  </div>
</template>

<script setup lang="ts">
import type { AppRole } from '~/composables/useRole'
import { ROLE_NAME_POOLS, ROLE_NAMES } from '~/composables/useRole'

const router = useRouter()
const { setRole, currentName } = useRole()

const roles: Array<{ id: AppRole; label: string; icon: string }> = [
  { id: 'diagnoser', label: 'Diagnoser', icon: 'i-lucide-stethoscope' },
  { id: 'mechanic', label: 'Mechanic', icon: 'i-lucide-wrench' },
  { id: 'pdi', label: 'PDI', icon: 'i-lucide-sparkles' },
  { id: 'tester', label: 'Tester', icon: 'i-lucide-clipboard-check' },
]

const hoveredRole = ref<AppRole | null>(null)
// Show a sample name from the pool on hover, default to diagnoser first name
const hoveredName = computed(() => {
  if (!hoveredRole.value) return ROLE_NAMES.diagnoser
  return ROLE_NAME_POOLS[hoveredRole.value][0]
})

function selectRole(role: AppRole) {
  setRole(role)
  if (role === 'diagnoser') router.push('/diagnoser')
  else if (role === 'mechanic') router.push('/mechanic')
  else if (role === 'pdi') router.push('/pdi')
  else router.push('/tester')
}
</script>

<style scoped>
.role-selector {
  background-color: #0a0c0f;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 28px 28px;
}
</style>
