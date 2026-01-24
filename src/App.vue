<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useMazeStore } from './stores/maze'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, Stars } from '@tresjs/cientos'
import { generateMaze } from './utils/mazeGenerator'
import { 
  Trophy, 
  ChevronRight, 
  Github,
  Maximize2
} from 'lucide-vue-next'

const store = useMazeStore()
const mazeData = ref<number[][]>([])

onMounted(() => {
  regenerateMaze()
})

function regenerateMaze() {
  mazeData.value = generateMaze(store.mazeSize)
}

watch(() => store.level, regenerateMaze)

const ballPos = ref<[number, number, number]>([1, 0, 1])

function handleMove(dir: [number, number]) {
  if (store.status !== 'playing') return
  const nextX = ballPos.value[0] + dir[0]
  const nextZ = ballPos.value[2] + dir[1]

  if (nextX >= 0 && nextX < store.mazeSize && nextZ >= 0 && nextZ < store.mazeSize) {
    if (mazeData.value[Math.floor(nextX)][Math.floor(nextZ)] === 0) {
       ballPos.value = [nextX, 0, nextZ]
       if (nextX === store.mazeSize - 1 && Math.floor(nextZ) === store.mazeSize - 2) {
          store.win()
       }
    }
  }
}

window.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowUp': handleMove([0, -1]); break
    case 'ArrowDown': handleMove([0, 1]); break
    case 'ArrowLeft': handleMove([-1, 0]); break
    case 'ArrowRight': handleMove([1, 0]); break
  }
})
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-maze-bg overflow-hidden font-sans">
    
    <!-- 3D Layer -->
    <div class="absolute inset-0 z-0">
      <TresCanvas shadows alpha>
        <TresPerspectiveCamera :position="[store.mazeSize/2, 20, store.mazeSize]" :look-at="[store.mazeSize/2, 0, store.mazeSize/2]" />
        <OrbitControls :enable-zoom="true" />
        
        <Stars :radius="100" :count="3000" />
        <TresAmbientLight :intensity="0.4" />
        <TresDirectionalLight :position="[10, 10, 10]" :intensity="1" cast-shadow />

        <!-- Maze Walls -->
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

        <!-- Floor -->
        <TresMesh :position="[store.mazeSize / 2, -0.1, store.mazeSize / 2]" :rotation="[-Math.PI / 2, 0, 0]">
           <TresPlaneGeometry :args="[store.mazeSize + 2, store.mazeSize + 2]" />
           <TresMeshStandardMaterial color="#050510" />
        </TresMesh>
      </TresCanvas>
    </div>

    <!-- UI Overlay -->
    <div class="relative z-10 h-full flex flex-col pointer-events-none p-10">
       
       <header class="flex justify-between items-start">
          <div class="glass-panel p-6 flex items-center space-x-6">
             <div class="space-y-1">
                <span class="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">Level Progression</span>
                <div class="flex items-center space-x-3">
                   <h1 class="text-3xl font-display font-black text-white">0{{ store.level }}</h1>
                   <div class="px-3 py-1 bg-maze-neon text-black font-black text-[10px] rounded-lg">PRO</div>
                </div>
             </div>
             <div class="h-10 w-px bg-white/10"></div>
             <div class="flex flex-col">
                <span class="text-[8px] font-black uppercase tracking-widest text-slate-500">Resolution</span>
                <span class="text-sm font-bold text-white tracking-tighter">{{ store.mazeSize }}x{{ store.mazeSize }}</span>
             </div>
          </div>

          <div class="glass-panel p-6 flex items-center space-x-4 text-white">
             <Trophy :size="18" class="text-amber-500" />
             <div class="flex flex-col">
                <span class="text-[8px] font-black uppercase tracking-widest text-slate-500">Fastest Run</span>
                <span class="text-sm font-black">{{ store.bestTime === 999999 ? '--:--' : store.bestTime + 's' }}</span>
             </div>
          </div>
       </header>

       <main class="flex-1 flex items-center justify-center">
          
          <!-- Modals -->
          <div v-if="store.status === 'idle'" class="glass-panel p-12 text-center space-y-8 pointer-events-auto max-w-sm">
             <div class="space-y-2">
                <h2 class="text-4xl font-display font-black uppercase text-white tracking-tighter leading-none italic">Quantum <br/> Labyrinth</h2>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Hardware-Accelerated Engine</p>
             </div>
             <button @click="store.startLevel()" class="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-maze-neon transition-all">
                Initiate Grid
             </button>
          </div>

          <div v-if="store.status === 'victory'" class="glass-panel p-12 text-center space-y-8 pointer-events-auto border-emerald-500/50 bg-emerald-950/20">
             <Trophy :size="64" class="text-emerald-500 mx-auto animate-pulse" />
             <div class="space-y-2 text-white">
                <h2 class="text-5xl font-display font-black uppercase text-emerald-500">Success</h2>
                <p class="text-xs font-black uppercase tracking-widest text-white">Navigation Integrity Verified</p>
             </div>
             <button @click="store.nextLevel()" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20">
                Advance Sequence
             </button>
          </div>

       </main>

       <footer class="flex justify-between items-end">
          <div class="flex items-center space-x-6 text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">
             <a href="https://github.com/mk-knight23/34-Astray-Maze-Puzzle" target="_blank" class="hover:text-white pointer-events-auto transition-colors">Source//Control</a>
          </div>
          <div v-if="store.status === 'playing'" class="glass-panel p-4 flex items-center space-x-6 text-slate-400">
             <div class="flex items-center space-x-2">
                <Maximize2 :size="14" />
                <span class="text-[10px] font-bold uppercase tracking-widest">WASD Control</span>
             </div>
          </div>
       </footer>

    </div>
  </div>
</template>
