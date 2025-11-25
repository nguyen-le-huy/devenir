import axiosInstance from './axiosConfig'

/**
 * Upload single image to Cloudinary via backend
 */
export const uploadImage = async (file: File) => {
  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await axiosInstance.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to upload image')
  }
}

/**
 * Upload multiple images to Cloudinary via backend
 */
export const uploadImages = async (files: File[]) => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('images', file)
  })

  try {
    const response = await axiosInstance.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to upload images')
  }
}

/**
 * Delete image from Cloudinary via backend
 */
export const deleteImage = async (publicId: string) => {
  try {
    const response = await axiosInstance.delete(`/upload/${publicId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete image')
  }
}
