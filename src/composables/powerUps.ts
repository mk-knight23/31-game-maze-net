/**
 * Power-up Items System
 * Collectible items that provide special abilities
 */

import { ref, computed } from 'vue'
import type { MazeGrid } from './proceduralMaze'

export type PowerUpType =
  | 'speed_boost'
  | 'wall_phasing'
  | 'compass'
  | 'time_freeze'
  | 'hint'
  | 'extra_time'
  | 'teleport'
  | 'reveal'

export interface PowerUp {
  id: string
  type: PowerUpType
  name: string
  description: string
  icon: string
  duration: number // milliseconds, 0 for instant
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  color: string
}

export interface ActivePowerUp {
  powerUp: PowerUp
  startTime: number
  endTime: number
  remainingUses?: number
}

export interface PlacedPowerUp {
  powerUp: PowerUp
  position: { x: number; y: number }
  collected: boolean
}

export class PowerUpSystem {
  private availablePowerUps: Map<PowerUpType, PowerUp> = new Map()
  private activePowerUps = ref<Map<PowerUpType, ActivePowerUp>>(new Map())
  private placedPowerUps = ref<PlacedPowerUp[]>([])
  private inventory = ref<Map<PowerUpType, number>>(new Map())

  constructor() {
    this.initializePowerUps()
    this.loadInventory()
  }

  private initializePowerUps(): void {
    const powerUps: PowerUp[] = [
      {
        id: 'speed_boost',
        type: 'speed_boost',
        name: 'Speed Boost',
        description: 'Move 2x faster for 10 seconds',
        icon: '⚡',
        duration: 10000,
        rarity: 'common',
        color: '#ffd700'
      },
      {
        id: 'wall_phasing',
        type: 'wall_phasing',
        name: 'Wall Phasing',
        description: 'Walk through walls for 5 seconds',
        icon: '👻',
        duration: 5000,
        rarity: 'rare',
        color: '#9932cc'
      },
      {
        id: 'compass',
        type: 'compass',
        name: 'Compass',
        description: 'Shows direction to exit for 15 seconds',
        icon: '🧭',
        duration: 15000,
        rarity: 'common',
        color: '#4169e1'
      },
      {
        id: 'time_freeze',
        type: 'time_freeze',
        name: 'Time Freeze',
        description: 'Stops the timer for 10 seconds',
        icon: '⏸️',
        duration: 10000,
        rarity: 'epic',
        color: '#00ced1'
      },
      {
        id: 'hint',
        type: 'hint',
        name: 'Hint',
        description: 'Reveals the correct path for 3 seconds',
        icon: '💡',
        duration: 3000,
        rarity: 'common',
        color: '#ffff00'
      },
      {
        id: 'extra_time',
        type: 'extra_time',
        name: 'Extra Time',
        description: 'Adds 30 seconds to the clock',
        icon: '⏰',
        duration: 0, // Instant
        rarity: 'rare',
        color: '#ff6347'
      },
      {
        id: 'teleport',
        type: 'teleport',
        name: 'Teleport',
        description: 'Teleport to a random location (click to use)',
        icon: '🌀',
        duration: 0, // Instant
        rarity: 'epic',
        color: '#ff69b4'
      },
      {
        id: 'reveal',
        type: 'reveal',
        name: 'Map Reveal',
        description: 'Reveals the entire maze for 5 seconds',
        icon: '🗺️',
        duration: 5000,
        rarity: 'legendary',
        color: '#ff4500'
      }
    ]

    powerUps.forEach(pu => this.availablePowerUps.set(pu.type, pu))
  }

