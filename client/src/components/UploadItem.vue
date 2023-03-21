<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <div>
    <b-card no-body class="m-1" bg-variant="light">
      <b-row class="align-items-center">
        <b-col cols="10">
          <span class="ms-2">{{ fname }}</span>
          <span v-if="error" class="ms-2 text-danger" :title="error.cause"> {{ error.message }}</span>
        </b-col>
        <b-col cols="2" class="d-flex">
          <span :class="statusClass">
            {{ status }}
            <span v-if="status == 'Processing'" class="spinner-border spinner-border-sm" role="status"
              aria-hidden="true" />
          </span>
        </b-col>
      </b-row>
    </b-card>
  </div>
</template>


<script lang="ts">
import { BCard, BCol, BRow } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { UploadError } from '@/lib/uploadFile'
import type { QueueStatus } from '@/lib/uploadFile'

/* vue instance */
export default defineComponent({
  name: 'UploadItem',
  components: {
    BCard,
    BCol,
    BRow
  },
  props: {
    fname: {
      type: String,
      default: null
    },
    status: {
      type: String as PropType<QueueStatus>,
      default: () => "Queued" as QueueStatus
    },
    error: {
      type: UploadError as PropType<UploadError | null>,
      default: null,
      required: true
    }
  },

  computed: {
    statusClass() {
      const prefix = 'badge p-3 flex-fill'
      let lookup: { [K in QueueStatus]: string }
      lookup = {
        Queued: 'bg-secondary text-light',
        Processing: 'bg-warning',
        Completed: 'bg-success text-light',
        Failed: 'bg-danger text-light'
      }
      return prefix + ' ' + lookup[this.status]
    }
  }

})
</script>
