import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'NoSidPage',
      component: () => import('../views/NoSidPage.vue')
    },
    {
      path: '/select_tracks/sid/:sid',
      alias: '/:sid',
      name: 'SelectTracksPage',
      component: () => import('../views/SelectTracksPage.vue'),
      props: true
    },
    {
      path: '/tracklist/sid/:sid',
      alias: '/:sid',
      name: 'TracklistPage',
      component: () => import('../views/TracklistPage.vue'),
      props: true
    },
    {
      path: '/toverview/sid/:sid',
      name: 'TrackOverviewPage',
      component: () => import('../views/TrackOverviewPage.vue'),
      props: true
    },
    {
      path: '/upload/sid/:sid',
      name: 'UploadPage',
      component: () => import('../views/UploadPage.vue'),
      props: true
    },
    {
      path: '/track_multi_edit/sid/:sid',
      name: 'TrackMultiEditPage',
      component: () => import('../views/TrackMultiEditPage.vue'),
      props: true
    }
  ]
})

export default router
