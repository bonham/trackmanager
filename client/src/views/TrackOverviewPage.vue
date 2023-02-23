<template>
  <b-container>
    <track-manager-nav-bar :sid="sid" />
    <h1 class="mt-4 mb-4">
      Track Overview
    </h1>
    <TrackOverview :sid="sid" />
  </b-container>
</template>

<script>
import { BContainer } from 'bootstrap-vue-next'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
export default {
  name: 'TrackOverviewPage',
  components: {
    TrackOverview: () => import('@/components/TrackOverview.vue'),
    TrackManagerNavBar,
    BContainer
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  }

}
</script>
