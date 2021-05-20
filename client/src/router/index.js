import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import TestPage1 from '../views/TestPage1.vue'
import TrackDetail from '../views/TrackDetail.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/testpage1',
    name: 'TestPage1',
    component: TestPage1
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/track/:id',
    name: 'TrackDetail',
    component: TrackDetail
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
