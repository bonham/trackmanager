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
    <div class="mt-3">
      Key: {{ key }}
    </div>
    <div class="mt-3">
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
    <div class="mt-3">
      Failed Files:
      <ul>
        <li
          v-for="item in failedUploads"
          :key="item.key"
        >
          {{ item.key }}: {{ item.fname }}, {{ item.error }}
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
      uploadQueue: [],
      failedUploads: [],
      key: 0
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
      this.files.forEach(thisFile => {
        const thisKey = this.getNextKey()
        // const delay = thisKey % 10
        // const url = `https://httpbin.org/delay/${delay}`
        // const url = 'https://httpbin.org/status/502'
        const fName = thisFile.name
        const queueItem = {
          key: thisKey,
          fname: fName
        }
        this.uploadQueue.push(queueItem)

        uploadFile(thisFile, url, 'newtrack')
          .then(json => {
            console.log(`Finished Fname: ${fName}, Key ${thisKey}, Message: ${json.message}`)
            this.removeKeyFromUploadQueue(thisKey)
          })
          .catch(err => {
            queueItem.error = err
            this.failedUploads.push(queueItem)
            this.removeKeyFromUploadQueue(thisKey)
          })
      }
      )
    },
    getNextKey () {
      return (this.key += 1)
    },
    removeKeyFromUploadQueue (keyToRemove) {
      this.uploadQueue = this.uploadQueue.filter(ele => ele.key !== keyToRemove)
    }
  }
}
</script>
