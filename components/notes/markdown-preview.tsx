'use client'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderInline(text: string) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

function renderMarkdown(source: string) {
  const escaped = escapeHtml(source).replace(/\r\n/g, '\n')
  const lines = escaped.split('\n')
  const blocks: string[] = []
  let inList = false
  let inCode = false
  let codeLines: string[] = []

  function closeList() {
    if (inList) {
      blocks.push('</ul>')
      inList = false
    }
  }

  function closeCode() {
    if (inCode) {
      blocks.push(`<pre><code>${codeLines.join('\n')}</code></pre>`)
      inCode = false
      codeLines = []
    }
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      closeList()
      if (inCode) {
        closeCode()
      } else {
        inCode = true
      }
      continue
    }

    if (inCode) {
      codeLines.push(line)
      continue
    }

    if (!line.trim()) {
      closeList()
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      closeList()
      const level = heading[1].length
      blocks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      continue
    }

    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      closeList()
      blocks.push(`<blockquote>${renderInline(quote[1])}</blockquote>`)
      continue
    }

    const list = line.match(/^[-*]\s+(.*)$/)
    if (list) {
      if (!inList) {
        blocks.push('<ul>')
        inList = true
      }
      blocks.push(`<li>${renderInline(list[1])}</li>`)
      continue
    }

    closeList()
    blocks.push(`<p>${renderInline(line)}</p>`)
  }

  closeList()
  closeCode()
  return blocks.join('')
}

export function MarkdownPreview({ content }: { content: string }) {
  return <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
}
