/**
 * Multiplayer Race Mode
 * Real-time racing against other players
 */

import { ref, computed } from 'vue'
import type { MazeGrid } from './proceduralMaze'

export type RaceStatus = 'waiting' | 'racing' | 'finished' | 'abandoned'

export interface Player {
  id: string
  name: string
  color: string
  position: { x: number; y: number }
  finished: boolean
  finishTime?: number
  isLocal: boolean
}

export interface RaceRoom {
  id: string
  name: string
  host: string
  players: Player[]
  status: RaceStatus
  mazeConfig: {
    width: number
    height: number
    algorithm: string
  }
  createdAt: number
}

export class MultiplayerRaceSystem {
  private currentRoom = ref<RaceRoom | null>(null)
  private localPlayerId: string
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor() {
    this.localPlayerId = this.generatePlayerId()
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async createRoom(roomName: string, mazeConfig: RaceRoom['mazeConfig']): Promise<RaceRoom> {
    const room: RaceRoom = {
      id: this.generateRoomId(),
      name: roomName,
      host: this.localPlayerId,
      players: [
        {
          id: this.localPlayerId,
          name: `Player_${this.localPlayerId.substr(-4)}`,
          color: this.getRandomColor(),
          position: { x: 0, y: 0 },
          finished: false,
          isLocal: true
        }
      ],
      status: 'waiting',
      mazeConfig,
      createdAt: Date.now()
    }

    this.currentRoom.value = room
    return room
  }

  async joinRoom(roomId: string): Promise<boolean> {
    // Simulated join - in production, this would connect to a real server
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Create a mock room for demonstration
      this.currentRoom.value = {
        id: roomId,
        name: `Room ${roomId.substr(-4)}`,
        host: 'other_player',
        players: [
          {
            id: 'other_player',
            name: 'Host',
            color: '#ff6b6b',
            position: { x: 0, y: 0 },
            finished: false,
            isLocal: false
          },
          {
            id: this.localPlayerId,
            name: `Player_${this.localPlayerId.substr(-4)}`,
            color: this.getRandomColor(),
            position: { x: 0, y: 0 },
            finished: false,
            isLocal: true
          }
        ],
        status: 'waiting',
        mazeConfig: { width: 15, height: 15, algorithm: 'recursive_backtracker' },
        createdAt: Date.now()
      }

      return true
    } catch (error) {
      console.error('Failed to join room:', error)
      return false
    }
  }

  startRace(): void {
    if (!this.currentRoom.value || this.currentRoom.value.host !== this.localPlayerId) {
      return
    }

    this.currentRoom.value.status = 'racing'
    this.broadcastRaceStart()
  }

  updatePosition(x: number, y: number): void {
    if (!this.currentRoom.value) return

    const player = this.currentRoom.value.players.find(p => p.isLocal)
    if (player) {
      player.position = { x, y }
      this.broadcastPosition(x, y)
    }
  }

  finishRace(): void {
    if (!this.currentRoom.value) return

    const player = this.currentRoom.value.players.find(p => p.isLocal)
    if (player) {
      player.finished = true
      player.finishTime = Date.now()
      this.broadcastFinish()
    }

    this.checkRaceEnd()
  }

  leaveRoom(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.currentRoom.value = null
    this.reconnectAttempts = 0
  }

  getRoom() {
    return this.currentRoom.value
  }

  getPlayers() {
    return computed(() => this.currentRoom.value?.players ?? [])
  }

  getRaceStatus() {
    return computed(() => this.currentRoom.value?.status ?? 'waiting')
  }

  getLeaderboard() {
    return computed(() => {
      if (!this.currentRoom.value) return []

      return [...this.currentRoom.value.players]
        .filter(p => p.finished)
        .sort((a, b) => (a.finishTime || Infinity) - (b.finishTime || Infinity))
    })
  }

  // Simulated WebSocket methods (in production, these would use real WebSockets)
  private broadcastPosition(x: number, y: number): void {
    // Simulate sending position to server
    console.log(`Broadcasting position: ${x}, ${y}`)
  }

  private broadcastRaceStart(): void {
    console.log('Broadcasting race start')
  }

