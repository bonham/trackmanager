<template>
  <div>
    <b-card
      no-body
      class="m-1"
      bg-variant="light"
    >
      <b-row class="align-items-center">
        <b-col cols="10">
          <span class="ml-2">{{ fname }}</span>
          <span
            v-if="error"
            v-b-tooltip.hover
            class="text-danger"
            :title="error.cause"
          > {{ error.message }}</span>
        </b-col>
        <b-col
          cols="2"
          class="d-flex"
        >
          <span :class="statusClass">
            {{ status }}
            <span
              v-if="status == 'Processing'"
              class="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            />
          </span>
        </b-col>
      </b-row>
    </b-card>
  </div>
</template>

<script>
import { BCard } from 'bootstrap-vue-next'

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
    },
    error: {
      type: Error,
      default: null
    }
  },

  computed: {
    statusClass () {
      const prefix = 'badge p-3 flex-fill'
      const lookup = {
        Queued: 'bg-secondary text-light',
        Processing: 'bg-warning',
        Completed: 'bg-success text-light',
        Failed: 'bg-danger text-light'
      }
      return prefix + ' ' + lookup[this.status]
    }
  }

}
</script>
