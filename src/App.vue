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
  <div class="h-screen w-screen flex flex-col bg-maze-obsidian overflow-hidden font-mono text-maze-bone">
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
                    <TresBoxGeometry :args="[0.9, 1.2, 0.9]" />
                    <TresMeshStandardMaterial 
                      color="#0a0a20" 
                      :metalness="0.8" 
                      :roughness="0.1"
                      :emissive="'#00f3ff'"
                      :emissiveIntensity="0.1"
                    />
                 </TresMesh>
              </template>
           </template>
        </TresGroup>

        <TresMesh :position="[store.mazeSize - 1, 0.1, store.mazeSize - 2]">
           <TresBoxGeometry :args="[0.8, 0.2, 0.8]" />
           <TresMeshStandardMaterial 
            color="#10b981" 
            :emissive="'#10b981'"
            :emissiveIntensity="3" 
           />
        </TresMesh>

        <TresMesh :position="ballPos" cast-shadow>
           <TresSphereGeometry :args="[0.35, 32, 32]" />
           <TresMeshStandardMaterial 
             color="#00f3ff" 
             :emissive="'#00f3ff'" 
             :emissiveIntensity="2" 
           />
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
           <TresMeshStandardMaterial 
            color="#020617" 
            :metalness="0.5"
            :roughness="0.2"
           />
        </TresMesh>
      </TresCanvas>
    </div>

    <div class="relative z-10 h-full flex flex-col pointer-events-none p-7 md:p-11">
        <header class="flex justify-between items-start gap-4 flex-wrap">
          <div class="glass-panel p-5 md:p-6 border-l-4 border-maze-cyan flex items-center space-x-6">
             <div class="space-y-1">
                <span class="text-[8px] font-bold uppercase tracking-[0.4em] text-maze-cyan/60">NEURAL_DECODER</span>
                <div class="flex items-center space-x-3">
                   <h1 class="text-2xl md:text-4xl font-black text-maze-bone tracking-tighter">LVL_{{ String(store.level).padStart(2, '0') }}</h1>
                </div>
             </div>
             <div class="h-10 w-px bg-maze-cyan/20"></div>
             <div class="flex flex-col">
                <span class="text-[8px] font-bold uppercase tracking-widest text-maze-cyan/60">GRID_RES</span>
                <span class="text-sm md:text-lg font-bold text-maze-cyan tracking-tighter">{{ store.mazeSize }}x{{ store.mazeSize }}</span>
             </div>
          </div>

          <div class="glass-panel p-4 md:p-6 flex items-center space-x-4 text-white">
             <Trophy :size="18" class="text-amber-500" />
             <div class="flex flex-col">
                <span class="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Best</span>
                <span class="text-sm font-black">{{ store.bestTime >= 999999 ? '--:--' : formatTime(store.bestTime) }}</span>
             </div>
          </div>

          <div class="glass-panel p-4 md:p-6 flex items-center gap-2 text-maze-bone">
             <div class="flex gap-2">
               <button
                 v-for="size in [11, 15, 21]"
                 :key="size"
                 @click="changeMazeSize(size)"
                 class="px-4 py-3 rounded-none text-[10px] font-bold transition-all pointer-events-auto border"
                 :class="store.mazeSize === size
                   ? 'bg-maze-cyan text-maze-obsidian border-maze-cyan shadow-[0_0_15px_rgba(0,243,255,0.5)]'
                   : 'bg-maze-obsidian text-maze-cyan/50 border-maze-cyan/20 hover:border-maze-cyan/50 hover:text-maze-cyan'"
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
          <div v-if="store.status === 'idle'" class="glass-panel p-8 md:p-12 text-center space-y-8 pointer-events-auto max-w-sm border-maze-cyan/30">
             <div class="space-y-4">
                <h2 class="text-3xl md:text-5xl font-black uppercase text-maze-bone tracking-tighter leading-tight italic">MAZE_NET</h2>
                <div class="h-1 w-24 bg-maze-cyan mx-auto"></div>
                <p class="text-[10px] font-bold text-maze-cyan/60 uppercase tracking-[0.4em]">NEURAL_INTERFACE_INIT</p>
             </div>
             <button
               @click="store.startLevel()"
               class="w-full flex items-center justify-center space-x-3 bg-maze-cyan text-maze-obsidian py-5 rounded-none font-bold uppercase tracking-[0.3em] text-xs hover:bg-maze-bone transition-all pointer-events-auto shadow-[0_0_20px_rgba(0,243,255,0.4)]"
             >
               <Play :size="18" fill="currentColor" />
               <span>CONNECT</span>
             </button>
          </div>

          <div v-if="store.status === 'victory'" class="glass-panel p-8 md:p-12 text-center space-y-8 pointer-events-auto border-maze-success/50 bg-maze-success/10 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
             <Trophy :size="48" md:size="64" class="text-maze-success mx-auto animate-pulse" />
             <div class="space-y-3 text-maze-bone">
                <h2 class="text-4xl md:text-6xl font-black uppercase text-maze-success tracking-tighter italic">GATEWAY_OPEN</h2>
                <div class="flex items-center justify-center gap-1 text-2xl">
                  <span v-for="n in 3" :key="n" :class="n <= efficiencyRating.stars ? 'text-maze-cyan' : 'text-maze-bone/20'">★</span>
                </div>
                <p class="text-[10px] font-bold uppercase tracking-[0.4em] text-maze-cyan/60">{{ efficiencyRating.label }}</p>
                <div class="grid grid-cols-2 gap-4 text-[10px] mt-6">
                  <div class="bg-maze-obsidian/60 p-4 border border-maze-cyan/20">
                    <span class="text-maze-cyan/40 uppercase text-[8px] block mb-1">SYNC_TIME</span>
                    <p class="font-bold text-lg">{{ formatTime(store.time) }}</p>
                  </div>
                  <div class="bg-maze-obsidian/60 p-4 border border-maze-cyan/20">
                    <span class="text-maze-cyan/40 uppercase text-[8px] block mb-1">PULSES</span>
                    <p class="font-bold text-lg">{{ moveCount }}</p>
                  </div>
                </div>
             </div>
             <div class="flex flex-col sm:flex-row gap-4">
                <button
                  @click="store.nextLevel()"
                  class="flex-1 flex items-center justify-center space-x-3 bg-maze-success text-maze-obsidian py-5 rounded-none font-bold uppercase tracking-[0.2em] text-xs shadow-lg shadow-maze-success/20 pointer-events-auto hover:bg-maze-bone transition-all"
                >
                  <span>NEXT_PROTOCOL</span>
                  <RotateCcw :size="16" />
                </button>
             </div>
          </div>

          <div v-if="store.status === 'playing'" class="glass-panel p-4 flex items-center space-x-6 text-maze-cyan pointer-events-auto border-maze-cyan/20">
             <span class="text-2xl font-bold tracking-tighter text-maze-bone">{{ formatTime(store.time) }}</span>
             <div class="h-8 w-px bg-maze-cyan/20"></div>
             <button
               @click="isFirstPerson = !isFirstPerson"
               class="px-4 py-2 rounded-none text-[10px] font-bold transition-all border"
               :class="isFirstPerson ? 'bg-maze-cyan text-maze-obsidian border-maze-cyan' : 'bg-maze-obsidian text-maze-cyan/50 border-maze-cyan/20'"
               title="Toggle camera view"
             >
               {{ isFirstPerson ? 'CORE_VIEW' : 'SYNAPSE_VIEW' }}
             </button>
             <div class="flex items-center space-x-3 text-maze-cyan/60">
                <Maximize2 :size="14" />
                <span class="text-[10px] font-bold uppercase tracking-widest">NAV: WASD / ARROWS</span>
             </div>
          </div>
       </main>

        <footer class="flex justify-between items-end">
          <div class="flex items-center space-x-4 md:space-x-6 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.5em] text-maze-cyan/40">
             <span>MAZE_NET_V3 // PROTOCOL_NEURAL</span>
          </div>
          <div class="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-maze-cyan/60">
             CMD: <kbd class="px-2 py-1 bg-maze-cyan/10 border border-maze-cyan/20 rounded-none mx-1 text-maze-cyan">H</kbd>_HELP
          </div>
        </footer>
    </div>
  </div>
</template>
