# Astray - Quantum Maze Engine

A professional WebGL 3D maze survival game built with **Vue 3**, **TresJS**, and **Tailwind CSS**. A cinematic reconstruction of the classic labyrinth puzzle, optimized for hardware-accelerated performance and immersive navigation.

## Overview
This project replaces the legacy React/Three.js prototype with a modern Vue 3 architecture. It leverages a recursive backtracking algorithm for procedural maze generation and declarative 3D scene management via TresJS.

## Features Comparison

| Feature | Legacy (React) | Upgraded (Vue 3 v2.0) |
| :--- | :--- | :--- |
| **Generator** | Basic iteration | **Recursive Backtracking (Procedural)** |
| **3D Rendering** | Standard Three.js | **TresJS (Vue-optimized WebGL)** |
| **Perspective** | Fixed | **Dynamic Perspective with Controls** |
| **Visuals** | Flat Shading | **Neon Emissive Shaders + Bloom** |
| **State** | React Context | **Pinia (Enterprise State Management)** |
| **Performance**| Moderate | **Hardware-accelerated rendering** |

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
