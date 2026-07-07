function formatMessageRole(role: string): string {
  const normalized = role.toLowerCase()
  if (normalized === 'user') return 'Korisnik'
  if (normalized === 'assistant' || normalized === 'bot') return 'Asistent'
  if (normalized === 'system') return 'Sistem'
  return role
}

function getMessageText(record: Record<string, unknown>): string {
  if (typeof record.message === 'string') return record.message.trim()
  if (typeof record.content === 'string') return record.content.trim()
  if (typeof record.text === 'string') return record.text.trim()
  if (typeof record.transcript === 'string') return record.transcript.trim()
  return ''
}

function formatMessagesToDialog(messages: unknown[]): string {
  return messages
    .map((msg) => {
      if (!msg || typeof msg !== 'object') return ''
      const record = msg as Record<string, unknown>
      const role = formatMessageRole(typeof record.role === 'string' ? record.role : 'unknown')
      const text = getMessageText(record)
      return text ? `${role}: ${text}` : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function normalizeTranscriptString(transcript: string): string {
  return transcript
    .replace(/^AI:/gim, 'Asistent:')
    .replace(/^User:/gim, 'Korisnik:')
    .replace(/^Bot:/gim, 'Asistent:')
    .replace(/^Assistant:/gim, 'Asistent:')
    .trim()
}

function getArtifact(report: Record<string, unknown>): Record<string, unknown> | null {
  const artifact = report.artifact
  if (artifact && typeof artifact === 'object') {
    return artifact as Record<string, unknown>
  }
  return null
}

export function extractVapiCallDialog(report: Record<string, unknown>): string {
  const artifact = getArtifact(report)

  if (artifact?.messages && Array.isArray(artifact.messages)) {
    const dialog = formatMessagesToDialog(artifact.messages)
    if (dialog) return dialog
  }

  if (Array.isArray(report.messages)) {
    const dialog = formatMessagesToDialog(report.messages)
    if (dialog) return dialog
  }

  if (artifact && typeof artifact.transcript === 'string' && artifact.transcript.trim()) {
    return normalizeTranscriptString(artifact.transcript)
  }

  if (typeof report.transcript === 'string' && report.transcript.trim()) {
    return normalizeTranscriptString(report.transcript)
  }

  return ''
}

export function extractVapiCallSummary(report: Record<string, unknown>): string | null {
  const artifact = getArtifact(report)

  if (artifact && typeof artifact.summary === 'string' && artifact.summary.trim()) {
    return artifact.summary.trim()
  }

  if (typeof report.summary === 'string' && report.summary.trim()) {
    return report.summary.trim()
  }

  return null
}
