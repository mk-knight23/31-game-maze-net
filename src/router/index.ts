import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Stats from '../views/Stats.vue'
import Achievements from '../views/Achievements.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/stats', component: Stats },
    { path: '/achievements', component: Achievements }
  ]
})

export default router
