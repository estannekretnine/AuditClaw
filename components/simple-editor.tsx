'use client'

import { useState, useRef, useCallback } from 'react'
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

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    
    // Update parent with new content
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

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

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title,
    active = false 
  }: { 
    onClick: () => void
    icon: React.ElementType
    title: string
    active?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active 
          ? 'bg-amber-200 text-amber-800' 
          : 'hover:bg-amber-100 text-gray-600 hover:text-gray-800'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
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
          onClick={() => execCommand('bold')} 
          icon={Bold} 
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton 
          onClick={() => execCommand('italic')} 
          icon={Italic} 
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton 
          onClick={() => execCommand('underline')} 
          icon={Underline} 
          title="Underline (Ctrl+U)"
        />
        
        <div className="w-px h-5 bg-amber-200 mx-1" />
        
        <ToolbarButton 
          onClick={() => execCommand('insertUnorderedList')} 
          icon={List} 
          title="Bullet lista"
        />
        <ToolbarButton 
          onClick={() => execCommand('insertOrderedList')} 
          icon={ListOrdered} 
          title="Numerisana lista"
        />
        
        <div className="w-px h-5 bg-amber-200 mx-1" />
        
        <ToolbarButton 
          onClick={() => execCommand('undo')} 
          icon={Undo} 
          title="Undo (Ctrl+Z)"
        />
        <ToolbarButton 
          onClick={() => execCommand('redo')} 
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
