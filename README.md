# Astray - Quantum Maze Engine

A professional WebGL 3D maze survival game built with **Vue 3**, **TresJS**, and **Tailwind CSS**. A cinematic reconstruction of the classic labyrinth puzzle, optimized for hardware-accelerated performance and immersive navigation.

## Overview
This project replaces the legacy React/Three.js prototype with a modern Vue 3 architecture. It leverages a recursive backtracking algorithm for procedural maze generation and declarative 3D scene management via TresJS.

## Features Comparison

| Feature | Legacy (React) | Upgraded (Vue 3 v2.0) |
| :--- | :--- | :--- |
| **Generator** | Basic iteration | **Recursive Backtracking (Procedural)** |
| **3D Rendering** | Standard Three.js | **TresJS (Vue-optimized WebGL)** |
| **Perspective** | Fixed | **First-Person + Third-Person Toggle** |
| **Visuals** | Flat Shading | **Neon Emissive Shaders + Path Trail** |
| **State** | React Context | **Pinia (Enterprise State Management)** |
| **Performance**| Moderate | **Hardware-accelerated rendering** |
| **FX** | None | **Victory Particles + Path Trail** |
| **Maze Sizes** | Fixed | **Quick Presets (11x, 15x, 21)** |

## New Features

- **Path Trail**: Glowing trail showing where you've been in the maze
- **Victory Particles**: Celebratory particle explosion on completing a level
- **Camera Toggle**: Switch between first-person and third-person views
- **Size Presets**: Quick-select maze difficulty (11x, 15x, or 21) from header

## Tech Stack
- **Framework:** Vue 3.5 (Script Setup)
- **3D Engine:** TresJS + Three.js
- **State:** Pinia
- **Styling:** Tailwind CSS (Quantum palette)
- **Icons:** Lucide Vue

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

## 📝 Design Notes (V2)

### Intentional Quirk: The Star Rating System
I added a 3-star efficiency rating based on move count vs. optimal path. The formula is arbitrary—optimal is roughly mazeSize × 2 moves. Real optimal pathfinding would require solving the maze computationally, which is overkill. The stars are "fair enough" estimates. Humans respond to gamification, even when the math is fuzzy.

### Tradeoff: No Undo Button
You can backtrack, but there's no "undo last move" button. If you trap yourself in a dead end, you walk out manually. The tradeoff: realism vs. convenience. An undo button would make the maze trivial—just try every path and rewind. Walking back reinforces the "being lost" feeling. It's annoying on purpose.

### What I Chose NOT to Build
No procedural difficulty that adapts to your skill. The maze sizes are fixed (11/15/21). Adaptive difficulty would track your win rate and adjust maze complexity. I didn't build that because predictable difficulty is honest. Sometimes you want an easy maze. Sometimes you want punishment. The player chooses, not the algorithm.