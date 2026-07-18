'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export type SearchableOption = { value: string; label: string }

interface SearchableSelectProps {
  value: string
  onChange: (next: string) => void
  options: SearchableOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

// Jednostavan searchable dropdown bez spoljne zavisnosti (Tailwind friendly).
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((o) => o.label.toLowerCase().includes(term))
  }, [options, query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayValue = open ? query : selected?.label || ''

  const handleSelect = (next: string) => {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 ${
          disabled ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-gray-200 bg-white'
        }`}
      >
        <input
          value={displayValue}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (disabled) return
            setOpen(true)
            setQuery('')
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm placeholder:text-gray-400 focus:outline-none"
        />
        {selected && !disabled && (
          <button
            type="button"
            onClick={() => handleSelect('')}
            className="text-gray-400 transition hover:text-gray-600"
            aria-label="Obriši izbor"
          >
            ×
          </button>
        )}
      </div>
      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Nema rezultata</div>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(option.value)
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-amber-50 ${
                  option.value === value ? 'bg-amber-50 font-semibold text-gray-900' : 'text-gray-700'
                }`}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <span className="text-xs font-semibold text-amber-600">izabrano</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
