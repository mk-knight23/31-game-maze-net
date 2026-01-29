<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMazeStore } from './stores/maze'
import { useSettingsStore } from './stores/settings'
import { useStatsStore, type LevelResult } from './stores/stats'
import { useAudio } from './composables/useAudio'
import { useKeyboardControls, type KeyAction } from './composables/useKeyboardControls'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, Stars } from '@tresjs/cientos'
import { generateMaze } from './utils/mazeGenerator'
import { DIFFICULTY_PRESETS } from './utils/constants'
import {
  Trophy,
  Settings,
  Github,
  Maximize2,
  Play,
  RotateCcw,
} from 'lucide-vue-next'
import SettingsPanel from './components/ui/SettingsPanel.vue'

const store = useMazeStore()
const settings = useSettingsStore()
const stats = useStatsStore()
const { playClick, playMove } = useAudio()
const { lastAction, clearAction } = useKeyboardControls()

const mazeData = ref<number[][]>([])
const ballPos = ref<[number, number, number]>([1, 0, 1])
const pathTrail = ref<Array<[number, number, number]>>([])
const victoryParticles = ref<Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }>>([])
const isFirstPerson = ref(false)

// V2: Move tracking for efficiency scoring
const moveCount = ref(0)
const efficiencyRating = computed(() => {
  // Simple efficiency: optimal path is roughly mazeSize * 2 moves
  const optimalMoves = store.mazeSize * 2
  const ratio = moveCount.value / optimalMoves
  if (ratio <= 1.2) return { stars: 3, label: 'Perfect', color: 'text-emerald-400' }
  if (ratio <= 1.5) return { stars: 2, label: 'Good', color: 'text-amber-400' }
  return { stars: 1, label: 'Complete', color: 'text-slate-400' }
})

const cameraPosition = computed(() => {
  if (isFirstPerson.value) {
    // First-person: camera follows ball position
    return [ballPos.value[0], 0.5, ballPos.value[2]] as [number, number, number]
  }
  // Third-person: overview
  return [store.mazeSize / 2, 20, store.mazeSize] as [number, number, number]
})

const cameraLookAt = computed(() => {
  if (isFirstPerson.value) {
    // Look ahead in current direction (simplified)
    return [ballPos.value[0] + 1, 0.5, ballPos.value[2]] as [number, number, number]
  }
  return [store.mazeSize / 2, 0, store.mazeSize / 2] as [number, number, number]
})

onMounted(() => {
  store.loadProgress()
  regenerateMaze()
})

watch(() => store.level, regenerateMaze)

watch(lastAction, (action: KeyAction) => {
  if (action === 'none') return

  switch (action) {
    case 'up':
      handleMove(0, -1)
      break
    case 'down':
      handleMove(0, 1)
      break
    case 'left':
      handleMove(-1, 0)
      break
    case 'right':
      handleMove(1, 0)
      break
    case 'start':
      if (store.status === 'idle') {
        playClick()
        store.startLevel()
      }
      break
  }

  setTimeout(clearAction, 100)
})

watch(() => store.status, (newStatus) => {
  if (newStatus === 'victory') {
    spawnVictoryParticles()
  }
})

function spawnVictoryParticles() {
  const goalX = store.mazeSize - 1
  const goalZ = store.mazeSize - 2
  for (let i = 0; i < 50; i++) {
    victoryParticles.value.push({
      x: goalX,
      y: 0.5,
      z: goalZ,
      vx: (Math.random() - 0.5) * 0.3,
      vy: Math.random() * 0.3,
      vz: (Math.random() - 0.5) * 0.3,
      life: 1
    })
  }
}

function updateParticles() {
  if (store.status !== 'victory') return
  victoryParticles.value = victoryParticles.value.filter(p => {
    p.x += p.vx
    p.y += p.vy
    p.z += p.vz
    p.vy -= 0.01 // gravity
    p.life -= 0.02
    return p.life > 0
  })
  requestAnimationFrame(updateParticles)
}

watch(() => store.status, (newStatus) => {
  if (newStatus === 'victory') {
    updateParticles()
  }
})

function regenerateMaze() {
  mazeData.value = generateMaze(store.mazeSize)
  ballPos.value = [1, 0, 1]
  pathTrail.value = [[1, 0, 1]]
  victoryParticles.value = []
  moveCount.value = 0
}

// V2: Calculate par time based on maze size
function getParTime(size: number): number {
  // Par is roughly 2 seconds per row
  return size * 2
}