  private broadcastFinish(): void {
    console.log('Broadcasting finish')
  }

  private onMessage(data: any): void {
    if (!this.currentRoom.value) return

    switch (data.type) {
      case 'player_joined':
        this.currentRoom.value.players.push(data.player)
        break
      case 'player_left':
        this.currentRoom.value.players = this.currentRoom.value.players.filter(
          p => p.id !== data.playerId
        )
        break
      case 'position_update':
        const player = this.currentRoom.value.players.find(p => p.id === data.playerId)
        if (player && !player.isLocal) {
          player.position = data.position
        }
        break
      case 'race_start':
        this.currentRoom.value.status = 'racing'
        break
      case 'player_finished':
        const finisher = this.currentRoom.value.players.find(p => p.id === data.playerId)
        if (finisher) {
          finisher.finished = true
          finisher.finishTime = data.time
        }
        this.checkRaceEnd()
        break
    }
  }

  private checkRaceEnd(): void {
    if (!this.currentRoom.value) return

    const allFinished = this.currentRoom.value.players.every(p => p.finished)
    if (allFinished && this.currentRoom.value.status === 'racing') {
      this.currentRoom.value.status = 'finished'
    }
  }

  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  private getRandomColor(): string {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
      '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Public methods for UI integration
  getPlayerCount(): number {
    return this.currentRoom.value?.players.length ?? 0
  }

  isHost(): boolean {
    return this.currentRoom.value?.host === this.localPlayerId ?? false
  }

  canStartRace(): boolean {
    return (
      this.isHost() &&
      this.currentRoom.value?.status === 'waiting' &&
      (this.currentRoom.value?.players.length ?? 0) >= 1
    )
  }

  getLocalPlayer(): Player | undefined {
    return this.currentRoom.value?.players.find(p => p.isLocal)
  }

  getOpponents(): Player[] {
    return this.currentRoom.value?.players.filter(p => !p.isLocal) ?? []
  }

  // Simulated room listing
  async getAvailableRooms(): Promise<RaceRoom[]> {
    // Return mock rooms for demonstration
    return [
      {
        id: 'room_demo_1',
        name: 'Beginner Maze',
        host: 'player_123',
        players: [],
        status: 'waiting',
        mazeConfig: { width: 10, height: 10, algorithm: 'recursive_backtracker' },
        createdAt: Date.now()
      },
      {
        id: 'room_demo_2',
        name: 'Speed Run',
        host: 'player_456',
        players: [],
        status: 'waiting',
        mazeConfig: { width: 20, height: 20, algorithm: 'prim' },
        createdAt: Date.now()
      }
    ]
  }
}

// Singleton instance
let multiplayerInstance: MultiplayerRaceSystem | null = null

export function useMultiplayerRace() {
  if (!multiplayerInstance) {
    multiplayerInstance = new MultiplayerRaceSystem()
  }

  return {
    room: multiplayerInstance.getRoom(),
    players: multiplayerInstance.getPlayers(),
    status: multiplayerInstance.getRaceStatus(),
    leaderboard: multiplayerInstance.getLeaderboard(),

    createRoom: multiplayerInstance.createRoom.bind(multiplayerInstance),
    joinRoom: multiplayerInstance.joinRoom.bind(multiplayerInstance),
    startRace: multiplayerInstance.startRace.bind(multiplayerInstance),
    updatePosition: multiplayerInstance.updatePosition.bind(multiplayerInstance),
    finishRace: multiplayerInstance.finishRace.bind(multiplayerInstance),
    leaveRoom: multiplayerInstance.leaveRoom.bind(multiplayerInstance),

    getPlayerCount: multiplayerInstance.getPlayerCount.bind(multiplayerInstance),
    isHost: multiplayerInstance.isHost.bind(multiplayerInstance),
    canStartRace: multiplayerInstance.canStartRace.bind(multiplayerInstance),
    getLocalPlayer: multiplayerInstance.getLocalPlayer.bind(multiplayerInstance),
    getOpponents: multiplayerInstance.getOpponents.bind(multiplayerInstance),
    getAvailableRooms: multiplayerInstance.getAvailableRooms.bind(multiplayerInstance)
  }
}
