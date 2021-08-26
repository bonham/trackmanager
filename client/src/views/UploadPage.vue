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
      Waiting:
      <ul>
        <li
          v-for="item in statusQueue.waiting"
          :key="item.key"
        >
          {{ item.key }}: {{ item.fname }}
        </li>
      </ul>
    </div>
    <div class="mt-3">
      Progress:
      <ul>
        <li
          v-for="item in statusQueue.progress"
          :key="item.key"
        >
          {{ item.key }}: {{ item.fname }}
        </li>
      </ul>
    </div>
    <div class="mt-3">
      Complete:
      <ul>
        <li
          v-for="item in statusQueue.done"
          :key="item.key"
        >
          {{ item.key }}: {{ item.fname }}
        </li>
      </ul>
    </div>
    <div class="mt-3">
      Failed:
      <ul>
        <li
          v-for="item in statusQueue.failed"
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
import queue from 'async/queue'

const FORMPARAM = 'newtrack'
const WORKERS = 4
const UP_URL = '/api/tracks/addtrack'
// const UP_URL = 'https://httpbin.org/status/500'

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

const removeKeyFromQueue = function (statqueue, queueName, keyToRemove) {
  statqueue[queueName] = statqueue[queueName].filter(ele => ele.key !== keyToRemove)
}

// queue from async package
const workerQueue = queue(function (task, callback) {
  const fileIdObj = task.fileIdObject
  const statusQueue = task.statusQueue
  const thisKey = fileIdObj.key
  console.log(`Queue function called for id ${thisKey}`)

  statusQueue.progress.push(fileIdObj)
  removeKeyFromQueue(statusQueue, 'waiting', thisKey)

  // do the work in async way
  uploadFile(fileIdObj, UP_URL, FORMPARAM)
    .then(json => {
      console.log(`Finished uploading key ${fileIdObj.key}, Message: ${json.message}`)
      statusQueue.done.push(fileIdObj)
      removeKeyFromQueue(statusQueue, 'progress', thisKey)
      callback()
    })
    .catch(err => {
      fileIdObj.error = err
      statusQueue.failed.push(fileIdObj)
      removeKeyFromQueue(statusQueue, 'progress', thisKey)
      callback(err)
    })
}, WORKERS)

/* vue instance */
export default {
  name: 'UploadPage',
  components: {
    BFormFile
  },
  data () {
    return {
      files: null,
      statusQueue: {
        waiting: [],
        progress: [],
        done: [],
        failed: []
      },
      key: 0
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
        error: null
      }
    },

    // Queue new files. Triggered by watch
    processDragDrop () {
      // take files from input
      this.files.forEach(thisFile => {
        const fileIdObject = this.makeFileIdObject(thisFile)
        this.statusQueue.waiting.push(fileIdObject)

        const task = {
          fileIdObject,
          statusQueue: this.statusQueue
        }

        workerQueue.push(task, function (err) {
          // callback on completion
          if (err) console.log(err)
          console.log(`Finished processing ${task.fileIdObject.key}`)
        })
      })
    },
    getNextKey () {
      return (this.key += 1)
    }

  }
}
</script>
