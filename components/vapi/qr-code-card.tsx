'use client'

interface QrCodeCardProps {
  label: string
  url: string
  online?: boolean
  studentName?: string | null
}

export function QrCodeCard({ label, url, online = false, studentName }: QrCodeCardProps) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg flex flex-col items-center text-center">
      <div className="mb-3 flex w-full items-center justify-between gap-2">
        <h3 className="text-base font-bold text-gray-900">{label}</h3>
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              online ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-gray-300'
            }`}
          />
          {online ? 'Online' : 'Čeka'}
        </span>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSrc}
        alt={`QR kod za ${label}`}
        className="h-48 w-48 rounded-2xl border border-gray-100 bg-white"
      />

      <p className="mt-3 text-xs text-gray-500 break-all line-clamp-2">{url}</p>

      {studentName ? (
        <p className="mt-2 text-sm font-semibold text-amber-700">{studentName}</p>
      ) : (
        <p className="mt-2 text-sm text-gray-400">Niko nije skenirao</p>
      )}
    </div>
  )
}
