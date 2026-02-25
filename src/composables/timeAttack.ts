/**
 * Time Attack Challenges
 * Compete against the clock and leaderboards
 */

import { ref, computed } from 'vue'
import type { MazeConfig } from './proceduralMaze'

export type ChallengeCategory = 'speed' | 'efficiency' | 'blind' | 'memory'

export interface Challenge {
  id: string
  name: string
  description: string
  category: ChallengeCategory
  mazeConfig: MazeConfig
  timeLimit: number // seconds
  targetTime?: number // seconds (for gold medal)
  parTime?: number // seconds (for bronze medal)
  rewards: {
    gold: number
    silver: number
    bronze: number
  }
  isDaily: boolean
  isLocked: boolean
  completionCount: number
}

export interface ChallengeAttempt {
  challengeId: string
  startTime: number
  endTime: number
  completed: boolean
  timeElapsed: number
  medal: 'gold' | 'silver' | 'bronze' | null
  timestamp: number
}

export class TimeAttackSystem {
  private challenges = ref<Challenge[]>(this.initializeChallenges())
  private attempts = ref<ChallengeAttempt[]>([])
  private currentChallenge = ref<Challenge | null>(null)
  private challengeStartTime = ref<number>(0)
  private isRunning = ref(false)

  constructor() {
    this.loadProgress()
  }

  private initializeChallenges(): Challenge[] {
    return [
      // Speed Challenges
      {
        id: 'speed_easy',
        name: 'Quick Sprint',
        description: 'Complete a small maze as fast as possible',
        category: 'speed',
        mazeConfig: { width: 10, height: 10, algorithm: 'recursive_backtracker', difficulty: 'easy' },
        timeLimit: 60,
        targetTime: 15,
        parTime: 30,
        rewards: { gold: 100, silver: 50, bronze: 25 },
        isDaily: false,
        isLocked: false,
        completionCount: 0
      },
      {
        id: 'speed_medium',
        name: 'Marathon Runner',
        description: 'Navigate a medium-sized maze quickly',
        category: 'speed',
        mazeConfig: { width: 20, height: 20, algorithm: 'prim', difficulty: 'medium' },
        timeLimit: 180,
        targetTime: 45,
        parTime: 90,
        rewards: { gold: 200, silver: 100, bronze: 50 },
        isDaily: false,
        isLocked: false,
        completionCount: 0
      },
      {
        id: 'speed_hard',
        name: 'Lightning Fast',
        description: 'Extreme speed challenge',
        category: 'speed',
        mazeConfig: { width: 30, height: 30, algorithm: 'kruskal', difficulty: 'hard' },
        timeLimit: 300,
        targetTime: 90,
        parTime: 180,
        rewards: { gold: 500, silver: 250, bronze: 125 },
        isDaily: false,
        isLocked: true,
        completionCount: 0
      },

      // Efficiency Challenges
      {
        id: 'efficiency_shortest',
        name: 'Perfect Path',
        description: 'Find the optimal solution with minimal steps',
        category: 'efficiency',
        mazeConfig: { width: 15, height: 15, algorithm: 'eller', difficulty: 'medium' },
        timeLimit: 120,
        targetTime: 30,
        parTime: 60,
        rewards: { gold: 150, silver: 75, bronze: 35 },
        isDaily: false,
        isLocked: false,
        completionCount: 0
      },

      // Blind Challenges
      {
        id: 'blind_easy',
        name: 'Blind Faith',
        description: 'Navigate without seeing the full maze',
        category: 'blind',
        mazeConfig: { width: 12, height: 12, algorithm: 'binary_tree', difficulty: 'easy' },
        timeLimit: 90,
        targetTime: 25,
        parTime: 50,
        rewards: { gold: 175, silver: 85, bronze: 40 },
        isDaily: false,
        isLocked: true,
        completionCount: 0
      },

      // Memory Challenges
      {
        id: 'memory_recall',
        name: 'Memory Master',
        description: 'Memorize the maze before it disappears',
        category: 'memory',
        mazeConfig: { width: 15, height: 15, algorithm: 'recursive_backtracker', difficulty: 'medium' },
        timeLimit: 180,
        targetTime: 40,
        parTime: 80,
        rewards: { gold: 300, silver: 150, bronze: 75 },
        isDaily: false,
        isLocked: true,
        completionCount: 0
      },

      // Daily Challenge
      {
        id: 'daily_challenge',
        name: 'Daily Challenge',
        description: 'A new challenge every day!',
        category: 'speed',
        mazeConfig: { width: 25, height: 25, algorithm: 'prim', difficulty: 'hard' },
        timeLimit: 240,
        targetTime: 60,
        parTime: 120,
        rewards: { gold: 1000, silver: 500, bronze: 250 },
        isDaily: true,
        isLocked: false,
        completionCount: 0
      }
    ]
  }

