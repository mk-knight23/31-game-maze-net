<template>
  <div class="achievements p-6">
    <h2 class="text-2xl font-bold mb-6">Achievements</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="ach in achievements" :key="ach.id" 
           class="p-6 rounded-lg"
           :class="ach.unlocked ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900 opacity-50'">
        <div class="flex items-center gap-4 mb-2">
          <div :class="ach.unlocked ? 'text-yellow-500' : 'text-gray-400'" class="text-2xl">🏆</div>
          <div>
            <h3 class="font-bold">{{ ach.name }}</h3>
            <p class="text-sm opacity-70">{{ ach.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const achievements = [
  { id: 'first', name: 'First Steps', desc: 'Play your first game', unlocked: true },
  { id: 'score-100', name: 'Century', desc: 'Score 100 points', unlocked: false },
  { id: 'score-500', name: 'Champion', desc: 'Score 500 points', unlocked: false }
]
</script>
