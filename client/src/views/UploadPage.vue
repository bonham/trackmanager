<template>
  <div>
    <b-row class="mt-3">
      <b-col>
        <b-form-file
          v-model="files"
          multiple
          :state="files.length > 0"
          placeholder="Choose some files or drop them here..."
          drop-placeholder="Drop files here..."
          size="lg"
          @input="onChange"
        />
      </b-col>
    </b-row>
    <b-row
      v-for="item in uploadList"
      :key="item.key"
    >
      <b-col>
        <UploadItem
          :fname="item.fname"
          :status="item.status"
        />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { BFormFile } from 'bootstrap-vue'
import queue from 'async/queue'
import UploadItem from '@/components/UploadItem.vue'

const FORMPARAM = 'newtrack'
const WORKERS = 4
const UP_URL = '/api/tracks/addtrack'
// const UP_URL = 'https://httpbin.org/status/500'
// const UP_URL = 'https://httpbin.org/delay/3'

async function uploadFile (fileIdObject, uploadUrl, formParameter) {
  // construct body

  const formData = new FormData()
  formData.set(formParameter, fileIdObject.fileBlob)

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error('HTTP error, status = ' + response.status)
  }

  return response.json()
}

// queue from async package
// eslint-disable-next-line no-unused-vars
const workerQueue = queue(function (fileIdObject, callback) {
  const thisKey = fileIdObject.key
  console.log(`Queue function called for id ${thisKey}`)

  fileIdObject.status = 'Processing'

  // do the work in async way
  uploadFile(fileIdObject, UP_URL, FORMPARAM)
    .then(json => {
      console.log(`Finished uploading key ${fileIdObject.key}, Message: ${json.message}`)
      fileIdObject.status = 'Completed'
      callback()
    })
    .catch(err => {
      fileIdObject.error = err
      fileIdObject.status = 'Failed'
      callback(err)
    })
}, WORKERS)

/* vue instance */
export default {
  name: 'UploadPage',
  components: {
    BFormFile,
    UploadItem
  },

  data () {
    return {
      files: [],
      uploadList: [],
      // uploadList: [{ key: -1, fname: 'One', status: 'Queued' }, { key: -2, fname: 'One', status: 'Queued' }, { key: -3, fname: 'One', status: 'Queued' }],
      maxKey: 0
    }
  },
  // watch: {
  //   files: function (newVal, oldVal) {
  //     // avoid firing if files variable is reset to null
  //     if (newVal && (newVal.length > 0)) {
  //       this.processDragDrop()
  //       // reset early to allow re-drop same file ( although rarely used )
  //       this.files = []
  //     }
  //   }
  // },

  methods: {
    onChange (event) {
      this.processDragDrop()
    },

    // Queue new files
    processDragDrop () {
      // take files from input
      this.files.forEach(thisFile => {
        const fileIdObject = this.makeFileIdObject(thisFile)
        this.addItemToQueue(fileIdObject)
      })
    },

    makeFileIdObject (file) {
      const thisKey = this.getNextKey()
      const fName = file.name
      return {
        key: thisKey,
        fname: fName,
        fileBlob: file,
        error: null,
        status: 'Queued'
      }
    },

    addItemToQueue (fileIdObject) {
      this.uploadList.push(fileIdObject)

      workerQueue.push(fileIdObject, function (err) {
        // callback on completion
        if (err) console.log(err)
        console.log(`Finished processing ${fileIdObject.key}`)
      })
    },

    getNextKey () {
      return (this.maxKey += 1)
    }

  }
}
</script>
