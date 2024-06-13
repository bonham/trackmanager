<template>
  <track-manager-nav-bar :sid="sid">
    <div class="px-2">
      <div>
        <div>
          <span v-if="loading">Loading <b-spinner small />
          </span>
        </div>
        <div>

        </div>
        <div v-for="t in loadedTracks" :key="t.id">
          {{ t.getNameOrSrc() }}
        </div>
      </div>
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">

import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import { Track } from '@/lib/Track'
import { getAllTracks } from '@/lib/trackServices'
import { BSpinner } from 'bootstrap-vue-next'
import { ref } from 'vue'
import type { Ref } from 'vue'

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

const loadedTracks: Ref<Track[]> = ref([])
const loading = ref(true)

async function runOnCreate() {
  loadedTracks.value = await getAllTracks(props.sid)
  loading.value = false
}

runOnCreate().catch((error) => console.log(error))

</script>
