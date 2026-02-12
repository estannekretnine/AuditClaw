'use client'

import { useState, useRef } from 'react'
import { Upload, X, Star, ArrowUp, ArrowDown, Layers, Image as ImageIcon } from 'lucide-react'
import type { PonudaFoto } from '@/lib/types/ponuda'

// Tip za foto sa lokalnim file-om
export interface PhotoItem {
  id: number
  file?: File
  url: string
  opis: string | null
  redosled: number | null
  glavna: boolean | null
  stsskica: boolean | null
  skica_coords?: string | null
  idponude?: number | null
  datumpromene?: string
  opisfoto?: Record<string, unknown> | null
  skica_segment?: string | null
  isNew?: boolean // Da li je nova fotografija (još nije sačuvana)
  isDeleted?: boolean // Da li je označena za brisanje
}

interface PhotoUploadProps {
  photos: PhotoItem[]
  onPhotosChange: (photos: PhotoItem[]) => void
}

export default function PhotoUpload({ photos = [], onPhotosChange }: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fotografije koje su označene kao skice
  const sketchPhotos = photos.filter(p => p.stsskica && !p.isDeleted)
  
  // Fotografije koje NISU skice (obične fotografije)
  const regularPhotos = photos.filter(p => !p.stsskica && !p.isDeleted)

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files)
    const maxRedosled = photos.length > 0 ? Math.max(...photos.map(p => p.redosled || 0)) : 0
    const newPhotos: PhotoItem[] = fileArray.map((file, index) => ({
      id: Date.now() + Math.random() + index,
      file,
      url: URL.createObjectURL(file),
      opis: '',
      redosled: maxRedosled + index + 1,
      glavna: photos.filter(p => !p.isDeleted).length === 0 && index === 0,
      stsskica: false,
      skica_coords: '',
      isNew: true
    }))
    
    onPhotosChange([...photos, ...newPhotos])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
    e.target.value = ''
  }

  const removePhoto = (id: number) => {
    const photoToRemove = photos.find(photo => photo.id === id)
    if (!photoToRemove) return
    
    // Ako je nova fotografija, ukloni je potpuno
    if (photoToRemove.isNew) {
      if (photoToRemove.url && photoToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(photoToRemove.url)
      }
      const updatedPhotos = photos.filter(photo => photo.id !== id)
      onPhotosChange(updatedPhotos)
    } else {
      // Ako je postojeća fotografija, označi je za brisanje
      const updatedPhotos = photos.map(photo => 
        photo.id === id ? { ...photo, isDeleted: true } : photo
      )
      onPhotosChange(updatedPhotos)
    }
  }

  const updatePhotoDescription = (id: number, opis: string) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === id ? { ...photo, opis } : photo
    )
    onPhotosChange(updatedPhotos)
  }

  const updatePhotoRedosled = (id: number, redosled: string) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === id ? { ...photo, redosled: redosled ? parseInt(redosled) : null } : photo
    )
    onPhotosChange(updatedPhotos)
  }

  const toggleGlavna = (id: number) => {
    const updatedPhotos = photos.map(photo => ({
      ...photo,
      glavna: photo.id === id ? !photo.glavna : false
    }))
    onPhotosChange(updatedPhotos)
  }

  const toggleStsskica = (id: number) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === id ? { ...photo, stsskica: !photo.stsskica } : photo
    )
    onPhotosChange(updatedPhotos)
  }

  const movePhoto = (id: number, direction: 'up' | 'down') => {
    const visiblePhotos = photos.filter(p => !p.isDeleted)
    const sortedPhotos = [...visiblePhotos].sort((a, b) => (a.redosled || 0) - (b.redosled || 0))
    const index = sortedPhotos.findIndex(p => p.id === id)
    if (index === -1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sortedPhotos.length) return

    // Zameni redosled
    const currentRedosled = sortedPhotos[index].redosled
    const targetRedosled = sortedPhotos[newIndex].redosled
    
    const updatedPhotos = photos.map(photo => {
      if (photo.id === sortedPhotos[index].id) {
        return { ...photo, redosled: targetRedosled }
      }
      if (photo.id === sortedPhotos[newIndex].id) {
        return { ...photo, redosled: currentRedosled }
      }
      return photo
    })

    onPhotosChange(updatedPhotos)
  }

  const updatePhoto = (id: number, newFile: File) => {
    const updatedPhotos = photos.map(photo => {
      if (photo.id === id) {
        if (photo.url && photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url)
        }
        return {
          ...photo,
          file: newFile,
          url: URL.createObjectURL(newFile),
          isNew: true // Označava da treba ponovo upload-ovati
        }
      }
      return photo
    })
    onPhotosChange(updatedPhotos)
  }

  const visiblePhotos = photos.filter(p => !p.isDeleted)
  const sortedVisiblePhotos = [...visiblePhotos].sort((a, b) => (a.redosled || 0) - (b.redosled || 0))

  return (
    <div 
      className="space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Upload zona */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-amber-500 bg-amber-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
        <label
          htmlFor="photo-upload"
          className="cursor-pointer flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">
            Kliknite ili prevucite fotografije ovde
          </p>
          <p className="text-sm text-gray-500">
            Možete odabrati više fotografija odjednom
          </p>
        </label>
      </div>

      {visiblePhotos.length > 0 && (
        <div className="space-y-4">
          {/* Broj fotografija */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <ImageIcon className="w-4 h-4 inline-block mr-1" />
              {visiblePhotos.length} fotografija
              {sketchPhotos.length > 0 && ` (${sketchPhotos.length} skica)`}
            </p>
          </div>

          {/* Lista fotografija */}
          {sortedVisiblePhotos.map((photo, index) => (
            <div
              key={photo.id}
              className={`border rounded-xl p-4 bg-white shadow-sm transition-all ${
                photo.isNew ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={photo.url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  {photo.glavna && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-white rounded-full p-1">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  )}
                  {photo.stsskica && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-1">
                      <Layers className="w-4 h-4" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removePhoto(photo.id)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {photo.isNew && (
                    <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded">
                      Nova
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleGlavna(photo.id)
                      }}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                        photo.glavna
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${photo.glavna ? 'fill-current' : ''}`} />
                      {photo.glavna ? 'Glavna' : 'Postavi kao glavnu'}
                    </button>
                    
                    <label className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm border cursor-pointer transition-colors ${
                      photo.stsskica 
                        ? 'bg-blue-100 text-blue-700 border-blue-300' 
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={photo.stsskica || false}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleStsskica(photo.id)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Layers className="w-4 h-4" />
                      <span>Skica/Tlocrt</span>
                    </label>
                    
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          movePhoto(photo.id, 'up')
                        }}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          movePhoto(photo.id, 'down')
                        }}
                        disabled={index === sortedVisiblePhotos.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opis:
                      </label>
                      <textarea
                        value={photo.opis || ''}
                        onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                        placeholder="Unesite opis fotografije..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                        rows={2}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Redosled:
                      </label>
                      <input
                        type="number"
                        value={photo.redosled || ''}
                        onChange={(e) => updatePhotoRedosled(photo.id, e.target.value)}
                        placeholder="Redosled prikaza"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zameni fotografiju:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (e.target.files && e.target.files[0]) {
                          updatePhoto(photo.id, e.target.files[0])
                        }
                        e.target.value = ''
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
