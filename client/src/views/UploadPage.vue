<template>
  <b-container
    id="root"
    class="d-flex flex-column vh-100"
  >
    <track-manager-nav-bar :sid="sid" />
    <h1 class="mt-4 mb-4">
      Upload new Tracks
    </h1>

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
    <transition-group
      name="list"
      tag="span"
    >
      <b-row
        v-for="item in visibleUploadItems"
        :key="item.key"
        class="list-item"
      >
        <b-col>
          <UploadItem
            :fname="item.fname"
            :status="item.status"
            :error="item.error"
          />
        </b-col>
      </b-row>
    </transition-group>
  </b-container>
</template>

<script>
import { BFormFile } from 'bootstrap-vue-next'
import queue from 'async/queue'
import UploadItem from '@/components/UploadItem.vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'

const FORMPARAM = 'newtrack'
const WORKERS = 4
const UP_BASE_URL = '/api/tracks/addtrack'
// const UP_BASE_URL = 'https://httpbin.org/status/500'
// const UP_BASE_URL = 'https://httpbin.org/delay/3'

async function uploadFile (fileIdObject, uploadUrl, formParameter) {
  // construct body

  const formData = new FormData()
  formData.set(formParameter, fileIdObject.fileBlob)

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errDetail = await response.text()
    throw new Error('HTTP error, status = ' + response.status, { cause: errDetail })
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
  const url = `${UP_BASE_URL}/sid/${fileIdObject.sid}`
  uploadFile(fileIdObject, url, FORMPARAM)
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
    UploadItem,
    TrackManagerNavBar
  },

  props: {
    sid: {
      type: String,
      default: ''
    }
  },

  data () {
    return {
      files: [],
      uploadList: [],
      // uploadList: [{ key: -1, fname: 'One', status: 'Queued' }, { key: -2, fname: 'One', status: 'Queued' }, { key: -3, fname: 'One', status: 'Queued' }],
      maxKey: 0
    }
  },
  computed: {
    visibleUploadItems: function () {
      return this.uploadList.filter(item => item.visible)
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
        fileIdObject.sid = this.sid
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
        details: null,
        status: 'Queued',
        sid: null,
        visible: true
      }
    },

    addItemToQueue (fileIdObject) {
      this.uploadList.push(fileIdObject)

      workerQueue.push(fileIdObject, function (err) {
        // callback on completion
        if (err) console.log(err)
        console.log(`Finished processing ${fileIdObject.key}`)
        setTimeout(() => {
          fileIdObject.visible = false
          console.log(`Removed ${fileIdObject}`)
        },
        1000)
      })
    },

    getNextKey () {
      return (this.maxKey += 1)
    }

  }
}
</script>
<style scoped>
/* .list-item {
  display: inline-block;
  margin-right: 10px;
} */
.list-leave-active {
  transition: all 1s;
}
.list-enter, .list-leave-to /* .list-leave-active below version 2.1.8 */ {
  opacity: 0;
}
/* .list-move {
  transition: transform 1s;
} */
</style>
