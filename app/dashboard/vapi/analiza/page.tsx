'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Bot,
  GraduationCap,
  MessageCircle,
  RefreshCw,
  Stethoscope,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { getVapiAnalizaReport } from '@/lib/actions/vapi-analiza'
import type { VapiAnalizaCountItem, VapiAnalizaReport } from '@/lib/types/vapi-analiza'

function formatDateLabel(value: string): string {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })
}

function defaultDateFrom(): string {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().slice(0, 10)
}

function defaultDateTo(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatAvg(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(2)
}

function HorizontalBarChart({
  title,
  icon,
  items,
  colorClass = 'bg-amber-500',
}: {
  title: string
  icon: React.ReactNode
  items: Array<{ label: string; count: number; extra?: string | null }>
  colorClass?: string
}) {
  const max = Math.max(...items.map((item) => item.count), 1)

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Nema podataka za izabrani period.</p>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 10).map((item) => (
            <div key={`${title}-${item.label}`}>
              <div className="flex justify-between items-center gap-3 mb-1">
                <span className="text-sm text-gray-700 truncate" title={item.label}>
                  {item.label}
                  {item.extra ? <span className="text-gray-400"> · {item.extra}</span> : null}
                </span>
                <span className="text-sm font-bold text-gray-900 shrink-0">{item.count}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${colorClass}`}
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VerticalDailyChart({ items }: { items: VapiAnalizaReport['dailyOdgovori'] }) {
  const max = Math.max(...items.map((item) => item.count), 1)

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-amber-500" />
        Dnevni trend odgovora
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Nema odgovora u periodu.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex items-end gap-2 min-w-max h-52 px-1">
            {items.map((item) => (
              <div key={item.date} className="flex flex-col items-center gap-2 min-w-[44px]">
                <span className="text-xs font-semibold text-gray-700">{item.count}</span>
                <div
                  className="w-8 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg"
                  style={{ height: `${Math.max(12, (item.count / max) * 160)}px` }}
                />
                <span className="text-[10px] text-gray-500 -rotate-45 origin-top-left whitespace-nowrap">
                  {formatDateLabel(item.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryTable({
  title,
  rows,
}: {
  title: string
  rows: VapiAnalizaCountItem[]
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Naziv</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dodatno</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Broj</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Prosek AI</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Prosek prof.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  Nema podataka.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${title}-${row.id}`} className="hover:bg-amber-50/50">
                  <td className="px-4 py-3 text-sm text-gray-800">{row.label}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{row.extra || '—'}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{row.count}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{formatAvg(row.avgAi)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{formatAvg(row.avgProf)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function VapiAnalizaPage() {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<VapiAnalizaReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState(defaultDateFrom)
  const [dateTo, setDateTo] = useState(defaultDateTo)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getVapiAnalizaReport({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      if (result.error) {
        setError(result.error)
        setReport(null)
      } else {
        setReport(result.data)
      }
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    loadData()
  }, [loadData])

  const kpiCards = useMemo(() => {
    if (!report) return []
    const { summary } = report
    return [
      { label: 'Odgovori u periodu', value: summary.totalOdgovori, icon: MessageCircle, color: 'from-amber-500 to-amber-600' },
      { label: 'Aktivni učenici', value: summary.uniqueUcenici, icon: User, color: 'from-blue-500 to-blue-600' },
      { label: 'Aktivni profesori', value: summary.uniqueProfesori, icon: GraduationCap, color: 'from-indigo-500 to-indigo-600' },
      { label: 'Korišćeni asistenti', value: summary.uniqueAssistants, icon: Bot, color: 'from-emerald-500 to-emerald-600' },
      { label: 'Prosek ocena AI', value: formatAvg(summary.avgOcenaAi), icon: BarChart3, color: 'from-violet-500 to-violet-600' },
      { label: 'Prosek ocena prof.', value: formatAvg(summary.avgOcenaProfesor), icon: TrendingUp, color: 'from-rose-500 to-rose-600' },
    ]
  }, [report])

  const masterCards = useMemo(() => {
    if (!report) return []
    const { summary } = report
    return [
      { label: 'Ukupno asistenata', value: summary.totalAssistants, icon: Bot },
      { label: 'Ukupno učenika', value: summary.totalUcenici, icon: Users },
      { label: 'Ukupno profesora', value: summary.totalProfesori, icon: GraduationCap },
      { label: 'Aktivni profesori', value: summary.activeProfesori, icon: GraduationCap },
      { label: 'Medicinska oprema', value: summary.totalOprema, icon: Stethoscope },
      { label: 'Ocenjeno od prof.', value: summary.withProfesorOcena, icon: MessageCircle },
    ]
  }, [report])

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-amber-500" />
            Vapi Analiza
          </h2>
          <p className="text-gray-500 mt-1">
            Sintetički i analitički izveštaji po periodu — odgovori, asistenti, profesori, učenici i oprema
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 font-medium text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Osveži
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Od datuma</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Do datuma</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-medium text-sm"
          >
            Primeni period
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-700">{error}</div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {kpiCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">{card.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                    </div>
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {masterCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{card.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              )
            })}
          </div>

          <VerticalDailyChart items={report.dailyOdgovori} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <HorizontalBarChart
              title="Odgovori po asistentu"
              icon={<Bot className="w-5 h-5 text-emerald-500" />}
              items={report.byAssistant}
              colorClass="bg-emerald-500"
            />
            <HorizontalBarChart
              title="Odgovori po profesoru"
              icon={<GraduationCap className="w-5 h-5 text-indigo-500" />}
              items={report.byProfesor}
              colorClass="bg-indigo-500"
            />
            <HorizontalBarChart
              title="Odgovori po učeniku"
              icon={<User className="w-5 h-5 text-blue-500" />}
              items={report.byUcenik.map((item) => ({ ...item, extra: item.extra }))}
              colorClass="bg-blue-500"
            />
            <HorizontalBarChart
              title="Odgovori po razredu"
              icon={<Users className="w-5 h-5 text-violet-500" />}
              items={report.byRazred}
              colorClass="bg-violet-500"
            />
            <HorizontalBarChart
              title="Korišćenje medicinske opreme"
              icon={<Stethoscope className="w-5 h-5 text-rose-500" />}
              items={report.byOprema}
              colorClass="bg-rose-500"
            />
            <HorizontalBarChart
              title="Distribucija ocena AI"
              icon={<BarChart3 className="w-5 h-5 text-amber-500" />}
              items={report.gradeDistributionAi.map((item) => ({ label: `Ocena ${item.grade}`, count: item.count }))}
              colorClass="bg-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <HorizontalBarChart
              title="Distribucija ocena profesora"
              icon={<TrendingUp className="w-5 h-5 text-rose-500" />}
              items={report.gradeDistributionProf.map((item) => ({ label: `Ocena ${item.grade}`, count: item.count }))}
              colorClass="bg-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <SummaryTable title="Detaljno po asistentu" rows={report.byAssistant} />
            <SummaryTable title="Detaljno po profesoru" rows={report.byProfesor} />
            <SummaryTable title="Detaljno po učeniku" rows={report.byUcenik} />
            <SummaryTable title="Detaljno po medicinskoj opremi" rows={report.byOprema} />
          </div>
        </>
      ) : null}
    </div>
  )
}
