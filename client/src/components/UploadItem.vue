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


<script setup lang="ts">
import { BCard, BCol, BRow } from 'bootstrap-vue-next'
import type { PropType } from 'vue'
import { UploadError } from '@/lib/uploadFile'
import type { QueueStatus } from '@/lib/uploadFile'
import { computed } from 'vue'

const props = defineProps({
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
    required: false
  }
})

const statusClass = computed(() => {
  const prefix = 'badge p-3 flex-fill'
  const lookup: { [K in QueueStatus]: string } = {
    Queued: 'bg-secondary text-light',
    Processing: 'bg-warning',
    Completed: 'bg-success text-light',
    Failed: 'bg-danger text-light'
  }
  return prefix + ' ' + lookup[props.status]
})
</script>
