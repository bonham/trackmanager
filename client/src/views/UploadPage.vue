<template>
  <div>
    <b-row>
      <b-form-file
        v-model="files"
        multiple
        :state="Boolean(files)"
        placeholder="Choose a file or drop it here..."
        drop-placeholder="Drop file here..."
      />
    </b-row>
    <b-row>
      <b-card
        v-for="item in uploadList"
        :key="item.key"
      >
        <b-col>{{ item.fname }} </b-col>
        <b-col>{{ item.status }} </b-col>
      </b-card>
    </b-row>
  </div>
</template>

<script>
import { BFormFile, BCard } from 'bootstrap-vue'
import queue from 'async/queue'

const FORMPARAM = 'newtrack'
const WORKERS = 4
// const UP_URL = '/api/tracks/addtrack'
// const UP_URL = 'https://httpbin.org/status/500'
const UP_URL = 'https://httpbin.org/delay/3'

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
const workerQueue = queue(function (task, callback) {
  const fileIdObj = task.fileIdObject
  const thisKey = fileIdObj.key
  console.log(`Queue function called for id ${thisKey}`)

  fileIdObj.status = 'Processing'

  // do the work in async way
  uploadFile(fileIdObj, UP_URL, FORMPARAM)
    .then(json => {
      console.log(`Finished uploading key ${fileIdObj.key}, Message: ${json.message}`)
      fileIdObj.status = 'Completed'
      callback()
    })
    .catch(err => {
      fileIdObj.error = err
      fileIdObj.status = 'Failede'
      callback(err)
    })
}, WORKERS)

/* vue instance */
export default {
  name: 'UploadPage',
  components: {
    BFormFile,
    BCard
  },
  data () {
    return {
      files: null,
      uploadList: [],
      itemIdx: {},
      maxKey: 0
    }
  },
  watch: {
    files: function (newVal, oldVal) {
      // avoid firing if files variable is reset to null
      if (newVal && (newVal.length > 0)) {
        this.processDragDrop()
        // reset early to allow re-drop same file ( although rarely used )
        this.files = []
      }
    }
  },
  methods: {

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

    addItemToQueue (task) {
      this.uploadList.push(task.fileIdObject)

      workerQueue.push(task, function (err) {
        // callback on completion
        if (err) console.log(err)
        console.log(`Finished processing ${task.fileIdObject.key}`)
      })
    },

    // Queue new files. Triggered by watch
    processDragDrop () {
      // take files from input
      this.files.forEach(thisFile => {
        const fileIdObject = this.makeFileIdObject(thisFile)

        // create task for async queue
        const task = {
          fileIdObject
        }

        console.log('A')
        console.log(this.uploadList)

        this.addItemToQueue(task)

        console.log('B')
        console.log(this.uploadList)
      })
    },

    setStatusForKey (key, newStatus) {
      const idx = this.itemIdx[key]
      this.statusQueue[idx].status = newStatus
    },

    getNextKey () {
      return (this.maxKey += 1)
    }

  }
}
</script>
