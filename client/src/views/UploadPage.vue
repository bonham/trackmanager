<template>
  <b-container
    id="root"
    class="d-flex flex-column vh-100"
  >
    <track-manager-nav-bar :sid="sid" />
    <h1 class="mt-4 mb-4">
      Upload new Tracks
    </h1>

    <BRow class="mt-3">
      <BCol>
        <label for="input">Choose file</label>&nbsp;
        <input
          id="input"
          type="file"
          multiple
          @change="onChange"
        >
      </BCol>
    </BRow>
    <transition-group
      name="list"
      tag="span"
    >
      <BRow
        v-for="item in visibleUploadItems"
        :key="item.key"
        class="list-item"
      >
        <BCol>
          <UploadItem
            :fname="item.fname"
            :status="item.status"
            :error="item.error"
          />
        </BCol>
      </BRow>
    </transition-group>
  </b-container>
</template>

<script>
import { BContainer, BRow, BCol } from 'bootstrap-vue-next'
import UploadItem from '@/components/UploadItem.vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import { FileUploadQueue } from '@/lib/FileUploadQueue'

/* vue instance */
export default {
  name: 'UploadPage',
  components: {
    UploadItem,
    TrackManagerNavBar,
    BContainer,
    BRow,
    BCol
  },

  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      uploadList: [],
      // uploadList: [{ key: -1, fname: 'One', status: 'Queued' }, { key: -2, fname: 'One', status: 'Queued' }, { key: -3, fname: 'One', status: 'Queued' }],
      maxKey: 0
    }
  },
  computed: {
    visibleUploadItems: function () {
      const visibleList = this.uploadList.filter(item => item.visible)
      return visibleList
    }
  },

  created () {
    this.workerQueue = new FileUploadQueue()
  },

  methods: {

    getUploadItemByKey (key) {
      const item = this.uploadList.find(element => element.key === key)
      if (item === undefined) { throw new Error(`Could not find Upload item with id ${key}`) }
      return item
    },

    setItemProcessingStatus (key, status) {
      const item = this.getUploadItemByKey(key)
      item.status = status
    },

    setItemVisibility (key, visibility) {
      const item = this.getUploadItemByKey(key)
      item.visible = visibility
    },

    onChange (event) {
      const files = event.target.files
      this.processDragDrop(files)
    },

    getNextKey () {
      return (this.maxKey += 1)
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

    // Queue new files
    processDragDrop (files) {
      // take files from input
      for (const thisFile of files) {
        const fileIdObject = this.makeFileIdObject(thisFile)
        fileIdObject.sid = this.sid
        this.addItemToQueue(fileIdObject)
      }
    },

    addItemToQueue (fileIdObject) {
      this.uploadList.push(fileIdObject)
      this.workerQueue.push(
        {
          fileIdObject,
          setItemProcessingStatus: this.setItemProcessingStatus // callback to set status while processed in queue
        },
        this.completedCallBack
      )
    },

    completedCallBack (err, key) {
      console.log(`Finished processing ${key}`)

      if (err) {
        console.log('Error occured during queue processing: ', err.message)
        console.log('Error cause: ', err.cause)
        this.setItemProcessingStatus(key, 'Failed')
      } else {
        this.setItemProcessingStatus(key, 'Completed')
        setTimeout(() => {
          this.setItemVisibility(key, false)
          console.log(`Removed ${key}`)
        },
        1000)
      }
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
