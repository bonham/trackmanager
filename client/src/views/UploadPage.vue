<template>
  <div>
    <b-form
      v-if="show"
      @submit="onSubmit"
      @reset="onReset"
    >
      <b-form-file
        v-model="file1"
        :state="Boolean(file1)"
        placeholder="Choose a file or drop it here..."
        drop-placeholder="Drop file here..."
      />
      <div class="mt-3">
        Selected file: {{ file1 ? file1.name : '' }}
      </div>
      <b-button
        type="submit"
        variant="primary"
      >
        Submit
      </b-button>
      <b-button
        type="reset"
        variant="danger"
      >
        Reset
      </b-button>
    </b-form>
  </div>
</template>

<script>
import { BForm, BFormFile } from 'bootstrap-vue'
export default {
  name: 'UploadPage',
  components: {
    BForm,
    BFormFile
  },
  data () {
    return {
      file1: null,
      show: true
    }
  },
  methods: {
    onSubmit (event) {
      event.preventDefault()
      alert(`submit ${this.file1.name}`)
    },
    onReset (event) {
      event.preventDefault()
      this.file1 = null
    }
  }
}
</script>
