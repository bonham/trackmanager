<template>
  <track-manager-nav-bar :sid="sid">
    <h1 class="mt-4 mb-4">
      Upload new Tracks
    </h1>

    <BRow class="mt-3">
      <BCol />
    </BRow>
    <BRow>
      <BCol>
        <DropField @files-dropped="processDragDrop">
          <label for="input" class="border border-1 rounded p-2 d-flex flex-row">
            <div
              class="flex-grow-1 border border-3 rounded-2 border-secondary-subtle dropzone d-flex align-items-center justify-content-center text-secondary">
              Drop files or klick to upload
            </div>
          </label>
          <input id="input" type="file" multiple class="hideinput" @change="onChange">
        </DropField>
      </BCol>
    </BRow>
    <transition-group name="list" tag="span">
      <BRow v-for="item in visibleUploadItems" :key="item.key" class="list-item">
        <BCol>
          <UploadItem :fname="item.fname" :status="item.status" :error="item.error" />
        </BCol>
      </BRow>
    </transition-group>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">

import { BRow, BCol } from 'bootstrap-vue-next'
import UploadItem from '@/components/UploadItem.vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import DropField from '@/components/DropField.vue'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { FileUploadQueue, makeFileIdObject } from '@/lib/FileUploadQueue'
import type { QueueStatus, QueuedFile } from '@/lib/uploadFile'
import { UploadError } from '@/lib/uploadFile'
import type { AsyncResultCallback } from 'async'
type CallbackArguments = Parameters<AsyncResultCallback<number, UploadError>>;

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

const uploadList: Ref<QueuedFile[]> = ref([])
// uploadList: [{ key: -1, fname: 'One', status: 'Queued' }, { key: -2, fname: 'One', status: 'Queued' }, { key: -3, fname: 'One', status: 'Queued' }],

const maxKey = ref(0)
const workerQueue = ref(new FileUploadQueue())

const visibleUploadItems = computed(() => {
  const visibleList = uploadList.value.filter((item): item is QueuedFile => item.visible)
  return visibleList
})

function getUploadItemByKey(key: number) {
  const item = uploadList.value.find(element => element.key === key)
  if (item === undefined) { throw new UploadError(`Could not find Upload item with id ${key}`, "") }
  return item
}

function setItemProcessingStatus(key: number, status: QueueStatus) {
  const item = getUploadItemByKey(key)
  item.status = status
}

function setItemVisibility(key: number, visibility: boolean) {
  const item = getUploadItemByKey(key)
  item.visible = visibility
}

function onChange(event: Event) {
  if (event.target === null) { console.error("Event target is null"); return }
  const target = (event.target as HTMLInputElement)
  if (target.files === null) { console.error("target.files is null"); return }
  processDragDrop(target.files)
}

function getNextKey(): number {
  return (maxKey.value += 1)
}

// Queue new files
function processDragDrop(files: FileList) {
  // take files from input
  for (const thisFile of files) {
    const key = getNextKey()
    const fileIdObject = makeFileIdObject(key, thisFile, props.sid)
    addItemToQueue(fileIdObject)
  }
}

function addItemToQueue(fileIdObject: QueuedFile) {
  uploadList.value.push(fileIdObject)
  workerQueue.value.push(
    {
      fileIdObject,
      setItemProcessingStatus: setItemProcessingStatus // callback to set status while processed in queue
    },
    completedCallBack
  )
}


function completedCallBack(err: CallbackArguments[0], key: CallbackArguments[1]): void {
  //console.log(`Finished processing ${key}`)
  if (key === null || key === undefined) throw Error("key is null")
  if (err) {
    console.error('Error occured during queue processing: ', err.message)
    console.error('Error cause: ', err)
    setItemProcessingStatus(key, 'Failed')
  } else {
    setItemProcessingStatus(key, 'Completed' as QueueStatus)
    setTimeout(() => {
      setItemVisibility(key, false)
      // console.log(`Removed ${key}`)
    },
      1000)
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

.list-enter,
.list-leave-to

/* .list-leave-active below version 2.1.8 */
  {
  opacity: 0;
}

/* .list-move {
  transition: transform 1s;
} */
.dropzone {
  --bs-border-style: dashed;
  height: 8em;
  margin: 2em 8em 2em 8em;
}

.hideinput {
  opacity: 0;
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
</style>
