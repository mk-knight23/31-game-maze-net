import { defineStore } from 'pinia'

export type GameStatus = 'idle' | 'playing' | 'gameover' | 'victory'

export const useMazeStore = defineStore('maze', {
  state: () => ({
    status: 'idle' as GameStatus,
    level: 1,
    mazeSize: 11,
    time: 0,
    bestTime: parseInt(localStorage.getItem('maze-best-time') || '999999'),
    isMuted: false
  }),
  actions: {
    startLevel() {
      this.status = 'playing'
      this.time = 0
      this.mazeSize = 11 + (this.level - 1) * 4
    },
    win() {
      this.status = 'victory'
      if (this.time < this.bestTime) {
        this.bestTime = this.time
        localStorage.setItem('maze-best-time', this.bestTime.toString())
      }
    },
    nextLevel() {
      this.level++
      this.startLevel()
    },
    resetGame() {
      this.level = 1
      this.status = 'idle'
    }
  }
})
