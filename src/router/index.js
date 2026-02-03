import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Rules from '../views/Rules.vue'
import CategoryManagement from '../views/CategoryManagement.vue'
import FartTracker from '../views/FartTracker.vue'

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
  },
  {
    path: '/categories',
    name: 'CategoryManagement',
    component: CategoryManagement
  },
  {
    path: '/fart-tracker',
    name: 'FartTracker',
    component: FartTracker
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
