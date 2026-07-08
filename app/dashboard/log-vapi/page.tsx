'use client'

import { useCallback, useEffect, useState } from 'react'
import { ScrollText, LogIn, Route } from 'lucide-react'
import { getVapiUserLogs } from '@/lib/actions/vapi-user-log'
import type { VapiUserLog } from '@/lib/types/vapi'

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString('sr-RS', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Belgrade',
    })
  } catch {
    return dateString
  }
}

function eventLabel(eventType: string) {
  if (eventType === 'login') return 'Login'
  if (eventType === 'page_view') return 'Otvorio stranicu'
  return eventType
}

export default function LogVapiPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<VapiUserLog[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getVapiUserLogs(300)
      if (!result.error && result.data) {
        setItems(result.data)
        setTotalCount(result.count)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Log Vapi</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Evidencija kada je Vapi korisnik ušao i koje je stranice otvarao.
          </p>
        </div>
        <button
          onClick={loadData}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
        >
          Osveži log
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 sm:p-16 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ScrollText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-lg sm:text-xl font-semibold mb-2">Nema logova</p>
          <p className="text-gray-500">Kada se Vapi korisnik prijavi ili otvori stranicu, zapis će se pojaviti ovde.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/70 text-sm text-gray-600">
            Ukupno zapisa: <strong>{totalCount}</strong>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-900 to-black">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Vreme</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Korisnik</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Akcija</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Ruta</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Detalj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50 transition-all duration-200">
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{item.naziv || '-'}</div>
                      <div className="text-xs text-gray-500">{item.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{eventLabel(item.event_type)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.route || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-4 hover:bg-amber-50 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    {item.event_type === 'login' ? (
                      <LogIn className="w-5 h-5 text-amber-700" />
                    ) : (
                      <Route className="w-5 h-5 text-indigo-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm font-semibold text-gray-900">{eventLabel(item.event_type)}</p>
                    <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                    <p className="text-sm text-gray-800 break-words">{item.naziv || '-'}</p>
                    <p className="text-xs text-gray-500 break-all">{item.email || '-'}</p>
                    <p className="text-xs text-gray-600 break-all">Ruta: {item.route || '-'}</p>
                    {item.details ? <p className="text-xs text-gray-600 break-words">{item.details}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
