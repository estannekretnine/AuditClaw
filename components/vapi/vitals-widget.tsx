'use client'

import { AlertTriangle, Activity, Heart, Droplets } from 'lucide-react'
import type { VitalniParametri } from '@/lib/types/vapi-simulacija'

interface VitalsWidgetProps {
  vitalni: VitalniParametri
  trenutnoStanje: string
  alarm?: boolean
  alarmPoruka?: string | null
  compact?: boolean
}

export function VitalsWidget({
  vitalni,
  trenutnoStanje,
  alarm = false,
  alarmPoruka,
  compact = false,
}: VitalsWidgetProps) {
  return (
    <div
      className={`rounded-2xl border ${
        alarm
          ? 'border-red-300 bg-red-50 shadow-lg shadow-red-500/10'
          : 'border-gray-100 bg-white shadow-md'
      } ${compact ? 'p-3' : 'p-5'}`}
    >
      {alarm && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-white animate-pulse">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold">
            {alarmPoruka || 'HITAN ALARM — Pogoršanje stanja!'}
          </span>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vitalni znaci</p>
        <span
          className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
            trenutnoStanje.toLowerCase().includes('krit') ||
            trenutnoStanje.toLowerCase().includes('infarkt')
              ? 'bg-red-100 text-red-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {trenutnoStanje}
        </span>
      </div>

      <div className={`grid ${compact ? 'grid-cols-3 gap-2' : 'grid-cols-1 sm:grid-cols-3 gap-3'}`}>
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
          <div className="flex items-center gap-1.5 text-rose-600 mb-1">
            <Heart className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase">Puls</span>
          </div>
          <p className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-rose-700`}>
            {vitalni.puls}
            <span className="ml-1 text-xs font-medium text-rose-400">bpm</span>
          </p>
        </div>

        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
          <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase">Pritisak</span>
          </div>
          <p className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-indigo-700`}>
            {vitalni.pritisak}
          </p>
        </div>

        <div className="rounded-xl bg-sky-50 border border-sky-100 p-3">
          <div className="flex items-center gap-1.5 text-sky-600 mb-1">
            <Droplets className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase">SpO₂</span>
          </div>
          <p className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-sky-700`}>
            {vitalni.saturacija}
            <span className="ml-1 text-xs font-medium text-sky-400">%</span>
          </p>
        </div>
      </div>
    </div>
  )
}
