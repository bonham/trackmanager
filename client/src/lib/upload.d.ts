interface QueuedFile {
  key: number,
        fname: string,
        fileBlob: File,
        error: Error | null,
        details: string | null,
        status: QueueStatus,
        sid: string,
        visible: boolean
}

type QueueStatus = 'Queued' | 'Processing' | 'Failed' |'Done'