  spawnPowerUps(grid: MazeGrid, count: number = 5): void {
    this.placedPowerUps.value = []
    const availableCells: { x: number; y: number }[] = []

    // Find all available cells (not start or end)
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (!grid[y][x].isStart && !grid[y][x].isEnd) {
          availableCells.push({ x, y })
        }
      }
    }

    // Shuffle and pick random cells
    for (let i = availableCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[availableCells[i], availableCells[j]] = [availableCells[j], availableCells[i]]
    }

    // Place power-ups based on rarity weights
    const rarityWeights = { common: 50, rare: 30, epic: 15, legendary: 5 }
    const types = Array.from(this.availablePowerUps.keys())

    for (let i = 0; i < Math.min(count, availableCells.length); i++) {
      // Weighted random selection based on rarity
      const random = Math.random() * 100
      let cumulative = 0
      let selectedType: PowerUpType = 'speed_boost'

      for (const type of types) {
        const powerUp = this.availablePowerUps.get(type)!
        cumulative += rarityWeights[powerUp.rarity]
        if (random <= cumulative) {
          selectedType = type
          break
        }
      }

      this.placedPowerUps.value.push({
        powerUp: this.availablePowerUps.get(selectedType)!,
        position: availableCells[i],
        collected: false
      })
    }
  }

  collectPowerUp(x: number, y: number): PowerUp | null {
    const placedIndex = this.placedPowerUps.value.findIndex(
      pu => pu.position.x === x && pu.position.y === y && !pu.collected
    )

    if (placedIndex === -1) return null

    const placed = this.placedPowerUps.value[placedIndex]
    placed.collected = true

    // Add to inventory
    const currentCount = this.inventory.value.get(placed.powerUp.type) || 0
    this.inventory.value.set(placed.powerUp.type, currentCount + 1)

    this.saveInventory()

    return placed.powerUp
  }

  usePowerUp(type: PowerUpType): boolean {
    const count = this.inventory.value.get(type) || 0
    if (count <= 0) return false

    const powerUp = this.availablePowerUps.get(type)
    if (!powerUp) return false

    // Remove from inventory
    this.inventory.value.set(type, count - 1)
    this.saveInventory()

    // Activate if it has a duration
    if (powerUp.duration > 0) {
      const active: ActivePowerUp = {
        powerUp,
        startTime: Date.now(),
        endTime: Date.now() + powerUp.duration
      }
      this.activePowerUps.value.set(type, active)

      // Auto-remove after duration
      setTimeout(() => {
        this.activePowerUps.value.delete(type)
      }, powerUp.duration)
    }

    return true
  }

  isPowerUpActive(type: PowerUpType): boolean {
    const active = this.activePowerUps.value.get(type)
    if (!active) return false

    if (Date.now() > active.endTime) {
      this.activePowerUps.value.delete(type)
      return false
    }

    return true
  }

  getActivePowerUps() {
    return computed(() => Array.from(this.activePowerUps.value.values()))
  }

  getPowerUpRemainingTime(type: PowerUpType): number {
    const active = this.activePowerUps.value.get(type)
    if (!active) return 0
    return Math.max(0, active.endTime - Date.now())
  }

  getInventory() {
    return computed(() => {
      const items: { powerUp: PowerUp; count: number }[] = []
      for (const [type, count] of this.inventory.value.entries()) {
        if (count > 0) {
          const powerUp = this.availablePowerUps.get(type)
          if (powerUp) {
            items.push({ powerUp, count })
          }
        }
      }
      return items.sort((a, b) => a.powerUp.name.localeCompare(b.powerUp.name))
    })
  }

  getPlacedPowerUps() {
    return computed(() => this.placedPowerUps.value.filter(pu => !pu.collected))
  }

  hasPowerUp(type: PowerUpType): boolean {
    return (this.inventory.value.get(type) || 0) > 0
  }

  getPowerUpCount(type: PowerUpType): number {
    return this.inventory.value.get(type) || 0
  }

  // Power-up effects
  getSpeedMultiplier(): number {
    return this.isPowerUpActive('speed_boost') ? 2 : 1
  }

  canPhaseWalls(): boolean {
    return this.isPowerUpActive('wall_phasing')
  }

  showCompass(): boolean {
    return this.isPowerUpActive('compass')
  }

  isTimeFrozen(): boolean {
    return this.isPowerUpActive('time_freeze')
  }

  showHint(): boolean {
    return this.isPowerUpActive('hint')
  }

  showFullMap(): boolean {
    return this.isPowerUpActive('reveal')
  }

  // Special effects
  getCompassDirection(currentPos: { x: number; y: number }, endPos: { x: number; y: number }): { x: number; y: number } {
    const dx = endPos.x - currentPos.x
    const dy = endPos.y - currentPos.y
    const length = Math.sqrt(dx * dx + dy * dy)
    return {
      x: dx / length,
      y: dy / length
    }
  }

  clear(): void {
    this.activePowerUps.value.clear()
    this.placedPowerUps.value = []
  }

  private saveInventory(): void {
    try {
      const data = Array.from(this.inventory.value.entries())
      localStorage.setItem('maze_net_powerups', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save power-up inventory:', e)
    }
  }

  private loadInventory(): void {
    try {
      const saved = localStorage.getItem('maze_net_powerups')
      if (!saved) return

      const data: Array<[PowerUpType, number]> = JSON.parse(saved)
      this.inventory.value = new Map(data)
    } catch (e) {
      console.error('Failed to load power-up inventory:', e)
    }
  }

  resetInventory(): void {
    this.inventory.value.clear()
    this.saveInventory()
  }
}

let powerUpInstance: PowerUpSystem | null = null

export function usePowerUps() {
  if (!powerUpInstance) {
    powerUpInstance = new PowerUpSystem()
  }

  return {
    activePowerUps: powerUpInstance.getActivePowerUps(),
    inventory: powerUpInstance.getInventory(),
    placedPowerUps: powerUpInstance.getPlacedPowerUps(),

    spawnPowerUps: powerUpInstance.spawnPowerUps.bind(powerUpInstance),
    collectPowerUp: powerUpInstance.collectPowerUp.bind(powerUpInstance),
    usePowerUp: powerUpInstance.usePowerUp.bind(powerUpInstance),
    hasPowerUp: powerUpInstance.hasPowerUp.bind(powerUpInstance),
    getPowerUpCount: powerUpInstance.getPowerUpCount.bind(powerUpInstance),

    getSpeedMultiplier: powerUpInstance.getSpeedMultiplier.bind(powerUpInstance),
    canPhaseWalls: powerUpInstance.canPhaseWalls.bind(powerUpInstance),
    showCompass: powerUpInstance.showCompass.bind(powerUpInstance),
    isTimeFrozen: powerUpInstance.isTimeFrozen.bind(powerUpInstance),
    showHint: powerUpInstance.showHint.bind(powerUpInstance),
    showFullMap: powerUpInstance.showFullMap.bind(powerUpInstance),

    getPowerUpRemainingTime: powerUpInstance.getPowerUpRemainingTime.bind(powerUpInstance),
    getCompassDirection: powerUpInstance.getCompassDirection.bind(powerUpInstance),
    clear: powerUpInstance.clear.bind(powerUpInstance),
    resetInventory: powerUpInstance.resetInventory.bind(powerUpInstance)
  }
}
