# 31-game-maze-net

<p align="center">
  <img src="https://img.shields.io/badge/Version-3.0.0-00F3FF?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Style-Neural_Cyber-FF00E5?style=for-the-badge" alt="Style">
  <img src="https://img.shields.io/badge/Stack-Vue_TresJS-4FC08D?style=for-the-badge&logo=vue.js" alt="Stack">
</p>

## 🌐 The Synaptic Escape

**MAZE_NET** is a high-fidelity, hardware-accelerated 3D labyrinth engine that simulates neural pathway navigation. Trapped within a shifting quantum grid, you must locate the exit node before the connection destabilizes.

### ⚡ Neural Protocol (v3.0)
- **Neural Void Design**: Re-engineered obsidian-base design system with electric cyan pulse highlights.
- **Quantum HUD**: Tactical overlay for real-time telemetry and efficiency tracking.
- **Dual-Mode Sync**: Seamlessly toggle between Cognitive Overview (3P) and Direct Neural Interface (1P).
- **Emissive Pathing**: Hardware-accelerated memory trails that visualize your navigation history.

## Tech Stack
- **Core**: Vue 3.5 (Script Setup)
- **Engine**: TresJS + Three.js
- **Intelligence**: Pinia (Neural State)
- **Styling**: Tailwind CSS v4 (Obsidian Matrix)
- **Icons**: Lucide Vue

## Setup & Build Instructions

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## Deployment
Deployed to GitHub Pages via automated CI/CD workflows. Optimized for 60fps stable performance on high-DPI displays.

---

**License:** MIT
**Architect:** mk-knight23

---

<p align="center">
  <a href="https://31-game-maze-net.vercel.app">🚀 Play Now (Vercel)</a>
</p>

## 🎮 Live Demos

| Platform | URL |
|----------|-----|
| **Vercel** | [31-game-maze-net.vercel.app](https://31-game-maze-net.vercel.app) |
| **Render** | [three1-game-maze-net.onrender.com](https://three1-game-maze-net.onrender.com) |
- Vercel: [Deploy your own](https://vercel.com/new)
- Netlify: [Deploy your own](https://app.netlify.com/start)

---

## 📝 Design Notes (V2)

### Intentional Quirk: The Star Rating System
I added a 3-star efficiency rating based on move count vs. optimal path. The formula is arbitrary—optimal is roughly mazeSize × 2 moves. Real optimal pathfinding would require solving the maze computationally, which is overkill. The stars are "fair enough" estimates. Humans respond to gamification, even when the math is fuzzy.

### Tradeoff: No Undo Button
You can backtrack, but there's no "undo last move" button. If you trap yourself in a dead end, you walk out manually. The tradeoff: realism vs. convenience. An undo button would make the maze trivial—just try every path and rewind. Walking back reinforces the "being lost" feeling. It's annoying on purpose.

### What I Chose NOT to Build
No procedural difficulty that adapts to your skill. The maze sizes are fixed (11/15/21). Adaptive difficulty would track your win rate and adjust maze complexity. I didn't build that because predictable difficulty is honest. Sometimes you want an easy maze. Sometimes you want punishment. The player chooses, not the algorithm.

## 🎉 Additional Features (V3)

Two focused additions to aid navigation:

### Directional Hint System
**Why added**: In larger mazes (21x21), it's easy to lose track of which direction leads toward the exit.

**What changed**: Added a subtle arrow indicator at the top of the screen pointing generally toward the exit. It updates every few seconds, not in real-time—you still need to navigate the maze yourself. The hint is intentionally vague; it won't show you the path, just the general direction.

### Completion Rate Tracking
**Why added**: The game tracks best times, but not how many mazes you've actually completed.

**What changed**: Added a completion counter showing total mazes finished per difficulty level. Seeing "Easy: 47 completed" gives a sense of accumulated progress, even if your best time hasn't improved lately.

### Intentionally Rejected: Full Minimap
I considered adding an overhead minimap showing the entire maze layout. Rejected because it trivializes the exploration. Half the challenge is building a mental map of where you've been. A minimap would turn the game into "follow the dots" instead of genuine navigation. Getting lost is the point.
