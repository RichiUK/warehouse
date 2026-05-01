<template>
  <!-- Collapsed handle (shown when drawer is hidden) -->
  <div
    v-if="!modelValue"
    class="fixed bottom-0 left-0 right-0 z-30 bg-(--ui-bg-elevated) rounded-t-2xl flex flex-col items-center pt-3 pb-6 cursor-pointer"
    @click="emit('update:modelValue', true)"
  >
    <div class="w-10 h-1 rounded-full bg-(--ui-border-accented)" />
  </div>

  <!-- Drawer -->
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition-transform duration-200 ease-in"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="modelValue"
      class="fixed bottom-0 left-0 right-0 z-30 bg-(--ui-bg-elevated) rounded-t-2xl pb-10 pt-3 px-4"
      @touchstart.capture.passive="onTouchStart"
      @touchmove.capture.passive="onTouchMove"
      @touchend.capture.passive="onTouchEnd"
    >
      <!-- Handle bar -->
      <div class="flex justify-center mb-4 cursor-pointer" @click="emit('update:modelValue', false)">
        <div class="w-10 h-1 rounded-full bg-(--ui-border-accented)" />
      </div>

      <!-- Row 1: two paired groups -->
      <div class="flex gap-2 mb-2">
        <!-- Unlock / Lock -->
        <div class="flex flex-1 border border-(--ui-border-accented) rounded-xl overflow-hidden bg-(--ui-bg)">
          <button
            class="flex-1 flex flex-col items-center gap-1.5 py-3 active:bg-(--ui-bg-accented) transition-colors"
            @click="send('unlock')"
          >
            <UIcon name="i-lucide-lock-open" class="size-5 text-(--ui-text)" />
            <span class="text-xs text-(--ui-text-toned)">Unlock</span>
          </button>
          <div class="w-px bg-(--ui-border-accented)" />
          <button
            class="flex-1 flex flex-col items-center gap-1.5 py-3 active:bg-(--ui-bg-accented) transition-colors"
            @click="send('lock')"
          >
            <UIcon name="i-lucide-lock" class="size-5 text-(--ui-text)" />
            <span class="text-xs text-(--ui-text-toned)">Lock</span>
          </button>
        </div>

        <!-- Lights On / Light Off -->
        <div class="flex flex-1 border border-(--ui-border-accented) rounded-xl overflow-hidden bg-(--ui-bg)">
          <button
            class="flex-1 flex flex-col items-center gap-1.5 py-3 active:bg-(--ui-bg-accented) transition-colors"
            @click="send('lights-on')"
          >
            <UIcon name="i-lucide-lightbulb" class="size-5 text-(--ui-text)" />
            <span class="text-xs text-(--ui-text-toned)">Lights on</span>
          </button>
          <div class="w-px bg-(--ui-border-accented)" />
          <button
            class="flex-1 flex flex-col items-center gap-1.5 py-3 active:bg-(--ui-bg-accented) transition-colors"
            @click="send('lights-off')"
          >
            <UIcon name="i-lucide-lightbulb-off" class="size-5 text-(--ui-text)" />
            <span class="text-xs text-(--ui-text-toned)">Light Off</span>
          </button>
        </div>
      </div>

      <!-- Row 2: three buttons -->
      <div class="grid grid-cols-3 gap-2">
        <button
          class="flex flex-col items-center gap-1.5 rounded-xl py-3 bg-(--ui-bg) border border-(--ui-border-accented) active:bg-(--ui-bg-accented) transition-colors"
          @click="send('honk')"
        >
          <UIcon name="i-lucide-bell" class="size-5 text-(--ui-text)" />
          <span class="text-xs text-(--ui-text-toned)">Honk</span>
        </button>
        <button
          class="flex flex-col items-center gap-1.5 rounded-xl py-3 bg-(--ui-bg) border border-(--ui-border-accented) active:bg-(--ui-bg-accented) transition-colors"
          @click="send('open-bc')"
        >
          <UIcon name="i-lucide-battery-charging" class="size-5 text-(--ui-text)" />
          <span class="text-xs text-(--ui-text-toned)">Open B/C</span>
        </button>
        <button
          class="flex flex-col items-center gap-1.5 rounded-xl py-3 bg-(--ui-bg) border border-(--ui-border-accented) active:bg-(--ui-bg-accented) transition-colors"
          @click="send('set-speed')"
        >
          <UIcon name="i-lucide-gauge" class="size-5 text-(--ui-text)" />
          <span class="text-xs text-(--ui-text-toned)">Set speed</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'command': [action: string]
}>()

function send(action: string) {
  emit('command', action)
}

// Swipe-down to close (works on any part of the drawer)
let touchStartY = 0
let touchStartX = 0

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0].clientY
  touchStartX = e.touches[0].clientX
}

function onTouchMove(_e: TouchEvent) {}

function onTouchEnd(e: TouchEvent) {
  const deltaY = e.changedTouches[0].clientY - touchStartY
  const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX)
  // Only close if swipe is clearly downward (not horizontal, not a tap)
  if (deltaY > 50 && deltaY > deltaX * 1.5) {
    emit('update:modelValue', false)
  }
}
</script>
