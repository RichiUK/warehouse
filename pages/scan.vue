<template>
  <div class="relative h-dvh overflow-hidden bg-black">
    <!-- Camera background (real scanner or fallback) -->
    <div class="absolute inset-0">
      <ClientOnly>
        <QrcodeStream
          v-if="!manualMode"
          class="absolute inset-0 w-full h-full object-cover"
          @detect="onDetect"
          @error="onError"
        />
        <template #fallback>
          <div class="absolute inset-0 bg-neutral-950" />
        </template>
      </ClientOnly>
      <!-- Dark overlay when manual mode -->
      <div v-if="manualMode" class="absolute inset-0 bg-neutral-950" />
    </div>

    <!-- Frosted overlay (top and bottom) -->
    <div class="absolute inset-0 pointer-events-none"
      style="background: radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)" />

    <!-- Close button -->
    <div class="absolute top-6 left-4 z-10">
      <NuxtLink to="/">
        <UButton
          color="neutral"
          variant="solid"
          size="sm"
          icon="i-lucide-x"
          class="bg-(--ui-bg-inverted) text-(--ui-bg)"
        />
      </NuxtLink>
    </div>

    <!-- QR Frame + instructions (camera mode) -->
    <div v-if="!manualMode" class="absolute inset-0 flex flex-col items-center justify-center gap-6 px-10">
        <!-- QR scanner frame -->
      <div class="relative size-[260px]">
        <!-- Corner brackets -->
        <span class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-sm" />
        <span class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-sm" />
        <span class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-sm" />
        <span class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-sm" />
        <!-- Scan line animation -->
        <div class="absolute inset-x-4 h-0.5 bg-white/60 animate-scan" />
      </div>
    </div>

    <!-- Manual input mode -->
    <div v-else class="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8">
      <p class="text-lg font-bold text-white">Enter Bike ID</p>
      <UInput
        v-model="manualBikeId"
        placeholder="e.g. HF-12345"
        size="lg"
        class="w-full"
        autofocus
        @keyup.enter="submitManual"
      />
      <UButton block size="lg" color="primary" :disabled="!manualBikeId" @click="submitManual">
        Continue
      </UButton>
      <UButton variant="ghost" color="neutral" @click="manualMode = false">
        Back to scanner
      </UButton>
    </div>

    <!-- Bottom controls -->
    <div class="absolute bottom-6 left-4 right-4 flex gap-[22px] items-center z-10">
      <!-- Manual input field trigger -->
      <button
        class="flex-1 flex items-center gap-2 bg-(--ui-bg-elevated) border border-(--ui-border-accented) rounded-md px-3 py-2 text-left"
        @click="manualMode = true"
      >
        <UIcon name="i-lucide-scan-barcode" class="size-6 text-(--ui-text-toned) shrink-0" />
        <span class="text-base text-(--ui-text-toned)">Enter Bike ID Code</span>
      </button>

      <!-- Flashlight toggle -->
      <UButton
        color="neutral"
        variant="solid"
        icon="i-lucide-flashlight"
        class="bg-(--ui-bg-inverted) text-(--ui-bg) shrink-0"
        @click="toggleTorch"
      />
    </div>

    <!-- Error toast -->
    <div v-if="errorMessage" class="absolute top-20 left-4 right-4 bg-red-500/90 rounded-md px-4 py-3 z-20">
      <p class="text-sm text-white">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QrcodeStream } from 'vue-qrcode-reader'

const router = useRouter()
const manualMode = ref(false)
const manualBikeId = ref('')
const errorMessage = ref('')
const torchActive = ref(false)

// TODO: remove — test-only auto-navigate
onMounted(() => {
  setTimeout(() => {
    router.push('/diagnose/HF-TEST-001')
  }, 2000)
})

function onDetect(detectedCodes: Array<{ rawValue: string }>) {
  const code = detectedCodes[0]?.rawValue
  if (code) {
    router.push(`/diagnose/${encodeURIComponent(code)}`)
  }
}

function onError(err: Error) {
  if (err.name === 'NotAllowedError') {
    errorMessage.value = 'Camera permission denied. Use manual entry below.'
  } else if (err.name === 'NotFoundError') {
    errorMessage.value = 'No camera found. Use manual entry below.'
  } else {
    errorMessage.value = 'Camera unavailable. Use manual entry.'
  }
  setTimeout(() => { errorMessage.value = '' }, 4000)
}

function toggleTorch() {
  torchActive.value = !torchActive.value
}

function submitManual() {
  const id = manualBikeId.value.trim()
  if (id) {
    router.push(`/diagnose/${encodeURIComponent(id)}`)
  }
}
</script>

<style scoped>
@keyframes scan {
  0% { top: 8px; }
  50% { top: calc(100% - 8px); }
  100% { top: 8px; }
}
.animate-scan {
  animation: scan 2s ease-in-out infinite;
}
</style>