  getChallenges() {
    return computed(() => this.challenges.value)
  }

  getChallengeById(id: string) {
    return computed(() => this.challenges.value.find(c => c.id === id))
  }

  getDailyChallenge() {
    return computed(() => {
      const daily = this.challenges.value.find(c => c.isDaily)
      if (daily) {
        // Update maze seed based on date
        const today = new Date()
        const seed = parseInt(`${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`)
        return { ...daily, mazeConfig: { ...daily.mazeConfig, seed } }
      }
      return null
    })
  }

  startChallenge(challengeId: string): boolean {
    const challenge = this.challenges.value.find(c => c.id === challengeId)
    if (!challenge || challenge.isLocked) return false

    this.currentChallenge.value = challenge
    this.challengeStartTime.value = Date.now()
    this.isRunning.value = true

    return true
  }

  completeChallenge(): ChallengeAttempt | null {
    if (!this.currentChallenge.value || !this.isRunning.value) return null

    const endTime = Date.now()
    const timeElapsed = (endTime - this.challengeStartTime.value) / 1000
    const challenge = this.currentChallenge.value

    const attempt: ChallengeAttempt = {
      challengeId: challenge.id,
      startTime: this.challengeStartTime.value,
      endTime,
      completed: timeElapsed <= challenge.timeLimit,
      timeElapsed,
      medal: this.calculateMedal(timeElapsed, challenge),
      timestamp: endTime
    }

    this.attempts.value.push(attempt)

    // Update challenge completion count
    const challengeIndex = this.challenges.value.findIndex(c => c.id === challenge.id)
    if (challengeIndex !== -1) {
      this.challenges.value[challengeIndex].completionCount++
    }

    // Unlock new challenges based on completions
    this.checkUnlocks()

    this.isRunning.value = false
    this.currentChallenge.value = null

    this.saveProgress()

    return attempt
  }

  abandonChallenge(): void {
    this.isRunning.value = false
    this.currentChallenge.value = null
  }

  getCurrentChallenge() {
    return computed(() => this.currentChallenge.value)
  }

  getElapsedTime() {
    return computed(() => {
      if (!this.isRunning.value) return 0
      return (Date.now() - this.challengeStartTime.value) / 1000
    })
  }

  isChallengeRunning() {
    return computed(() => this.isRunning.value)
  }

  getTimeRemaining() {
    return computed(() => {
      if (!this.currentChallenge.value || !this.isRunning.value) return 0
      const elapsed = this.getElapsedTime().value
      return Math.max(0, this.currentChallenge.value.timeLimit - elapsed)
    })
  }

  getBestAttempt(challengeId: string) {
    return computed(() => {
      const challengeAttempts = this.attempts.value.filter(a => a.challengeId === challengeId && a.completed)
      if (challengeAttempts.length === 0) return null

      return challengeAttempts.sort((a, b) => a.timeElapsed - b.timeElapsed)[0]
    })
  }

  getMedalCount(medal: 'gold' | 'silver' | 'bronze') {
    return computed(() => {
      return this.attempts.value.filter(a => a.medal === medal).length
    })
  }

