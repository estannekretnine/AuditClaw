'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Greška pri prijavljivanju')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Greška pri povezivanju sa serverom')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Leva strana - Hero slika */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black">
        {/* Pozadinska slika */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1551836022-4c4c79ecde51?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80')`,
          }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />
        
        {/* Sadržaj preko slike */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">AUDITCLAW</h2>
              <p className="text-xs text-amber-400 tracking-widest uppercase">Admin Panel</p>
            </div>
          </div>
          
          {/* Središnji tekst */}
          <div className="max-w-md">
            <h1 className="text-5xl font-light leading-tight mb-6">
              Upravljajte
              <span className="block font-semibold text-amber-400">Vašim Sistemom</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              Centralizovano upravljanje korisnicima i podacima na jednom mestu.
            </p>
          </div>
          
          {/* Statistike */}
          <div className="flex gap-12">
            <div>
              <div className="text-4xl font-bold text-amber-400">100%</div>
              <div className="text-sm text-white/60 mt-1">Sigurnost</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-400">24/7</div>
              <div className="text-sm text-white/60 mt-1">Dostupnost</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-400">Pro</div>
              <div className="text-sm text-white/60 mt-1">Podrška</div>
            </div>
          </div>
        </div>
      </div>

      {/* Desna strana - Login forma */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-stone-50 p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-stone-900">AUDITCLAW</h2>
              <p className="text-xs text-amber-600 tracking-widest uppercase">Admin Panel</p>
            </div>
          </div>

          {/* Naslov */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-stone-900 mb-2">
              Dobrodošli nazad
            </h1>
            <p className="text-stone-500">
              Unesite vaše podatke za pristup
            </p>
          </div>

          {/* Forma */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                Email adresa
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  placeholder="vas@email.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
                Lozinka
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 text-white py-3.5 px-4 rounded-lg hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Prijavljivanje...
                </>
              ) : (
                <>
                  Prijavi se
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-stone-200"></div>
            <span className="text-xs text-stone-400 uppercase tracking-wider">ili</span>
            <div className="flex-1 h-px bg-stone-200"></div>
          </div>

          {/* Kontakt info */}
          <div className="text-center">
            <p className="text-sm text-stone-500 mb-2">Nemate nalog?</p>
            <p className="text-sm text-stone-600">
              Kontaktirajte administratora na{' '}
              <a href="mailto:admin@auditclaw.com" className="text-amber-600 hover:text-amber-700 font-medium">
                admin@auditclaw.com
              </a>
            </p>
          </div>

          {/* Build info */}
          <div className="mt-6 p-3 bg-stone-100 rounded-lg">
            <div className="text-center text-xs text-stone-500">
              <span className="font-semibold">Poslednje ažuriranje:</span>
              <br />
              <span className="text-stone-600">12.02.2026 - 22:30</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-stone-200">
            <div className="flex items-center justify-center gap-3 text-xs text-stone-400">
              <span className="font-medium">AuditClaw v1.0</span>
              <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
              <span>2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
