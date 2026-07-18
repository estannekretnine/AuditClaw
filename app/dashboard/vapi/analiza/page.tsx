'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Bot,
  FileDown,
  GraduationCap,
  MessageCircle,
  RefreshCw,
  Stethoscope,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { SearchableSelect, type SearchableOption } from '@/components/ui/searchable-select'
import { getVapiAnalizaFilterOptions, getVapiAnalizaReport } from '@/lib/actions/vapi-analiza'
import type {
  VapiAnalizaCountItem,
  VapiAnalizaFilterOptions,
  VapiAnalizaReport,
} from '@/lib/types/vapi-analiza'
import { exportSectionToPdf } from '@/lib/vapi/export-section-pdf'

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

function ReportSection({
  id,
  pdfFilename,
  title,
  children,
  className = 'bg-white rounded-3xl shadow-lg border border-gray-100 p-6',
  headerClassName = '',
}: {
  id: string
  pdfFilename: string
  title?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
}) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    const element = document.getElementById(id)
    if (!element) return
    setExporting(true)
    try {
      await exportSectionToPdf(element, pdfFilename)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div id={id} className={className}>
      <div className={`flex items-start justify-between gap-3 mb-4 ${headerClassName}`}>
        {title ? <div className="min-w-0 flex-1">{title}</div> : <div />}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0 disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          {exporting ? 'PDF...' : 'PDF'}
        </button>
      </div>
      {children}
    </div>
  )
}

function HorizontalBarChart({
  items,
  colorClass = 'bg-amber-500',
}: {
  items: Array<{ label: string; count: number; extra?: string | null }>
  colorClass?: string
}) {
  const max = Math.max(...items.map((item) => item.count), 1)

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Nema podataka za izabrane filtere.</p>
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 10).map((item) => (
        <div key={`${item.label}-${item.count}`}>
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
  )
}

function VerticalDailyChart({ items }: { items: VapiAnalizaReport['dailyOdgovori'] }) {
  const max = Math.max(...items.map((item) => item.count), 1)

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Nema odgovora u periodu.</p>
  }

  return (
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
  )
}

function SummaryTableContent({ rows }: { rows: VapiAnalizaCountItem[] }) {
  return (
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
              <tr key={`${row.id}-${row.label}`} className="hover:bg-amber-50/50">
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
  )
}

