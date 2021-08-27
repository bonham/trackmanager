<template>
  <div>
    <b-card class="m-1">
      <b-row class="align-items-center">
        <b-col cols="10">
          <span>{{ fname }}</span>
        </b-col>
        <b-col
          cols="2"
          class="d-flex"
        >
          <span :class="statusClass">{{ status }}</span>
        </b-col>
      </b-row>
    </b-card>
  </div>
</template>

<script>
import { BCard } from 'bootstrap-vue'

/* vue instance */
export default {
  name: 'UploadItem',
  components: {
    BCard
  },
  props: {
    fname: {
      type: String,
      default: null
    },
    status: {
      type: String,
      default: 'Queued'
    }
  },

  computed: {
    statusClass () {
      const prefix = 'badge p-3 flex-fill'
      const lookup = {
        Queued: 'bg-secondary text-light',
        Processing: 'bg-warning',
        Completed: 'bg-success text-light',
        Failed: 'bg-danger'
      }
      return prefix + ' ' + lookup[this.status]
    }
  }

}
</script>
