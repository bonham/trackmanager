import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'NoSidPage',
      component: () => import('./views/NoSidPage.vue')
    },
    {
      path: '/trackmap/sid/:sid',
      alias: '/:sid',
      name: 'TrackMapPage',
      component: () => import('./views/TrackMapPage.vue'),
      props: true
    },
    {
      path: '/toverview/sid/:sid',
      name: 'TrackOverviewPage',
      component: () => import('./views/TrackOverviewPage.vue'),
      props: true
    },
    {
      path: '/upload/sid/:sid',
      name: 'UploadPage',
      component: () => import('./views/UploadPage.vue'),
      props: true
    },
    {
      path: '/track_multi_edit/sid/:sid',
      name: 'TrackMultiEditPage',
      component: () => import('./views/TrackMultiEditPage.vue'),
      props: true
    },
    {
      path: '/track/:id/sid/:sid',
      name: 'TrackDetailPage',
      component: () => import('./views/TrackDetailPage.vue'),
      props: true
    },
    {
      path: '/login/sid/:sid',
      name: 'LoginPage',
      component: () => import('./views/LoginPage.vue'),
      props: true
    }
  ]
})

export default router
