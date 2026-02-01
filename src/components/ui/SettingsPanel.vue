<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore, type Difficulty } from '@/stores/settings'
import { useStatsStore } from '@/stores/stats'
import { DIFFICULTY_PRESETS, KEYBOARD_SHORTCUTS } from '@/utils/constants'
import {
  Settings,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Monitor,
  HelpCircle,
  Trophy,
  RotateCcw,
  X,
} from 'lucide-vue-next'

const settings = useSettingsStore()
const stats = useStatsStore()

const difficultyOptions = Object.entries(DIFFICULTY_PRESETS).map(([key, value]) => ({
  value: key as Difficulty,
  label: value.name,
  size: `${value.mazeSize}x${value.mazeSize}`,
}))

const themeOptions = [
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'system' as const, label: 'System', icon: Monitor },
]

const isOpen = computed({
  get: () => settings.showHelp,
  set: (value) => (settings.showHelp = value),
})

function close() {
  settings.showHelp = false
}

function formatTime(seconds: number): string {
  if (seconds >= 999999) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div
          class="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto"
          role="document"
        >
          <header class="flex items-center justify-between p-6 border-b border-white/10">
            <div class="flex items-center space-x-3">
              <Settings :size="24" class="text-maze-cyan" />
              <h2 id="settings-title" class="text-xl font-bold text-maze-bone uppercase tracking-widest italic">NEURAL_DECODER_CONFIG</h2>
            </div>
            <button
              @click="close"
              class="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              aria-label="Close settings"
            >
              <X :size="20" />
            </button>
          </header>

          <div class="p-6 space-y-8">
            <section aria-labelledby="audio-section">
              <h3 id="audio-section" class="flex items-center space-x-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                <Volume2 :size="16" />
                <span>Audio</span>
              </h3>
              <div class="flex items-center justify-between p-4 bg-maze-obsidian border border-maze-cyan/10 rounded-none">
                <span class="text-maze-bone font-medium uppercase text-xs tracking-widest">AUDIO_EMISSION</span>
                <button
                  @click="settings.toggleSound()"
                  class="relative w-14 h-7 rounded-none transition-colors border border-maze-cyan/20"
                  :class="settings.soundEnabled ? 'bg-maze-cyan/40 border-maze-cyan' : 'bg-maze-obsidian'"
                  role="switch"
                  :aria-checked="settings.soundEnabled"
                >
                  <span
                    class="absolute top-1 left-1 w-5 h-5 bg-maze-bone rounded-none shadow transition-transform"
                    :class="settings.soundEnabled ? 'translate-x-7 bg-maze-cyan' : 'translate-x-0'"
                  />
                </button>
              </div>
            </section>

            <section aria-labelledby="theme-section">
              <h3 id="theme-section" class="flex items-center space-x-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                <Sun :size="16" />
                <span>Theme</span>
              </h3>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="option in themeOptions"
                  :key="option.value"
                  @click="settings.setTheme(option.value)"
                  class="flex flex-col items-center p-4 rounded-none transition-all border"
                  :class="settings.theme === option.value
                    ? 'border-maze-cyan bg-maze-cyan/10 text-maze-cyan shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                    : 'border-maze-cyan/10 hover:border-maze-cyan/40 bg-maze-obsidian text-maze-cyan/40'"
                  :aria-pressed="settings.theme === option.value"
                >
                  <component :is="option.icon" :size="20" class="mb-2" />
                  <span class="text-[10px] font-bold uppercase tracking-widest">{{ option.label }}</span>
                </button>
              </div>
            </section>

            <section aria-labelledby="difficulty-section">
              <h3 id="difficulty-section" class="flex items-center space-x-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                <Trophy :size="16" />
                <span>Difficulty</span>
              </h3>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="option in difficultyOptions"
                  :key="option.value"
                  @click="settings.setDifficulty(option.value)"
                  class="p-4 rounded-none transition-all border text-left"
                  :class="settings.difficulty === option.value
                    ? 'border-maze-cyan bg-maze-cyan/10 shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                    : 'border-maze-cyan/10 hover:border-maze-cyan/40 bg-maze-obsidian'"
                  :aria-pressed="settings.difficulty === option.value"
                >
                  <span class="block text-xs font-bold uppercase tracking-widest" :class="settings.difficulty === option.value ? 'text-maze-cyan' : 'text-maze-bone/40'">{{ option.label }}</span>
                  <span class="text-[10px] font-mono" :class="settings.difficulty === option.value ? 'text-maze-cyan/60' : 'text-maze-cyan/20'">{{ option.size }}</span>
                </button>
              </div>
            </section>

            <section aria-labelledby="stats-section">
              <h3 id="stats-section" class="flex items-center space-x-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                <Trophy :size="16" />
                <span>Statistics</span>
              </h3>
              <div class="grid grid-cols-2 gap-4 p-4 bg-maze-obsidian border border-maze-cyan/10 rounded-none">
                <div class="text-center p-3 border border-maze-cyan/5 bg-maze-void">
                  <div class="text-xl font-bold text-maze-bone">{{ stats.totalGames }}</div>
                  <div class="text-[8px] text-maze-cyan/40 uppercase tracking-widest space-y-1">SYNC_SESSIONS</div>
                </div>
                <div class="text-center p-3 border border-maze-cyan/5 bg-maze-void">
                  <div class="text-xl font-bold text-maze-success">{{ stats.winRate }}%</div>
                  <div class="text-[8px] text-maze-cyan/40 uppercase tracking-widest">SUCCESS_RATE</div>
                </div>
                <div class="text-center p-3 border border-maze-cyan/5 bg-maze-void">
                  <div class="text-xl font-bold text-maze-magenta">{{ formatTime(stats.bestTime) }}</div>
                  <div class="text-[8px] text-maze-cyan/40 uppercase tracking-widest">APEX_SYNC</div>
                </div>
                <div class="text-center p-3 border border-maze-cyan/5 bg-maze-void">
                  <div class="text-xl font-bold text-maze-cyan">{{ stats.currentStreak }}</div>
                  <div class="text-[8px] text-maze-cyan/40 uppercase tracking-widest">PULSE_STREAK</div>
                </div>
              </div>
              <button
                @click="stats.resetStats()"
                class="mt-4 w-full flex items-center justify-center space-x-2 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <RotateCcw :size="16" />
                <span class="text-sm font-medium">Reset Statistics</span>
              </button>
            </section>

            <section aria-labelledby="help-section">
              <h3 id="help-section" class="flex items-center space-x-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                <HelpCircle :size="16" />
                <span>Controls</span>
              </h3>
              <div class="space-y-2">
                <div
                  v-for="shortcut in KEYBOARD_SHORTCUTS"
                  :key="shortcut.action"
                  class="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <span class="text-sm text-slate-400">{{ shortcut.action }}</span>
                  <kbd class="px-3 py-1 text-xs font-mono text-white bg-white/10 rounded">{{ shortcut.key }}</kbd>
                </div>
              </div>
            </section>
          </div>

          <footer class="p-6 border-t border-maze-cyan/10 text-center">
            <p class="text-[10px] text-maze-cyan/30 uppercase tracking-[0.3em]">
              MAZE_NET // CORE_ENGINE v3.0.0
            </p>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
