'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo } from 'lucide-react'

interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  rows?: number
  className?: string
}

export default function SimpleEditor({ 
  value, 
  onChange, 
  disabled = false, 
  placeholder = '',
  className = ''
}: SimpleEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const savedSelectionRef = useRef<Range | null>(null)

  // Sačuvaj selekciju pre nego što fokus ode sa editora
  const saveSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange()
    }
  }, [])

  // Vrati sačuvanu selekciju
  const restoreSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && savedSelectionRef.current) {
      selection.removeAllRanges()
      selection.addRange(savedSelectionRef.current)
    }
  }, [])

  const execCommand = useCallback((command: string, commandValue?: string) => {
    // Vrati fokus na editor i selekciju
    if (editorRef.current) {
      editorRef.current.focus()
      restoreSelection()
    }
    
    // Izvrši komandu
    document.execCommand(command, false, commandValue)
    
    // Ažuriraj parent sa novim sadržajem
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange, restoreSelection])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  // Sačuvaj selekciju na svaku promenu
  const handleSelect = useCallback(() => {
    saveSelection()
  }, [saveSelection])

  const handleMouseUp = useCallback(() => {
    saveSelection()
  }, [saveSelection])

  const handleKeyUp = useCallback(() => {
    saveSelection()
  }, [saveSelection])

  // Toolbar dugme koje čuva selekciju pre klika
  const ToolbarButton = ({ 
    onAction, 
    icon: Icon, 
    title 
  }: { 
    onAction: () => void
    icon: React.ElementType
    title: string
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault() // Spreči gubitak fokusa
        saveSelection()
      }}
      onClick={(e) => {
        e.preventDefault()
        onAction()
      }}
      disabled={disabled}
      title={title}
      className="p-1.5 rounded transition-colors hover:bg-amber-100 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="w-4 h-4" />
    </button>
  )

  return (
    <div className={`border rounded-xl overflow-hidden ${
      isFocused ? 'ring-2 ring-amber-500 border-transparent' : 'border-amber-200'
    } ${disabled ? 'bg-gray-100' : 'bg-white'} ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-amber-50 border-b border-amber-200">
        <ToolbarButton 
          onAction={() => execCommand('bold')} 
          icon={Bold} 
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton 
          onAction={() => execCommand('italic')} 
          icon={Italic} 
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton 
          onAction={() => execCommand('underline')} 
          icon={Underline} 
          title="Underline (Ctrl+U)"
        />
        
        <div className="w-px h-5 bg-amber-200 mx-1" />
        
        <ToolbarButton 
          onAction={() => execCommand('insertUnorderedList')} 
          icon={List} 
          title="Bullet lista"
        />
        <ToolbarButton 
          onAction={() => execCommand('insertOrderedList')} 
          icon={ListOrdered} 
          title="Numerisana lista"
        />
        
        <div className="w-px h-5 bg-amber-200 mx-1" />
        
        <ToolbarButton 
          onAction={() => execCommand('undo')} 
          icon={Undo} 
          title="Undo (Ctrl+Z)"
        />
        <ToolbarButton 
          onAction={() => execCommand('redo')} 
          icon={Redo} 
          title="Redo (Ctrl+Y)"
        />
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={handlePaste}
        onSelect={handleSelect}
        onMouseUp={handleMouseUp}
        onKeyUp={handleKeyUp}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        className={`min-h-[120px] px-4 py-2.5 text-sm text-gray-900 outline-none ${
          disabled ? 'cursor-not-allowed' : ''
        } [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400`}
        style={{ 
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
      />
    </div>
  )
}
