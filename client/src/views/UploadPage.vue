<template>
  <div>
    <b-form-file
      v-model="files"
      multiple
      :state="Boolean(files)"
      placeholder="Choose a file or drop it here..."
      drop-placeholder="Drop file here..."
    />
    <div class="mt-3">
      Selected no of files: {{ files ? files.length : '' }}
    </div>
  </div>
</template>

<script>
import { BFormFile } from 'bootstrap-vue'

async function uploadFile (fileBlob, url, formParameter) {
  // construct body

  const formData = new FormData()
  formData.set(formParameter, fileBlob)

  const response = await fetch(url, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error('HTTP error, status = ' + response.status)
  }

  return response.json()
}

export default {
  name: 'UploadPage',
  components: {
    BFormFile
  },
  data () {
    return {
      files: null
    }
  },
  watch: {
    files: function (newVal, oldVal) {
      // avoid firing if 'Reset button clicked'
      if (newVal) {
        console.log(newVal)

        const url = '/api/tracks/addtrack'
        this.files.forEach(thisFile =>
          uploadFile(thisFile, url, 'newtrack')
            .then(json => console.log(`Text: ${json.message}`))
        )
      }
    }
  }
}
</script>
