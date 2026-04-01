'use client'

import { useState } from 'react'

interface FormData {
  ime: string
  prezime: string
  firma: string
  email: string
  kontakt: string
  stsinvestitor: boolean
  stsinvestitoraudit: boolean
  stskupac: boolean
  stsprijateljsajta: boolean
  stsprodavac: boolean
  opis: string
}

interface FormErrors {
  ime?: string
  prezime?: string
  email?: string
  kontakt?: string
}

interface KlijentRegistrationFormProps {
  lang?: 'sr' | 'en'
}

const labels = {
  sr: {
    ime: 'Ime',
    prezime: 'Prezime',
    firma: 'Firma',
    email: 'Email adresa',
    kontakt: 'Telefon',
    statusi: 'Ja sam (izaberite sve što se odnosi na vas)',
    investitor: 'Investitor',
    investitorAudit: 'Investitor AuditClaw-Project',
    kupac: 'Kupac',
    prijateljSajta: 'Prijatelj sajta',
    prodavac: 'Prodavac',
    opis: 'Poruka / Opis',
    submit: 'Registruj se',
    submitting: 'Slanje...',
    success: 'Uspešno ste se registrovali! Javićemo vam se uskoro.',
    error: 'Greška pri registraciji. Molimo pokušajte ponovo.',
    placeholders: {
      ime: 'Vaše ime',
      prezime: 'Vaše prezime',
      firma: 'Naziv firme (opciono)',
      email: 'vas@email.com',
      kontakt: '+381 63 123 4567',
      opis: 'Opišite vaše potrebe ili ostavite poruku...',
    },
    validation: {
      imeRequired: 'Ime je obavezno',
      imeMin: 'Ime mora imati najmanje 2 karaktera',
      prezimeRequired: 'Prezime je obavezno',
      prezimeMin: 'Prezime mora imati najmanje 2 karaktera',
      emailRequired: 'Email je obavezan',
      emailInvalid: 'Unesite validnu email adresu',
      kontaktRequired: 'Telefon je obavezan',
      kontaktMin: 'Telefon mora imati najmanje 6 cifara',
    },
  },
  en: {
    ime: 'First Name',
    prezime: 'Last Name',
    firma: 'Company',
    email: 'Email Address',
    kontakt: 'Phone',
    statusi: 'I am (select all that apply)',
    investitor: 'Investor',
    investitorAudit: 'Investor AuditClaw-Project',
    kupac: 'Buyer',
    prijateljSajta: 'Friend of the site',
    prodavac: 'Seller',
    opis: 'Message / Description',
    submit: 'Register',
    submitting: 'Sending...',
    success: 'You have successfully registered! We will contact you soon.',
    error: 'Registration error. Please try again.',
    placeholders: {
      ime: 'Your first name',
      prezime: 'Your last name',
      firma: 'Company name (optional)',
      email: 'you@email.com',
      kontakt: '+381 63 123 4567',
      opis: 'Describe your needs or leave a message...',
    },
    validation: {
      imeRequired: 'First name is required',
      imeMin: 'First name must be at least 2 characters',
      prezimeRequired: 'Last name is required',
      prezimeMin: 'Last name must be at least 2 characters',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      kontaktRequired: 'Phone is required',
      kontaktMin: 'Phone must be at least 6 digits',
    },
  },
}

