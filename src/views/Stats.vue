<template>
  <div class="stats p-6">
    <h2 class="text-2xl font-bold mb-6">Statistics</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p class="text-sm opacity-70">Games Played</p>
        <p class="text-3xl font-bold">{{ gameStore.gamesPlayed }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p class="text-sm opacity-70">High Score</p>
        <p class="text-3xl font-bold">{{ gameStore.highScore }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p class="text-sm opacity-70">Average Score</p>
        <p class="text-3xl font-bold">{{ averageScore }}</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
const gameStore = useGameStore()
const averageScore = computed(() => {
  const scores = gameStore.scores
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
})
</script>
