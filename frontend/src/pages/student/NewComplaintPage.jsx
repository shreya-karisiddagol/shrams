import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentService } from '../../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useDropzone } from 'react-dropzone'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

const CATEGORIES = ['Electrical', 'Plumbing', 'Furniture', 'Cleaning', 'AC/Fan', 'Internet/WiFi', 'Structural', 'Other']
const PRIORITIES = [
  { value: 'low', label: 'Low', desc: 'Non-urgent, can wait', color: 'border-gray-300 text-gray-600' },
  { value: 'medium', label: 'Medium', desc: 'Should be fixed soon', color: 'border-blue-400 text-blue-600' },
  { value: 'high', label: 'High', desc: 'Urgent issue', color: 'border-orange-400 text-orange-600' },
  { value: 'critical', label: 'Critical', desc: 'Needs immediate attention', color: 'border-red-500 text-red-600' },
]

export default function NewComplaintPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ category: '', title: '', description: '', priority: 'medium' })
  const [images, setImages] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onDrop = useCallback((accepted) => {
    if (images.length + accepted.length > 5) return toast.error('Maximum 5 images allowed')
    setImages(prev => [...prev, ...accepted.slice(0, 5 - prev.length)])
  }, [images])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxSize: 5 * 1024 * 1024, maxFiles: 5
  })

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category) return toast.error('Please select a category')
    if (!form.title.trim()) return toast.error('Please enter a complaint title')
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      images.forEach(img => fd.append('images', img))
      await studentService.createComplaint(fd)
      toast.success('Complaint submitted successfully!')
      navigate('/student/complaints')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Complaint</h1>
        <p className="text-gray-500 text-sm">Report a maintenance issue in your room</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Category */}
        <div>
          <label className="label">Category *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => set('category', cat)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                  form.category === cat
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="label">Title *</label>
          <input
            className="input-field"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Brief description of the issue (e.g., Leaking tap in bathroom)"
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            className="input-field resize-none"
            rows={4}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Provide more details about the issue, when it started, etc."
          />
        </div>

        {/* Priority */}
        <div>
          <label className="label">Priority *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRIORITIES.map(p => (
              <div
                key={p.value}
                onClick={() => set('priority', p.value)}
                className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${
                  form.priority === p.value ? `${p.color} bg-opacity-10 border-opacity-100` : 'border-gray-200 hover:border-gray-300'
                } ${form.priority === p.value ? 'bg-current/5' : ''}`}
              >
                <p className={`font-semibold text-sm ${form.priority === p.value ? p.color.split(' ')[1] : 'text-gray-700'}`}>{p.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="label">Images (Optional, max 5)</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">
              {isDragActive ? 'Drop images here...' : 'Drag & drop images, or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB each</p>
          </div>
          {images.length > 0 && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`preview-${i}`}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/student/complaints')} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
              : '📤 Submit Complaint'
            }
          </button>
        </div>
      </form>
    </div>
  )
}
