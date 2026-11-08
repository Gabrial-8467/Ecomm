import type { ReactNode } from 'react'

type Block =
  | { kind: 'heading'; level: 2 | 3 | 4; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }

/**
 * Minimal, dependency-free renderer for counsel-authored legal copy. It handles
 * headings, ordered/unordered lists and paragraphs only, and always renders
 * text nodes — no HTML is injected.
 */
function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', text: paragraph.join(' ') })
      paragraph = []
    }
  }

  const flushList = () => {
    if (list) {
      blocks.push({ kind: 'list', ordered: list.ordered, items: list.items })
      list = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (trimmed === '') {
      flushParagraph()
      flushList()
      continue
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed)
    if (heading) {
      flushParagraph()
      flushList()
      const level = Math.min(4, Math.max(2, heading[1]?.length ?? 2)) as 2 | 3 | 4
      blocks.push({ kind: 'heading', level, text: heading[2] ?? '' })
      continue
    }

    const unordered = /^[-*]\s+(.*)$/.exec(trimmed)
    const ordered = /^\d+[.)]\s+(.*)$/.exec(trimmed)
    if (unordered || ordered) {
      flushParagraph()
      const isOrdered = Boolean(ordered)
      if (list && list.ordered !== isOrdered) flushList()
      list ??= { ordered: isOrdered, items: [] }
      list.items.push((unordered?.[1] ?? ordered?.[1] ?? '').trim())
      continue
    }

    flushList()
    paragraph.push(trimmed)
  }

  flushParagraph()
  flushList()

  return blocks
}

export function LegalContent({ content }: { content: string }) {
  const blocks = parseBlocks(content)
  const nodes: ReactNode[] = []

  blocks.forEach((block, index) => {
    if (block.kind === 'heading') {
      if (block.level === 2) {
        nodes.push(
          <h2 key={index} className="mt-8 font-display text-xl font-semibold first:mt-0">
            {block.text}
          </h2>,
        )
      } else if (block.level === 3) {
        nodes.push(
          <h3 key={index} className="mt-6 font-display text-lg font-semibold first:mt-0">
            {block.text}
          </h3>,
        )
      } else {
        nodes.push(
          <h4 key={index} className="mt-5 text-base font-semibold first:mt-0">
            {block.text}
          </h4>,
        )
      }
      return
    }

    if (block.kind === 'paragraph') {
      nodes.push(
        <p key={index} className="mt-4 text-sm leading-7 text-muted-foreground first:mt-0">
          {block.text}
        </p>,
      )
      return
    }

    if (block.ordered) {
      nodes.push(
        <ol
          key={index}
          className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-muted-foreground"
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>,
      )
    } else {
      nodes.push(
        <ul
          key={index}
          className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground"
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>,
      )
    }
  })

  return <div>{nodes}</div>
}
