/**
 * Custom Maze Editor
 * Create, edit, and save custom mazes
 */

import { ref, computed } from 'vue'
import type { MazeGrid, MazeCell, MazeAlgorithm } from './proceduralMaze'

export type EditorTool = 'wall' | 'path' | 'start' | 'end' | 'erase'

export interface CustomMaze {
  id: string
  name: string
  description: string
  width: number
  height: number
  grid: MazeGrid
  createdAt: number
  updatedAt: number
  plays: number
  isPublished: boolean
}

export interface EditorState {
  grid: MazeGrid
  selectedTool: EditorTool
  isDrawing: boolean
  gridSize: { width: number; height: number }
  hasUnsavedChanges: boolean
}

export class MazeEditor {
  private customMazes = ref<CustomMaze[]>([])
  private currentMaze = ref<CustomMaze | null>(null)
  private editorState = ref<EditorState>({
    grid: [],
    selectedTool: 'wall',
    isDrawing: false,
    gridSize: { width: 15, height: 15 },
    hasUnsavedChanges: false
  })

  constructor() {
    this.loadCustomMazes()
  }

  // Editor Management
  createNewMaze(width: number, height: number): void {
    const grid = this.createEmptyGrid(width, height)

    // Set default start and end
    grid[0][0].isStart = true
    grid[0][0].walls = { top: false, right: true, bottom: true, left: false }
    grid[height - 1][width - 1].isEnd = true
    grid[height - 1][width - 1].walls = { top: true, right: false, bottom: false, left: true }

    this.editorState.value = {
      grid,
      selectedTool: 'wall',
      isDrawing: false,
      gridSize: { width, height },
      hasUnsavedChanges: true
    }

    this.currentMaze.value = null
  }

  loadMaze(mazeId: string): boolean {
    const maze = this.customMazes.value.find(m => m.id === mazeId)
    if (!maze) return false

    // Deep clone the grid
    const grid = this.cloneGrid(maze.grid)

    this.editorState.value = {
      grid,
      selectedTool: 'wall',
      isDrawing: false,
      gridSize: { width: maze.width, height: maze.height },
      hasUnsavedChanges: false
    }

    this.currentMaze.value = maze
    return true
  }

  saveMaze(name: string, description: string): CustomMaze | null {
    const { grid, gridSize } = this.editorState.value

    if (!this.validateMaze(grid)) {
      alert('Maze must have a start and end point!')
      return null
    }

    const maze: CustomMaze = {
      id: this.currentMaze.value?.id || this.generateMazeId(),
      name,
      description,
      width: gridSize.width,
      height: gridSize.height,
      grid: this.cloneGrid(grid),
      createdAt: this.currentMaze.value?.createdAt || Date.now(),
      updatedAt: Date.now(),
      plays: this.currentMaze.value?.plays || 0,
      isPublished: this.currentMaze.value?.isPublished || false
    }

    // Update or add to list
    const existingIndex = this.customMazes.value.findIndex(m => m.id === maze.id)
    if (existingIndex !== -1) {
      this.customMazes.value[existingIndex] = maze
    } else {
      this.customMazes.value.push(maze)
    }

    this.currentMaze.value = maze
    this.editorState.value.hasUnsavedChanges = false

    this.saveCustomMazes()
    return maze
  }

  deleteMaze(mazeId: string): boolean {
    const index = this.customMazes.value.findIndex(m => m.id === mazeId)
    if (index === -1) return false

    this.customMazes.value.splice(index, 1)

    if (this.currentMaze.value?.id === mazeId) {
      this.currentMaze.value = null
      this.editorState.value.grid = []
    }

    this.saveCustomMazes()
    return true
  }

  publishMaze(mazeId: string): boolean {
    const maze = this.customMazes.value.find(m => m.id === mazeId)
    if (!maze) return false

    maze.isPublished = true
    this.saveCustomMazes()
    return true
  }

  // Grid Editing
  applyTool(x: number, y: number): void {
    const { grid, selectedTool } = this.editorState.value

    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return

    const cell = grid[y][x]

    switch (selectedTool) {
      case 'wall':
        cell.walls = { top: true, right: true, bottom: true, left: true }
        cell.isStart = false
        cell.isEnd = false
        break

      case 'path':
        cell.walls = { top: false, right: false, bottom: false, left: false }
        break

      case 'start':
        // Remove existing start
        for (const row of grid) {
          for (const c of row) {
            c.isStart = false
          }
        }
        cell.isStart = true
        cell.isEnd = false
        cell.walls = { top: false, right: false, bottom: false, left: false }
        break

      case 'end':
        // Remove existing end
        for (const row of grid) {
          for (const c of row) {
            c.isEnd = false
          }
        }
        cell.isEnd = true
        cell.isStart = false
        cell.walls = { top: false, right: false, bottom: false, left: false }
        break

      case 'erase':
        cell.walls = { top: false, right: false, bottom: false, left: false }
        cell.isStart = false
        cell.isEnd = false
        break
    }

    this.editorState.value.hasUnsavedChanges = true
  }

  toggleWall(x: number, y: number, wall: 'top' | 'right' | 'bottom' | 'left'): void {
    const { grid } = this.editorState.value

    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return

    const cell = grid[y][x]
    cell.walls[wall] = !cell.walls[wall]

    // Update adjacent cell's wall
    if (wall === 'top' && y > 0) {
      grid[y - 1][x].walls.bottom = cell.walls.top
    } else if (wall === 'bottom' && y < grid.length - 1) {
      grid[y + 1][x].walls.top = cell.walls.bottom
    } else if (wall === 'left' && x > 0) {
      grid[y][x - 1].walls.right = cell.walls.left
    } else if (wall === 'right' && x < grid[0].length - 1) {
      grid[y][x + 1].walls.left = cell.walls.right
    }

    this.editorState.value.hasUnsavedChanges = true
  }

