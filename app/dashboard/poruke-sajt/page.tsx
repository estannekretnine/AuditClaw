'use client'

import { useState, useEffect } from 'react'
import { Mail, Phone, User, MessageSquare, Check, Clock, Trash2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PorukaSajt {
  id: string
  ime: string
  email: string
  telefon: string
  poruka: string
  procitano: boolean
  created_at: string
}

export default function PorukeSajtPage() {
  const [poruke, setPoruke] = useState<PorukaSajt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPoruka, setSelectedPoruka] = useState<PorukaSajt | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPoruke()
  }, [])

  const loadPoruke = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('poruke_sajt')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      setPoruke(data || [])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('poruke_sajt')
      .update({ procitano: true })
      .eq('id', id)

    if (error) {
      console.error('Error marking as read:', error)
      return
    }

    setPoruke(prev => prev.map(p => p.id === id ? { ...p, procitano: true } : p))
    if (selectedPoruka?.id === id) {
      setSelectedPoruka(prev => prev ? { ...prev, procitano: true } : null)
    }
  }

  const deletePoruka = async (id: string) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovu poruku?')) {
      return
    }

    const { error } = await supabase
      .from('poruke_sajt')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting message:', error)
      return
    }

    setPoruke(prev => prev.filter(p => p.id !== id))
    if (selectedPoruka?.id === id) {
      setSelectedPoruka(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('sr-RS', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Belgrade'
      })
    } catch {
      return dateString
    }
  }

  const neprocitaneCount = poruke.filter(p => !p.procitano).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Poruke sa sajta</h1>
          <p className="text-stone-500 mt-1">
            {poruke.length} ukupno • {neprocitaneCount} nepročitanih
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista poruka */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-stone-50">
            <h2 className="font-semibold text-stone-700">Inbox</h2>
          </div>
          
          {poruke.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-stone-300" />
              <p>Nema poruka</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
              {poruke.map((poruka) => (
                <div
                  key={poruka.id}
                  onClick={() => {
                    setSelectedPoruka(poruka)
                    if (!poruka.procitano) {
                      markAsRead(poruka.id)
                    }
                  }}
                  className={`p-4 cursor-pointer transition-colors hover:bg-stone-50 ${
                    selectedPoruka?.id === poruka.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                  } ${!poruka.procitano ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!poruka.procitano && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                        <span className={`font-medium truncate ${!poruka.procitano ? 'text-stone-900' : 'text-stone-700'}`}>
                          {poruka.ime}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 truncate mt-1">{poruka.email}</p>
                      <p className="text-sm text-stone-600 line-clamp-2 mt-2">{poruka.poruka}</p>
                    </div>
                    <div className="text-xs text-stone-400 whitespace-nowrap">
                      {formatDate(poruka.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detalji poruke */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <h2 className="font-semibold text-stone-700">Detalji poruke</h2>
            {selectedPoruka && (
              <div className="flex items-center gap-2">
                {!selectedPoruka.procitano && (
                  <button
                    onClick={() => markAsRead(selectedPoruka.id)}
                    className="p-2 text-stone-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Označi kao pročitano"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deletePoruka(selectedPoruka.id)}
                  className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Obriši"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {selectedPoruka ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-sm">
                {selectedPoruka.procitano ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Eye className="w-4 h-4" />
                    Pročitano
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Clock className="w-4 h-4" />
                    Nepročitano
                  </span>
                )}
                <span className="text-stone-300">•</span>
                <span className="text-stone-500">{formatDate(selectedPoruka.created_at)}</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">{selectedPoruka.ime}</p>
                    <p className="text-sm text-stone-500">Ime i prezime</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <a href={`mailto:${selectedPoruka.email}`} className="font-medium text-stone-900 hover:text-amber-600">
                      {selectedPoruka.email}
                    </a>
                    <p className="text-sm text-stone-500">Email</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <a href={`tel:${selectedPoruka.telefon}`} className="font-medium text-stone-900 hover:text-amber-600">
                      {selectedPoruka.telefon}
                    </a>
                    <p className="text-sm text-stone-500">Telefon</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-stone-500 mb-2">Poruka</h3>
                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="text-stone-700 whitespace-pre-wrap">{selectedPoruka.poruka}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-stone-200">
                <a
                  href={`mailto:${selectedPoruka.email}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Odgovori na email
                </a>
                <a
                  href={`tel:${selectedPoruka.telefon}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Pozovi
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-stone-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-stone-300" />
              <p>Izaberite poruku za prikaz detalja</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
