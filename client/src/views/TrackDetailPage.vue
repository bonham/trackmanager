<template>
  <track-manager-nav-bar :sid="sid">
    <div class="flex-grow-1 d-flex flex-column">
      <b-card class="m-2 bg-light" :class="cardclass" @pointerdown="checkLongPress" @pointerup="release">
        <div class="d-flex flex-row align-items-start">
          <div class="flex-grow-1">
            <h5>
              <editable-text
v-if="userLoginStore.loggedIn" :textarea="false" :text-prop="headline"
                :pencil-visible="true" :update-function="(value: string) => processHeadlineUpdate(value)" />
              <span v-else>
                {{ headline }}
              </span>
            </h5>
            <div>
              {{ trackDetails }}
            </div>
          </div>
          <button type="button" class="btn-close" aria-label="Close" @click="closeMe"></button>
        </div>
      </b-card>

      <MapComponent :sid="sid" />
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">
import {
  BCard,
} from 'bootstrap-vue-next'
import MapComponent from '@/components/MapComponent.vue';
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import EditableText from '@/components/EditableText.vue'
import { useTrackStore } from '@/stores/trackStore';
import { useMapStateStore } from '@/stores/mapstate'
import { nextTick, ref } from 'vue';
import { getTrackById } from '@/lib/trackServices';
import { useRouter } from 'vue-router'
import { updateTrackById } from '@/lib/trackServices'

import { useUserLoginStore } from '@/stores/userlogin'
const userLoginStore = useUserLoginStore()


const mapStateStore = useMapStateStore()
const trackStore = useTrackStore()

 
const props = defineProps({
  sid: {
    type: String,
    default: ''
  },
  id: {
    type: Number,
    required: true
  }
})

const headline = ref("")
const trackDetails = ref("")

const cardclass = ref("")



// load track metadata
getTrackById(props.id, props.sid)
  .then((track) => {

    if (track !== null) {

      // headline
      headline.value = track.getNameOrSrc()

      // details
      const part1 = `${track.localeDateShort()} / `;
      const part2 = `${(track.distance() / 1000).toFixed(1)} km / `;
      const part3: string = track.getAscent() ? `${Math.round(track.getAscent())} m / ` : "- / "
      const part4: string = track.getTimeLength() !== null ? `${track.timeLengthFormatted()} h / ` : "- / "
      const part5: string = track.speedKmh() !== null ? ` / ${Math.round(track.speedKmh()! * 10) / 10} km/h` : "-";
      trackDetails.value = part1 + part2 + part3 + part4 + part5

      // fill the cache
      trackStore.setLoadedTracks([track])

      // set title
      // const descEl = document.querySelector('head meta[name="description"]');
      const titleEl = document.querySelector('head title');
      if (titleEl !== null) {
        titleEl.textContent = headline.value
      }

    } else {
      trackDetails.value = "unknown"
    }
  })
  .catch((e) => {
    console.error(`Error while loading track ${props.id}`, e)
  })

nextTick(() => {
  // send command to MapComponent to load a single track
  mapStateStore.loadCommand = {
    command: 'track',
    payload: props.id,
    zoomOut: true
  }

}).catch((e) => { console.error(e) })

const router = useRouter()

const closeMe = () => {
  router.back()
}

let timeout: ReturnType<typeof setTimeout>

function checkLongPress(e: PointerEvent) {
  timeout = setTimeout(() => {
    console.log("selected long", e)
    cardclass.value = cardclass.value === "" ? "text-primary" : ""
  }, 1000)
}

function release() {
  if (timeout) clearTimeout(timeout)
}

async function processHeadlineUpdate(value: string): Promise<boolean> {
  console.log("Updating " + value)
  try {
    const success = await updateTrackById(props.id, { name: value }, props.sid) ?? false
    if (!success) console.error(`Updating track id ${props.id} was not successful`)
    return success
  } catch (e) {
    console.log(e)
    return false
  }
}

</script>
<style>
.editable-text-pencil {
  font-size: 1rem;
}
</style>