export function KlijentRegistrationForm({ lang = 'sr' }: KlijentRegistrationFormProps) {
  const t = labels[lang]
  const [formData, setFormData] = useState<FormData>({
    ime: '',
    prezime: '',
    firma: '',
    email: '',
    kontakt: '',
    stsinvestitor: false,
    stsinvestitoraudit: false,
    stskupac: false,
    stsprijateljsajta: false,
    stsprodavac: false,
    opis: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.ime.trim()) {
      newErrors.ime = t.validation.imeRequired
    } else if (formData.ime.trim().length < 2) {
      newErrors.ime = t.validation.imeMin
    }

    if (!formData.prezime.trim()) {
      newErrors.prezime = t.validation.prezimeRequired
    } else if (formData.prezime.trim().length < 2) {
      newErrors.prezime = t.validation.prezimeMin
    }

    if (!formData.email.trim()) {
      newErrors.email = t.validation.emailRequired
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.validation.emailInvalid
    }

    if (!formData.kontakt.trim()) {
      newErrors.kontakt = t.validation.kontaktRequired
    } else if (formData.kontakt.replace(/\D/g, '').length < 6) {
      newErrors.kontakt = t.validation.kontaktMin
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setStatus('submitting')

    try {
      const res = await fetch('/api/klijent-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error('Failed to send')
      }

      setStatus('success')
      setFormData({
        ime: '',
        prezime: '',
        firma: '',
        email: '',
        kontakt: '',
        stsinvestitor: false,
        stsinvestitoraudit: false,
        stskupac: false,
        stsprijateljsajta: false,
        stsprodavac: false,
        opis: '',
      })
    } catch {
      setStatus('error')
    }
  }

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto mt-8" noValidate autoComplete="off">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="klijent-ime" className="block text-sm font-medium text-foreground mb-1">
              {t.ime} *
            </label>
            <input
              id="klijent-ime"
              type="text"
              value={formData.ime}
              onChange={handleChange('ime')}
              placeholder={t.placeholders.ime}
              autoComplete="off"
              className={`w-full px-4 py-3 bg-surface border rounded-lg text-foreground placeholder-foreground-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors ${
                errors.ime ? 'border-red-500' : 'border-border'
              }`}
              style={{ color: 'white' }}
              aria-invalid={!!errors.ime}
              aria-describedby={errors.ime ? 'ime-error' : undefined}
            />
            {errors.ime && (
              <p id="ime-error" className="mt-1 text-sm text-red-500">{errors.ime}</p>
            )}
          </div>

          <div>
            <label htmlFor="klijent-prezime" className="block text-sm font-medium text-foreground mb-1">
              {t.prezime} *
            </label>
            <input
              id="klijent-prezime"
              type="text"
              value={formData.prezime}
              onChange={handleChange('prezime')}
              placeholder={t.placeholders.prezime}
              autoComplete="off"
              className={`w-full px-4 py-3 bg-surface border rounded-lg text-foreground placeholder-foreground-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors ${
                errors.prezime ? 'border-red-500' : 'border-border'
              }`}
              style={{ color: 'white' }}
              aria-invalid={!!errors.prezime}
              aria-describedby={errors.prezime ? 'prezime-error' : undefined}
            />
            {errors.prezime && (
              <p id="prezime-error" className="mt-1 text-sm text-red-500">{errors.prezime}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="klijent-firma" className="block text-sm font-medium text-foreground mb-1">
            {t.firma}
          </label>
          <input
            id="klijent-firma"
            type="text"
            value={formData.firma}
            onChange={handleChange('firma')}
            placeholder={t.placeholders.firma}
            autoComplete="off"
            className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            style={{ color: 'white' }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="klijent-email" className="block text-sm font-medium text-foreground mb-1">
              {t.email} *
            </label>
            <input
              id="klijent-email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder={t.placeholders.email}
              autoComplete="off"
              className={`w-full px-4 py-3 bg-surface border rounded-lg text-foreground placeholder-foreground-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors ${
                errors.email ? 'border-red-500' : 'border-border'
              }`}
              style={{ color: 'white' }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="klijent-kontakt" className="block text-sm font-medium text-foreground mb-1">
              {t.kontakt} *
            </label>
            <input
              id="klijent-kontakt"
              type="tel"
              value={formData.kontakt}
              onChange={handleChange('kontakt')}
              placeholder={t.placeholders.kontakt}
              autoComplete="off"
              className={`w-full px-4 py-3 bg-surface border rounded-lg text-foreground placeholder-foreground-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors ${
                errors.kontakt ? 'border-red-500' : 'border-border'
              }`}
              style={{ color: 'white' }}
              aria-invalid={!!errors.kontakt}
              aria-describedby={errors.kontakt ? 'kontakt-error' : undefined}
            />
            {errors.kontakt && (
              <p id="kontakt-error" className="mt-1 text-sm text-red-500">{errors.kontakt}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            {t.statusi}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
              <input
                type="checkbox"
                checked={formData.stsinvestitor}
                onChange={handleChange('stsinvestitor')}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
              />
              <span className="text-sm text-foreground">{t.investitor}</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
              <input
                type="checkbox"
                checked={formData.stsinvestitoraudit}
                onChange={handleChange('stsinvestitoraudit')}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
              />
              <span className="text-sm text-foreground">{t.investitorAudit}</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
              <input
                type="checkbox"
                checked={formData.stskupac}
                onChange={handleChange('stskupac')}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
              />
              <span className="text-sm text-foreground">{t.kupac}</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
              <input
                type="checkbox"
                checked={formData.stsprijateljsajta}
                onChange={handleChange('stsprijateljsajta')}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
              />
              <span className="text-sm text-foreground">{t.prijateljSajta}</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
              <input
                type="checkbox"
                checked={formData.stsprodavac}
                onChange={handleChange('stsprodavac')}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
              />
              <span className="text-sm text-foreground">{t.prodavac}</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="klijent-opis" className="block text-sm font-medium text-foreground mb-1">
            {t.opis}
          </label>
          <textarea
            id="klijent-opis"
            value={formData.opis}
            onChange={handleChange('opis')}
            placeholder={t.placeholders.opis}
            rows={4}
            autoComplete="off"
            className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
            style={{ color: 'white' }}
          />
        </div>
      </div>

      {status === 'success' && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          {t.success}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {t.error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 w-full px-6 py-4 bg-accent hover:bg-accent-hover text-background font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? t.submitting : t.submit}
      </button>
    </form>
  )
}
