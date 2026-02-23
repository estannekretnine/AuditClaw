'use client'

import { useState } from 'react'
import { type Translations } from '@/lib/i18n/translations'

interface ContactFormProps {
  t: Translations
}

interface FormData {
  name: string
  email: string
  phone: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  message?: string
}

export function ContactForm({ t }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = t.contact.form.validation.nameRequired
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t.contact.form.validation.nameMin
    }

    if (!formData.email.trim()) {
      newErrors.email = t.contact.form.validation.emailRequired
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.contact.form.validation.emailInvalid
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t.contact.form.validation.phoneRequired
    } else if (formData.phone.replace(/\D/g, '').length < 6) {
      newErrors.phone = t.contact.form.validation.phoneMin
    }

    if (!formData.message.trim()) {
      newErrors.message = t.contact.form.validation.messageRequired
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t.contact.form.validation.messageMin
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setStatus('submitting')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error('Failed to send')
      }

      setStatus('success')
      setFormData({ name: '', email: '', phone: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto mt-12" noValidate>
      <div className="space-y-4">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-foreground mb-1">
            {t.contact.form.name} *
          </label>
          <input
            id="contact-name"
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            placeholder={t.contact.form.namePlaceholder}
            className={`w-full px-4 py-3 bg-surface border rounded-lg text-foreground placeholder-foreground-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors ${
              errors.name ? 'border-red-500' : 'border-border'
            }`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-1">
            {t.contact.form.email} *
          </label>
          <input
            id="contact-email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder={t.contact.form.emailPlaceholder}
            className={`w-full px-4 py-3 bg-surface border rounded-lg text-foreground placeholder-foreground-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors ${
              errors.email ? 'border-red-500' : 'border-border'
            }`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium text-foreground mb-1">
            {t.contact.form.phone} *
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange('phone')}
            placeholder={t.contact.form.phonePlaceholder}
            className={`w-full px-4 py-3 bg-surface border rounded-lg text-foreground placeholder-foreground-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors ${
              errors.phone ? 'border-red-500' : 'border-border'
            }`}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-1">
            {t.contact.form.message} *
          </label>
          <textarea
            id="contact-message"
            value={formData.message}
            onChange={handleChange('message')}
            placeholder={t.contact.form.messagePlaceholder}
            rows={4}
            className={`w-full px-4 py-3 bg-surface border rounded-lg text-foreground placeholder-foreground-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none ${
              errors.message ? 'border-red-500' : 'border-border'
            }`}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          {errors.message && (
            <p id="message-error" className="mt-1 text-sm text-red-500">{errors.message}</p>
          )}
        </div>
      </div>

      {status === 'success' && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          {t.contact.form.success}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {t.contact.form.error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 w-full px-6 py-4 bg-accent hover:bg-accent-hover text-background font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? t.contact.form.submitting : t.contact.form.submit}
      </button>
    </form>
  )
}