export default function VapiAnalizaPage() {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<VapiAnalizaReport | null>(null)
  const [filterOptions, setFilterOptions] = useState<VapiAnalizaFilterOptions | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState(defaultDateFrom)
  const [dateTo, setDateTo] = useState(defaultDateTo)
  const [filterProfesorId, setFilterProfesorId] = useState('')
  const [filterUcenikId, setFilterUcenikId] = useState('')
  const [filterOdeljenje, setFilterOdeljenje] = useState('')

  const buildFilter = useCallback(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      profesorId: filterProfesorId ? Number(filterProfesorId) : undefined,
      ucenikId: filterUcenikId ? Number(filterUcenikId) : undefined,
      odeljenje: filterOdeljenje || undefined,
    }),
    [dateFrom, dateTo, filterProfesorId, filterUcenikId, filterOdeljenje]
  )

  const loadFilterOptions = useCallback(async () => {
    const result = await getVapiAnalizaFilterOptions()
    if (!result.error && result.data) {
      setFilterOptions(result.data)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getVapiAnalizaReport(buildFilter())
      if (result.error) {
        setError(result.error)
        setReport(null)
      } else {
        setReport(result.data)
      }
    } finally {
      setLoading(false)
    }
  }, [buildFilter])

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredUcenici = useMemo(() => {
    if (!filterOptions) return []
    if (!filterOdeljenje) return filterOptions.ucenici
    return filterOptions.ucenici.filter((ucenik) => ucenik.odeljenje === filterOdeljenje)
  }, [filterOptions, filterOdeljenje])

  const profesorOptions = useMemo<SearchableOption[]>(
    () => [
      { value: '', label: 'Svi profesori' },
      ...(filterOptions?.profesori || []).map((p) => ({
        value: String(p.id),
        label: p.label,
      })),
    ],
    [filterOptions]
  )

  const odeljenjeOptions = useMemo<SearchableOption[]>(
    () => [
      { value: '', label: 'Sva odeljenja' },
      ...(filterOptions?.odeljenja || []).map((o) => ({ value: o, label: o })),
    ],
    [filterOptions]
  )

  const ucenikOptions = useMemo<SearchableOption[]>(
    () => [
      { value: '', label: 'Svi učenici' },
      ...filteredUcenici.map((u) => ({ value: String(u.id), label: u.label })),
    ],
    [filteredUcenici]
  )

  const hasActiveFilters = Boolean(filterProfesorId || filterUcenikId || filterOdeljenje)

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
            Sintetički i analitički izveštaji po periodu — filteri i PDF export po sekciji
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

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 space-y-4">
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
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Profesor</label>
            <SearchableSelect
              value={filterProfesorId}
              onChange={setFilterProfesorId}
              options={profesorOptions}
              placeholder="Pretraži profesora…"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Odeljenje</label>
            <SearchableSelect
              value={filterOdeljenje}
              onChange={(next) => {
                setFilterOdeljenje(next)
                setFilterUcenikId('')
              }}
              options={odeljenjeOptions}
              placeholder="Pretraži odeljenje…"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Učenik</label>
            <SearchableSelect
              value={filterUcenikId}
              onChange={setFilterUcenikId}
              options={ucenikOptions}
              placeholder="Pretraži učenika ili odeljenje…"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadData}
            className="px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-medium text-sm"
          >
            Primeni filtere
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setFilterProfesorId('')
                setFilterUcenikId('')
                setFilterOdeljenje('')
              }}
              className="px-5 py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Poništi filtere
            </button>
          )}
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
          <ReportSection
            id="vapi-analiza-pregled"
            pdfFilename="vapi-analiza-pregled"
            title={
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Pregled i master podaci
              </h3>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
              {kpiCards.map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.label} className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
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
                  <div key={card.label} className="bg-white border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{card.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                )
              })}
            </div>
          </ReportSection>

          <ReportSection
            id="vapi-analiza-dnevni-trend"
            pdfFilename="vapi-analiza-dnevni-trend"
            title={
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                Dnevni trend odgovora
              </h3>
            }
          >
            <VerticalDailyChart items={report.dailyOdgovori} />
          </ReportSection>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ReportSection
              id="vapi-analiza-po-asistentu"
              pdfFilename="vapi-analiza-po-asistentu"
              title={
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-500" />
                  Odgovori po asistentu
                </h3>
              }
            >
              <HorizontalBarChart items={report.byAssistant} colorClass="bg-emerald-500" />
            </ReportSection>

            <ReportSection
              id="vapi-analiza-po-profesoru"
              pdfFilename="vapi-analiza-po-profesoru"
              title={
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                  Odgovori po profesoru
                </h3>
              }
            >
              <HorizontalBarChart items={report.byProfesor} colorClass="bg-indigo-500" />
            </ReportSection>

            <ReportSection
              id="vapi-analiza-po-uceniku"
              pdfFilename="vapi-analiza-po-uceniku"
              title={
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Odgovori po učeniku
                </h3>
              }
            >
              <HorizontalBarChart
                items={report.byUcenik.map((item) => ({ ...item, extra: item.extra }))}
                colorClass="bg-blue-500"
              />
            </ReportSection>

            <ReportSection
              id="vapi-analiza-po-odeljenju"
              pdfFilename="vapi-analiza-po-odeljenju"
              title={
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-500" />
                  Odgovori po odeljenju
                </h3>
              }
            >
              <HorizontalBarChart items={report.byRazred} colorClass="bg-violet-500" />
            </ReportSection>

            <ReportSection
              id="vapi-analiza-oprema"
              pdfFilename="vapi-analiza-medicinska-oprema"
              title={
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-rose-500" />
                  Korišćenje medicinske opreme
                </h3>
              }
            >
              <HorizontalBarChart items={report.byOprema} colorClass="bg-rose-500" />
            </ReportSection>

            <ReportSection
              id="vapi-analiza-ocene-ai"
              pdfFilename="vapi-analiza-distribucija-ocena-ai"
              title={
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  Distribucija ocena AI
                </h3>
              }
            >
              <HorizontalBarChart
                items={report.gradeDistributionAi.map((item) => ({ label: `Ocena ${item.grade}`, count: item.count }))}
                colorClass="bg-amber-500"
              />
            </ReportSection>

            <ReportSection
              id="vapi-analiza-ocene-prof"
              pdfFilename="vapi-analiza-distribucija-ocena-profesor"
              title={
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-rose-500" />
                  Distribucija ocena profesora
                </h3>
              }
            >
              <HorizontalBarChart
                items={report.gradeDistributionProf.map((item) => ({ label: `Ocena ${item.grade}`, count: item.count }))}
                colorClass="bg-rose-500"
              />
            </ReportSection>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <ReportSection
              id="vapi-analiza-tabela-asistent"
              pdfFilename="vapi-analiza-tabela-asistent"
              className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden p-0"
              headerClassName="px-6 pt-6"
              title={<h3 className="text-lg font-bold text-gray-900">Detaljno po asistentu</h3>}
            >
              <SummaryTableContent rows={report.byAssistant} />
            </ReportSection>

            <ReportSection
              id="vapi-analiza-tabela-profesor"
              pdfFilename="vapi-analiza-tabela-profesor"
              className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden p-0"
              headerClassName="px-6 pt-6"
              title={<h3 className="text-lg font-bold text-gray-900">Detaljno po profesoru</h3>}
            >
              <SummaryTableContent rows={report.byProfesor} />
            </ReportSection>

            <ReportSection
              id="vapi-analiza-tabela-ucenik"
              pdfFilename="vapi-analiza-tabela-ucenik"
              className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden p-0"
              headerClassName="px-6 pt-6"
              title={<h3 className="text-lg font-bold text-gray-900">Detaljno po učeniku</h3>}
            >
              <SummaryTableContent rows={report.byUcenik} />
            </ReportSection>

            <ReportSection
              id="vapi-analiza-tabela-oprema"
              pdfFilename="vapi-analiza-tabela-oprema"
              className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden p-0"
              headerClassName="px-6 pt-6"
              title={<h3 className="text-lg font-bold text-gray-900">Detaljno po medicinskoj opremi</h3>}
            >
              <SummaryTableContent rows={report.byOprema} />
            </ReportSection>
          </div>
        </>
      ) : null}
    </div>
  )
}