function handleMove(dx: number, dz: number) {
  if (store.status !== 'playing') return

  playMove()
  const nextX = ballPos.value[0] + dx
  const nextZ = ballPos.value[2] + dz

  if (nextX >= 0 && nextX < store.mazeSize && nextZ >= 0 && nextZ < store.mazeSize) {
    if (mazeData.value[Math.floor(nextX)][Math.floor(nextZ)] === 0) {
      ballPos.value = [nextX, 0, nextZ]
      // Add to path trail
      pathTrail.value.push([nextX, 0, nextZ])
      moveCount.value++
      if (nextX === store.mazeSize - 1 && Math.floor(nextZ) === store.mazeSize - 2) {
        // V2: Record result before winning
        const result: LevelResult = {
          level: store.level,
          size: store.mazeSize,
          time: store.time,
          moves: moveCount.value,
          parTime: getParTime(store.mazeSize),
          stars: efficiencyRating.value.stars,
          date: new Date().toISOString()
        }
        stats.addResult(result)
        store.win()
      }
    }
  }
}

function openSettings() {
  playClick()
  settings.toggleHelp()
}

function changeMazeSize(size: number) {
  // Update the mazeSize in settings store by changing difficulty
  const sizeMap: Record<number, keyof typeof DIFFICULTY_PRESETS> = {
    11: 'easy',
    15: 'medium',
    21: 'hard'
  }
  settings.setDifficulty(sizeMap[size])
  // Force maze regeneration
  mazeData.value = generateMaze(size)
  ballPos.value = [1, 0, 1]
  pathTrail.value = [[1, 0, 1]]
  victoryParticles.value = []
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-maze-bg overflow-hidden font-sans dark:bg-slate-950">
    <SettingsPanel />

    <div class="absolute inset-0 z-0">
      <TresCanvas shadows alpha>
        <TresPerspectiveCamera :position="cameraPosition" :look-at="cameraLookAt" />
        <OrbitControls :enable-zoom="true" />

        <Stars :radius="100" :count="3000" />
        <TresAmbientLight :intensity="0.4" />
        <TresDirectionalLight :position="[10, 10, 10]" :intensity="1" cast-shadow />

        <TresGroup>
           <template v-for="(row, i) in mazeData" :key="i">
              <template v-for="(cell, j) in row" :key="j">
                 <TresMesh v-if="cell === 1" :position="[i, 0.5, j]">
                    <TresBoxGeometry :args="[1, 1.2, 1]" />
                    <TresMeshStandardMaterial color="#1e1b4b" :metalness="0.5" :roughness="0.2" />
                 </TresMesh>
              </template>
           </template>
        </TresGroup>

        <TresMesh :position="[store.mazeSize - 1, 0.1, store.mazeSize - 2]">
           <TresBoxGeometry :args="[1, 0.2, 1]" />
           <TresMeshStandardMaterial color="#10b981" :emissiveIntensity="2" />
        </TresMesh>

        <TresMesh :position="ballPos" cast-shadow>
           <TresSphereGeometry :args="[0.3, 32, 32]" />
           <TresMeshStandardMaterial color="#00f3ff" :emissiveIntensity="1" />
        </TresMesh>

        <!-- Path Trail -->
        <template v-for="(pos, index) in pathTrail" :key="'trail-' + index">
          <TresMesh :position="pos">
            <TresSphereGeometry :args="[0.15, 16, 16]" />
            <TresMeshStandardMaterial
              color="#00f3ff"
              :emissive="'#00f3ff'"
              :emissiveIntensity="0.3"
              :transparent="true"
              :opacity="0.4"
            />
          </TresMesh>
        </template>

        <!-- Victory Particles -->
        <template v-for="(particle, index) in victoryParticles" :key="'particle-' + index">
          <TresMesh :position="[particle.x, particle.y, particle.z] as [number, number, number]">
            <TresSphereGeometry :args="[0.08, 8, 8]" />
            <TresMeshStandardMaterial
              color="#10b981"
              :emissive="'#10b981'"
              :emissiveIntensity="2"
              :transparent="true"
              :opacity="particle.life"
            />
          </TresMesh>
        </template>

        <TresMesh :position="[store.mazeSize / 2, -0.1, store.mazeSize / 2]" :rotation="[-Math.PI / 2, 0, 0]">
           <TresPlaneGeometry :args="[store.mazeSize + 2, store.mazeSize + 2]" />
           <TresMeshStandardMaterial color="#050510" />
        </TresMesh>
      </TresCanvas>
    </div>

    <div class="relative z-10 h-full flex flex-col pointer-events-none p-7 md:p-11">
       <header class="flex justify-between items-start gap-4 flex-wrap">
          <div class="glass-panel p-5 md:p-7 flex items-center space-x-4 md:space-x-6">
             <div class="space-y-1">
                <span class="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-slate-500">Level</span>
                <div class="flex items-center space-x-2 md:space-x-3">
                   <h1 class="text-2xl md:text-3xl font-display font-black text-white">{{ String(store.level).padStart(2, '0') }}</h1>
                </div>
             </div>
             <div class="h-8 md:h-10 w-px bg-white/10"></div>
             <div class="flex flex-col">
                <span class="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Size</span>
                <span class="text-sm md:text-base font-bold text-white tracking-tighter">{{ store.mazeSize }}x{{ store.mazeSize }}</span>
             </div>
          </div>

          <div class="glass-panel p-4 md:p-6 flex items-center space-x-4 text-white">
             <Trophy :size="18" class="text-amber-500" />
             <div class="flex flex-col">
                <span class="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Best</span>
                <span class="text-sm font-black">{{ store.bestTime >= 999999 ? '--:--' : formatTime(store.bestTime) }}</span>
             </div>
          </div>

          <div class="glass-panel p-4 md:p-6 flex items-center gap-2 text-white">
             <div class="flex gap-1 md:gap-2">
               <button
                 v-for="size in [11, 15, 21]"
                 :key="size"
                 @click="changeMazeSize(size)"
                 class="px-3 py-2 rounded-lg text-xs font-bold transition-all pointer-events-auto"
                 :class="store.mazeSize === size
                   ? 'bg-maze-neon text-black shadow-lg shadow-maze-neon/30'
                   : 'bg-white/5 text-white/70 hover:bg-white/10'"
               >
                 {{ size }}x{{ size }}
               </button>
             </div>
          </div>

          <button
            @click="openSettings"
            class="glass-panel p-4 text-white hover:bg-white/10 transition-colors pointer-events-auto"
            aria-label="Open settings"
          >
            <Settings :size="20" />
          </button>
       </header>

       <main class="flex-1 flex items-center justify-center">
          <div v-if="store.status === 'idle'" class="glass-panel p-8 md:p-12 text-center space-y-6 pointer-events-auto max-w-sm">
             <div class="space-y-2">
                <h2 class="text-3xl md:text-4xl font-display font-black uppercase text-white tracking-tighter leading-none">Quantum<br/>Labyrinth</h2>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">3D Maze Escape</p>
             </div>
             <button
               @click="store.startLevel()"
               class="w-full flex items-center justify-center space-x-2 bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-maze-neon transition-all pointer-events-auto"
             >
               <Play :size="18" />
               <span>Enter</span>
             </button>
          </div>

          <div v-if="store.status === 'victory'" class="glass-panel p-8 md:p-12 text-center space-y-6 pointer-events-auto border-emerald-500/50 bg-emerald-950/20">
             <Trophy :size="48" md:size="64" class="text-emerald-500 mx-auto animate-pulse" />
             <div class="space-y-3 text-white">
                <h2 class="text-4xl md:text-5xl font-display font-black uppercase text-emerald-500">Path Cleared!</h2>
                <!-- V2: Efficiency Rating -->
                <div class="flex items-center justify-center gap-1 text-2xl">
                  <span v-for="n in 3" :key="n" :class="n <= efficiencyRating.stars ? 'text-amber-400' : 'text-slate-600'">★</span>
                </div>
                <p class="text-xs font-black uppercase tracking-widest" :class="efficiencyRating.color">{{ efficiencyRating.label }}</p>
                <div class="grid grid-cols-2 gap-4 text-xs mt-4">
                  <div class="bg-white/5 p-2 rounded">
                    <span class="text-slate-500 uppercase text-[10px]">Time</span>
                    <p class="font-mono font-bold">{{ formatTime(store.time) }}</p>
                  </div>
                  <div class="bg-white/5 p-2 rounded">
                    <span class="text-slate-500 uppercase text-[10px]">Moves</span>
                    <p class="font-mono font-bold">{{ moveCount }}</p>
                  </div>
                </div>
             </div>
             <div class="flex flex-col sm:flex-row gap-3">
                <button
                  @click="store.nextLevel()"
                  class="flex-1 flex items-center justify-center space-x-2 bg-emerald-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 pointer-events-auto"
                >
                  <span>Next Level</span>
                  <RotateCcw :size="16" />
                </button>
             </div>
          </div>

          <div v-if="store.status === 'playing'" class="glass-panel p-4 flex items-center space-x-4 text-slate-400 pointer-events-auto">
             <span class="text-lg font-mono text-white">{{ formatTime(store.time) }}</span>
             <div class="h-6 w-px bg-white/10"></div>
             <button
               @click="isFirstPerson = !isFirstPerson"
               class="px-3 py-2 rounded-lg text-xs font-bold transition-all"
               :class="isFirstPerson ? 'bg-maze-neon text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'"
               title="Toggle camera view"
             >
               {{ isFirstPerson ? '1P' : '3P' }}
             </button>
             <div class="flex items-center space-x-2">
                <Maximize2 :size="14" />
                <span class="text-xs font-bold uppercase tracking-widest">WASD / Arrows</span>
             </div>
          </div>
       </main>

       <footer class="flex justify-between items-end">
          <div class="flex items-center space-x-4 md:space-x-6 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-slate-500">
             <span>© 2026 Made by MK — Built by Musharraf Kazi</span>
          </div>
          <div class="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">
             Press <kbd class="px-2 py-1 bg-white/10 rounded mx-1">H</kbd> for Help
          </div>
       </footer>
    </div>
  </div>
</template>
