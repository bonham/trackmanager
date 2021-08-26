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
    <div>
      Upload Queue:
      <ul>
        <li
          v-for="item in uploadQueue"
          :key="item.key"
        >
          {{ item.fname }}
        </li>
      </ul>
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
      files: null,
      uploadQueue: []
    }
  },
  watch: {
    files: function (newVal, oldVal) {
      // avoid firing if files variable is reset to null
      if (newVal && (newVal.length > 0)) {
        this.processDrop()
        // reset early to allow re-drop same file ( although rarely used )
        this.files = []
      }
    }
  },
  methods: {
    processDrop () {
      const url = '/api/tracks/addtrack'
      let key = 0
      this.files.forEach(thisFile => {
        // const delay = key + 1
        // const url = `https://httpbin.org/delay/${delay}`
        const fName = thisFile.name
        key += 1
        const queueItem = {
          key: key,
          fname: fName
        }
        this.uploadQueue.push(queueItem)

        uploadFile(thisFile, url, 'newtrack')
          .then(json => {
            console.log(`Fname: ${fName}, Message: ${json.message}`)

            // delete from queue
            this.uploadQueue = this.uploadQueue.filter(ele => ele.fname !== fName)
          })
      }
      )
    }
  }
}
</script>
