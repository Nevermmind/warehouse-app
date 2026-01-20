import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Rules from '../views/Rules.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/rules',
    name: 'Rules',
    component: Rules
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
