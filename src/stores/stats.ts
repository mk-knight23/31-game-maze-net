import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '@/utils/constants'

// V2: Level result tracking
export interface LevelResult {
  level: number
  size: number
  time: number
  moves: number
  parTime: number
  stars: number
  date: string
}

export const useStatsStore = defineStore('stats', () => {
  const totalGames = ref<number>(0)
  const totalWins = ref<number>(0)
  const totalLosses = ref<number>(0)
  const bestTime = ref<number>(999999)
  const totalTimePlayed = ref<number>(0)
  const currentStreak = ref<number>(0)
  const longestStreak = ref<number>(0)
  // V2: Level history for replayability
  const levelHistory = ref<LevelResult[]>([])

  const winRate = computed(() => {
    if (totalGames.value === 0) return 0
    return Math.round((totalWins.value / totalGames.value) * 100)
  })

  const averageTime = computed(() => {
    if (totalWins.value === 0) return 0
    return Math.round(totalTimePlayed.value / totalWins.value)
  })

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STATS)
      if (stored) {
        const data = JSON.parse(stored)
        totalGames.value = data.totalGames ?? 0
        totalWins.value = data.totalWins ?? 0
        totalLosses.value = data.totalLosses ?? 0
        bestTime.value = data.bestTime ?? 999999
        totalTimePlayed.value = data.totalTimePlayed ?? 0
        currentStreak.value = data.currentStreak ?? 0
        longestStreak.value = data.longestStreak ?? 0
      }
    } catch (e) {
      console.warn('Failed to load stats:', e)
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEYS.STATS,
        JSON.stringify({
          totalGames: totalGames.value,
          totalWins: totalWins.value,
          totalLosses: totalLosses.value,
          bestTime: bestTime.value,
          totalTimePlayed: totalTimePlayed.value,
          currentStreak: currentStreak.value,
          longestStreak: longestStreak.value,
        })
      )
    } catch (e) {
      console.warn('Failed to save stats:', e)
    }
  }

  function recordWin(time: number) {
    totalGames.value++
    totalWins.value++
    totalTimePlayed.value += time
    currentStreak.value++
    if (currentStreak.value > longestStreak.value) {
      longestStreak.value = currentStreak.value
    }
    if (time < bestTime.value) {
      bestTime.value = time
    }
    saveToStorage()
  }

  function recordLoss() {
    totalGames.value++
    totalLosses.value++
    currentStreak.value = 0
    saveToStorage()
  }

  function resetStats() {
    totalGames.value = 0
    totalWins.value = 0
    totalLosses.value = 0
    totalTimePlayed.value = 0
    currentStreak.value = 0
    levelHistory.value = []
    saveToStorage()
  }

  // V2: Add level result with star rating
  function addResult(result: LevelResult) {
    levelHistory.value.unshift(result) // Add to beginning
    // Keep only last 50 results
    if (levelHistory.value.length > 50) {
      levelHistory.value = levelHistory.value.slice(0, 50)
    }
    // Also record as win for backwards compatibility
    recordWin(result.time)
  }

  // V2: Get best result for a specific level/size combo
  function getBestForLevel(level: number, size: number): LevelResult | undefined {
    return levelHistory.value.find(r => r.level === level && r.size === size)
  }

  // V2: Get total stars earned
  const totalStars = computed(() => {
    return levelHistory.value.reduce((sum, r) => sum + r.stars, 0)
  })

  return {
    totalGames,
    totalWins,
    totalLosses,
    bestTime,
    totalTimePlayed,
    currentStreak,
    longestStreak,
    winRate,
    averageTime,
    levelHistory,
    totalStars,
    loadFromStorage,
    saveToStorage,
    recordWin,
    recordLoss,
    resetStats,
    addResult,
    getBestForLevel,
  }
})
