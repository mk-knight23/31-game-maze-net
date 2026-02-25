/**
 * Procedural Maze Generation
 * Multiple algorithms for generating unique mazes
 */

export type MazeCell = {
  x: number
  y: number
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean }
  visited: boolean
  isStart: boolean
  isEnd: boolean
}

export type MazeGrid = MazeCell[][]

export type MazeAlgorithm = 'recursive_backtracker' | 'prim' | 'kruskal' | 'eller' | 'binary_tree'

export interface MazeConfig {
  width: number
  height: number
  algorithm: MazeAlgorithm
  seed?: number
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
}

export class ProceduralMazeGenerator {
  private config: MazeConfig
  private grid: MazeGrid = []
  private rng: () => number

  constructor(config: MazeConfig) {
    this.config = config
    this.rng = this.createRNG(config.seed)
  }

  private createRNG(seed?: number): () => number {
    if (seed !== undefined) {
      let s = seed
      return () => {
        s = Math.sin(s * 9999) * 10000
        return s - Math.floor(s)
      }
    }
    return Math.random
  }

  generate(): MazeGrid {
    this.initializeGrid()

    switch (this.config.algorithm) {
      case 'recursive_backtracker':
        this.generateRecursiveBacktracker()
        break
      case 'prim':
        this.generatePrim()
        break
      case 'kruskal':
        this.generateKruskal()
        break
      case 'eller':
        this.generateEller()
        break
      case 'binary_tree':
        this.generateBinaryTree()
        break
    }

    this.setStartAndEnd()
    return this.grid
  }

  private initializeGrid(): void {
    this.grid = []
    for (let y = 0; y < this.config.height; y++) {
      const row: MazeCell[] = []
      for (let x = 0; x < this.config.width; x++) {
        row.push({
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false,
          isStart: false,
          isEnd: false
        })
      }
      this.grid.push(row)
    }
  }

  private generateRecursiveBacktracker(): void {
    const stack: MazeCell[] = []
    const startCell = this.grid[0][0]
    startCell.visited = true
    stack.push(startCell)

    while (stack.length > 0) {
      const current = stack[stack.length - 1]
      const neighbors = this.getUnvisitedNeighbors(current)

      if (neighbors.length === 0) {
        stack.pop()
      } else {
        const next = neighbors[Math.floor(this.rng() * neighbors.length)]
        this.removeWall(current, next)
        next.visited = true
        stack.push(next)
      }
    }
  }

  private generatePrim(): void {
    const walls: { cell: MazeCell; direction: 'top' | 'right' | 'bottom' | 'left' }[] = []
    const startCell = this.grid[Math.floor(this.config.height / 2)][Math.floor(this.config.width / 2)]
    startCell.visited = true

    this.addWallsToList(startCell, walls)

    while (walls.length > 0) {
      const randomIndex = Math.floor(this.rng() * walls.length)
      const { cell, direction } = walls[randomIndex]
      walls.splice(randomIndex, 1)

      const neighbor = this.getNeighbor(cell, direction)
      if (neighbor && !neighbor.visited) {
        this.removeWall(cell, neighbor)
        neighbor.visited = true
        this.addWallsToList(neighbor, walls)
      }
    }
  }

