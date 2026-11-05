import apiClient from './apiClient'

/** Response from POST /s3-img-uploader/upload */
export interface UploadedImage {
  url: string
  key: string
  fileName: string
  mimeType: string
  size: number
  folder: string
}

export const MAX_IMAGE_SIZE_MB = 5

export const s3UploadService = {
  /**
   * Upload one image. Returns its stored URL and metadata.
   * `onProgress` receives 0–100 while the file is uploading.
   */
  async uploadImage(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<UploadedImage> {
    const form = new FormData()
    form.append('file', file)

    const { data } = await apiClient.post<UploadedImage>(
      '/s3-img-uploader/upload',
      form,
      {
        // Override the client's JSON default so axios sends real multipart data
        // (the browser fills in the boundary itself).
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // uploads can take longer than normal requests
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        },
      },
    )
    return data
  },

  /** Upload several images in parallel (e.g. a product gallery). */
  async uploadImages(files: File[]): Promise<UploadedImage[]> {
    return Promise.all(files.map((file) => this.uploadImage(file)))
  },
}