  resizeGrid(newWidth: number, newHeight: number): void {
    const { grid } = this.editorState.value
    const newGrid = this.createEmptyGrid(newWidth, newHeight)

    // Copy existing cells
    for (let y = 0; y < Math.min(grid.length, newHeight); y++) {
      for (let x = 0; x < Math.min(grid[0].length, newWidth); x++) {
        newGrid[y][x] = { ...grid[y][x] }
      }
    }

    this.editorState.value.grid = newGrid
    this.editorState.value.gridSize = { width: newWidth, height: newHeight }
    this.editorState.value.hasUnsavedChanges = true
  }

  clearGrid(): void {
    const { width, height } = this.editorState.value.gridSize
    this.editorState.value.grid = this.createEmptyGrid(width, height)
    this.editorState.value.hasUnsavedChanges = true
  }

  // Import/Export
  exportMaze(mazeId: string): string | null {
    const maze = this.customMazes.value.find(m => m.id === mazeId)
    if (!maze) return null

    return JSON.stringify(maze, null, 2)
  }

  importMaze(json: string): CustomMaze | null {
    try {
      const maze = JSON.parse(json) as CustomMaze

      if (!this.validateMaze(maze.grid)) {
        throw new Error('Invalid maze data')
      }

      maze.id = this.generateMazeId()
      maze.createdAt = Date.now()
      maze.updatedAt = Date.now()
      maze.plays = 0

      this.customMazes.value.push(maze)
      this.saveCustomMazes()

      return maze
    } catch (e) {
      console.error('Failed to import maze:', e)
      return null
    }
  }

  // Getters
  getCustomMazes() {
    return computed(() => this.customMazes.value)
  }

  getCurrentMaze() {
    return computed(() => this.currentMaze.value)
  }

  getEditorState() {
    return computed(() => this.editorState.value)
  }

  getGrid() {
    return computed(() => this.editorState.value.grid)
  }

  getSelectedTool() {
    return computed(() => this.editorState.value.selectedTool)
  }

  setSelectedTool(tool: EditorTool) {
    this.editorState.value.selectedTool = tool
  }

  hasUnsavedChanges() {
    return computed(() => this.editorState.value.hasUnsavedChanges)
  }

  // Helpers
  private createEmptyGrid(width: number, height: number): MazeGrid {
    const grid: MazeGrid = []
    for (let y = 0; y < height; y++) {
      const row: MazeCell[] = []
      for (let x = 0; x < width; x++) {
        row.push({
          x,
          y,
          walls: { top: false, right: false, bottom: false, left: false },
          visited: false,
          isStart: false,
          isEnd: false
        })
      }
      grid.push(row)
    }
    return grid
  }

  private cloneGrid(grid: MazeGrid): MazeGrid {
    return grid.map(row =>
      row.map(cell => ({ ...cell, walls: { ...cell.walls } }))
    )
  }

  private validateMaze(grid: MazeGrid): boolean {
    let hasStart = false
    let hasEnd = false

    for (const row of grid) {
      for (const cell of row) {
        if (cell.isStart) hasStart = true
        if (cell.isEnd) hasEnd = true
      }
    }

    return hasStart && hasEnd
  }

  private generateMazeId(): string {
    return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private saveCustomMazes(): void {
    try {
      localStorage.setItem('maze_net_custom', JSON.stringify(this.customMazes.value))
    } catch (e) {
      console.error('Failed to save custom mazes:', e)
    }
  }

  private loadCustomMazes(): void {
    try {
      const saved = localStorage.getItem('maze_net_custom')
      if (saved) {
        this.customMazes.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load custom mazes:', e)
    }
  }

  incrementPlays(mazeId: string): void {
    const maze = this.customMazes.value.find(m => m.id === mazeId)
    if (maze) {
      maze.plays++
      this.saveCustomMazes()
    }
  }
}

let mazeEditorInstance: MazeEditor | null = null

export function useMazeEditor() {
  if (!mazeEditorInstance) {
    mazeEditorInstance = new MazeEditor()
  }

  return {
    customMazes: mazeEditorInstance.getCustomMazes(),
    currentMaze: mazeEditorInstance.getCurrentMaze(),
    editorState: mazeEditorInstance.getEditorState(),
    grid: mazeEditorInstance.getGrid(),
    selectedTool: mazeEditorInstance.getSelectedTool(),
    hasUnsavedChanges: mazeEditorInstance.hasUnsavedChanges(),

    createNewMaze: mazeEditorInstance.createNewMaze.bind(mazeEditorInstance),
    loadMaze: mazeEditorInstance.loadMaze.bind(mazeEditorInstance),
    saveMaze: mazeEditorInstance.saveMaze.bind(mazeEditorInstance),
    deleteMaze: mazeEditorInstance.deleteMaze.bind(mazeEditorInstance),
    publishMaze: mazeEditorInstance.publishMaze.bind(mazeEditorInstance),

    applyTool: mazeEditorInstance.applyTool.bind(mazeEditorInstance),
    toggleWall: mazeEditorInstance.toggleWall.bind(mazeEditorInstance),
    resizeGrid: mazeEditorInstance.resizeGrid.bind(mazeEditorInstance),
    clearGrid: mazeEditorInstance.clearGrid.bind(mazeEditorInstance),
    setSelectedTool: mazeEditorInstance.setSelectedTool.bind(mazeEditorInstance),

    exportMaze: mazeEditorInstance.exportMaze.bind(mazeEditorInstance),
    importMaze: mazeEditorInstance.importMaze.bind(mazeEditorInstance),
    incrementPlays: mazeEditorInstance.incrementPlays.bind(mazeEditorInstance)
  }
}