  private generateKruskal(): void {
    const sets: Map<string, MazeCell[]> = new Map()
    const edges: { cell1: MazeCell; cell2: MazeCell; direction: string }[] = []

    // Initialize sets and edges
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const cell = this.grid[y][x]
        const key = `${x},${y}`
        sets.set(key, [cell])

        if (x < this.config.width - 1) {
          edges.push({ cell1: cell, cell2: this.grid[y][x + 1], direction: 'right' })
        }
        if (y < this.config.height - 1) {
          edges.push({ cell1: cell, cell2: this.grid[y + 1][x], direction: 'bottom' })
        }
      }
    }

    // Shuffle edges
    for (let i = edges.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1))
      ;[edges[i], edges[j]] = [edges[j], edges[i]]
    }

    // Process edges
    for (const edge of edges) {
      const key1 = `${edge.cell1.x},${edge.cell1.y}`
      const key2 = `${edge.cell2.x},${edge.cell2.y}`
      const set1 = sets.get(key1)!
      const set2 = sets.get(key2)!

      if (set1 !== set2) {
        this.removeWall(edge.cell1, edge.cell2)

        // Merge sets
        const merged = [...set1, ...set2]
        for (const cell of merged) {
          sets.set(`${cell.x},${cell.y}`, merged)
        }
      }
    }
  }

  private generateEller(): void {
    for (let y = 0; y < this.config.height; y++) {
      const sets: Map<number, MazeCell[]> = new Map()

      // Initialize sets for current row
      for (let x = 0; x < this.config.width; x++) {
        const cell = this.grid[y][x]
        let setNum = x

        // Assign to existing set from above if visited
        if (y > 0 && this.grid[y - 1][x].visited) {
          setNum = this.getSetNumberForCell(this.grid[y - 1][x], sets) ?? x
        }

        if (!sets.has(setNum)) {
          sets.set(setNum, [])
        }
        sets.get(setNum)!.push(cell)
        cell.visited = true
      }

      // Horizontal connections
      for (let x = 0; x < this.config.width - 1; x++) {
        const cell1 = this.grid[y][x]
        const cell2 = this.grid[y][x + 1]

        if (this.shouldConnect(cell1, cell2, sets)) {
          this.removeWall(cell1, cell2)
          this.mergeSets(cell1, cell2, sets)
        }
      }

      // Vertical connections (except for last row)
      if (y < this.config.height - 1) {
        for (const [setNum, cells] of sets) {
          const verticalConnections = Math.floor(this.rng() * cells.length) + 1
          const shuffled = [...cells].sort(() => this.rng() - 0.5)

          for (let i = 0; i < Math.min(verticalConnections, shuffled.length); i++) {
            const cell = shuffled[i]
            const below = this.grid[y + 1][cell.x]
            this.removeWall(cell, below)
            below.visited = true
          }
        }
      }
    }
  }

  private generateBinaryTree(): void {
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const cell = this.grid[y][x]
        const canGoNorth = y > 0
        const canGoEast = x < this.config.width - 1

        if (canGoNorth && canGoEast) {
          if (this.rng() < 0.5) {
            this.removeWall(cell, this.grid[y - 1][x])
          } else {
            this.removeWall(cell, this.grid[y][x + 1])
          }
        } else if (canGoNorth) {
          this.removeWall(cell, this.grid[y - 1][x])
        } else if (canGoEast) {
          this.removeWall(cell, this.grid[y][x + 1])
        }
      }
    }
  }

  private getUnvisitedNeighbors(cell: MazeCell): MazeCell[] {
    const neighbors: MazeCell[] = []
    const { x, y } = cell

    if (y > 0 && !this.grid[y - 1][x].visited) neighbors.push(this.grid[y - 1][x])
    if (x < this.config.width - 1 && !this.grid[y][x + 1].visited) neighbors.push(this.grid[y][x + 1])
    if (y < this.config.height - 1 && !this.grid[y + 1][x].visited) neighbors.push(this.grid[y + 1][x])
    if (x > 0 && !this.grid[y][x - 1].visited) neighbors.push(this.grid[y][x - 1])

    return neighbors
  }

  private getNeighbor(cell: MazeCell, direction: 'top' | 'right' | 'bottom' | 'left'): MazeCell | null {
    const { x, y } = cell

    switch (direction) {
      case 'top':
        return y > 0 ? this.grid[y - 1][x] : null
      case 'right':
        return x < this.config.width - 1 ? this.grid[y][x + 1] : null
      case 'bottom':
        return y < this.config.height - 1 ? this.grid[y + 1][x] : null
      case 'left':
        return x > 0 ? this.grid[y][x - 1] : null
    }
  }

  private removeWall(cell1: MazeCell, cell2: MazeCell): void {
    const dx = cell2.x - cell1.x
    const dy = cell2.y - cell1.y

    if (dx === 1) {
      cell1.walls.right = false
      cell2.walls.left = false
    } else if (dx === -1) {
      cell1.walls.left = false
      cell2.walls.right = false
    } else if (dy === 1) {
      cell1.walls.bottom = false
      cell2.walls.top = false
    } else if (dy === -1) {
      cell1.walls.top = false
      cell2.walls.bottom = false
    }
  }

  private addWallsToList(cell: MazeCell, walls: typeof this['walls']): void {
    const directions: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left']

    for (const direction of directions) {
      const neighbor = this.getNeighbor(cell, direction)
      if (neighbor && !neighbor.visited) {
        walls.push({ cell, direction })
      }
    }
  }

  private shouldConnect(cell1: MazeCell, cell2: MazeCell, sets: Map<number, MazeCell[]>): boolean {
    const set1 = this.findSet(cell1, sets)
    const set2 = this.findSet(cell2, sets)
    return set1 !== set2 && this.rng() < 0.5
  }

  private mergeSets(cell1: MazeCell, cell2: MazeCell, sets: Map<number, MazeCell[]>): void {
    const set1 = this.findSet(cell1, sets)
    const set2 = this.findSet(cell2, sets)
    if (set1 && set2 && set1 !== set2) {
      set1.push(...set2)
      sets.delete(Array.from(sets.keys()).find(key => sets.get(key) === set2)!)
    }
  }

  private findSet(cell: MazeCell, sets: Map<number, MazeCell[]>): MazeCell[] | null {
    for (const set of sets.values()) {
      if (set.includes(cell)) return set
    }
    return null
  }

  private getSetNumberForCell(cell: MazeCell, sets: Map<number, MazeCell[]>): number | null {
    for (const [num, set] of sets) {
      if (set.includes(cell)) return num
    }
    return null
  }

  private setStartAndEnd(): void {
    this.grid[0][0].isStart = true
    this.grid[this.config.height - 1][this.config.width - 1].isEnd = true
  }

  getDifficultySettings(): { width: number; height: number } {
    switch (this.config.difficulty) {
      case 'easy':
        return { width: 10, height: 10 }
      case 'medium':
        return { width: 20, height: 20 }
      case 'hard':
        return { width: 30, height: 30 }
      case 'extreme':
        return { width: 50, height: 50 }
      default:
        return { width: 15, height: 15 }
    }
  }

  getGrid(): MazeGrid {
    return this.grid
  }

  solve(): { x: number; y: number }[] {
    const start = this.grid[0][0]
    const end = this.grid[this.config.height - 1][this.config.width - 1]
    const visited = new Set<string>()
    const path: { x: number; y: number }[] = []

    const dfs = (cell: MazeCell): boolean => {
      if (cell.x === end.x && cell.y === end.y) {
        path.push({ x: cell.x, y: cell.y })
        return true
      }

      visited.add(`${cell.x},${cell.y}`)
      path.push({ x: cell.x, y: cell.y })

      const neighbors = this.getAccessibleNeighbors(cell)
      for (const neighbor of neighbors) {
        if (!visited.has(`${neighbor.x},${neighbor.y}`)) {
          if (dfs(neighbor)) return true
        }
      }

      path.pop()
      return false
    }

    dfs(start)
    return path
  }

  private getAccessibleNeighbors(cell: MazeCell): MazeCell[] {
    const neighbors: MazeCell[] = []

    if (!cell.walls.top && cell.y > 0) neighbors.push(this.grid[cell.y - 1][cell.x])
    if (!cell.walls.right && cell.x < this.config.width - 1) neighbors.push(this.grid[y][x + 1])
    if (!cell.walls.bottom && cell.y < this.config.height - 1) neighbors.push(this.grid[cell.y + 1][cell.x])
    if (!cell.walls.left && cell.x > 0) neighbors.push(this.grid[cell.y][cell.x - 1])

    return neighbors
  }
}
