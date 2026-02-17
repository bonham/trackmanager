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
      path: '/progress/sid/:sid',
      name: 'ProgressChart',
      component: () => import('./views/ProgressChart.vue'),
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
      props: (route) => ({
        sid: route.params.sid,
        id: Number(route.params.id)
      })
    }
  ]
})

router.beforeEach(() => {
  const titleEl = document.querySelector('head title');
  if (titleEl !== null) {
    titleEl.textContent = "Trackmanager"
  }
})

export default router
