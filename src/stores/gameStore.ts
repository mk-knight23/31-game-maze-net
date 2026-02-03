import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameStore = defineStore('game', () => {
  const scores = ref<number[]>([])
  const gamesPlayed = ref(0)
  const highScore = ref(0)

  function addScore(score: number) {
    scores.value.push(score)
    gamesPlayed.value++
    highScore.value = Math.max(highScore.value, score)
  }

  function resetStats() {
    scores.value = []
    gamesPlayed.value = 0
    highScore.value = 0
  }

  return { scores, gamesPlayed, highScore, addScore, resetStats }
})
