<template>
  <div>
    <b-form-file
      v-model="file1"
      :state="Boolean(file1)"
      placeholder="Choose a file or drop it here..."
      drop-placeholder="Drop file here..."
    />
    <div class="mt-3">
      Selected file: {{ file1 ? file1.name : '' }}
    </div>
  </div>
</template>

<script>
import { BFormFile } from 'bootstrap-vue'
export default {
  name: 'UploadPage',
  components: {
    BFormFile
  },
  data () {
    return {
      file1: null
    }
  }
}
</script>