  getTotalScore() {
    return computed(() => {
      return this.attempts.value.reduce((total, attempt) => {
        if (attempt.medal && attempt.completed) {
          const challenge = this.challenges.value.find(c => c.id === attempt.challengeId)
          if (challenge) {
            return total + challenge.rewards[attempt.medal]
          }
        }
        return total
      }, 0)
    })
  }

  getLeaderboard(challengeId: string) {
    return computed(() => {
      const challengeAttempts = this.attempts.value
        .filter(a => a.challengeId === challengeId && a.completed)
        .sort((a, b) => a.timeElapsed - b.timeElapsed)
        .slice(0, 10)

      return challengeAttempts.map((attempt, index) => ({
        rank: index + 1,
        time: attempt.timeElapsed,
        medal: attempt.medal,
        date: new Date(attempt.timestamp).toLocaleDateString()
      }))
    })
  }

  private calculateMedal(time: number, challenge: Challenge): 'gold' | 'silver' | 'bronze' | null {
    if (time <= (challenge.targetTime || Infinity)) return 'gold'
    if (time <= (challenge.parTime || Infinity)) return 'silver'
    if (time <= challenge.timeLimit) return 'bronze'
    return null
  }

  private checkUnlocks(): void {
    const totalCompletions = this.attempts.value.filter(a => a.completed).length

    this.challenges.value.forEach(challenge => {
      if (challenge.isLocked) {
        // Unlock logic based on completions
        if (totalCompletions >= 3) {
          challenge.isLocked = false
        }
      }
    })
  }

  private saveProgress(): void {
    try {
      const data = {
        attempts: this.attempts.value,
        challenges: this.challenges.value.map(c => ({
          id: c.id,
          completionCount: c.completionCount,
          isLocked: c.isLocked
        }))
      }
      localStorage.setItem('maze_net_challenges', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save challenge progress:', e)
    }
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem('maze_net_challenges')
      if (!saved) return

      const data = JSON.parse(saved)

      // Load attempts
      this.attempts.value = data.attempts || []

      // Update challenge state
      if (data.challenges) {
        data.challenges.forEach((saved: any) => {
          const challenge = this.challenges.value.find(c => c.id === saved.id)
          if (challenge) {
            challenge.completionCount = saved.completionCount || 0
            challenge.isLocked = saved.isLocked || false
          }
        })
      }
    } catch (e) {
      console.error('Failed to load challenge progress:', e)
    }
  }

  resetProgress(): void {
    this.attempts.value = []
    this.challenges.value.forEach(c => {
      c.completionCount = 0
      c.isLocked = c.id !== 'speed_easy' && c.id !== 'daily_challenge'
    })
    this.saveProgress()
  }
}

let timeAttackInstance: TimeAttackSystem | null = null

export function useTimeAttack() {
  if (!timeAttackInstance) {
    timeAttackInstance = new TimeAttackSystem()
  }

  return {
    challenges: timeAttackInstance.getChallenges(),
    dailyChallenge: timeAttackInstance.getDailyChallenge(),
    currentChallenge: timeAttackInstance.getCurrentChallenge(),
    elapsedTime: timeAttackInstance.getElapsedTime(),
    isRunning: timeAttackInstance.isChallengeRunning(),
    timeRemaining: timeAttackInstance.getTimeRemaining(),
    goldCount: timeAttackInstance.getMedalCount('gold'),
    silverCount: timeAttackInstance.getMedalCount('silver'),
    bronzeCount: timeAttackInstance.getMedalCount('bronze'),
    totalScore: timeAttackInstance.getTotalScore(),

    startChallenge: timeAttackInstance.startChallenge.bind(timeAttackInstance),
    completeChallenge: timeAttackInstance.completeChallenge.bind(timeAttackInstance),
    abandonChallenge: timeAttackInstance.abandonChallenge.bind(timeAttackInstance),
    getBestAttempt: timeAttackInstance.getBestAttempt.bind(timeAttackInstance),
    getLeaderboard: timeAttackInstance.getLeaderboard.bind(timeAttackInstance),
    resetProgress: timeAttackInstance.resetProgress.bind(timeAttackInstance)
  }
}
