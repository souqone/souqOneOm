import React from 'react';

interface InlineToken {
  type: 'text' | 'email' | 'url';
  value: string;
}

/**
 * Tokenizes a string of text into plain text, mailto email links, and https URLs.
 * Isolates emails within <bdi dir="ltr"> to prevent trailing punctuation (like '.' or '،')
 * from jumping across RTL text boundaries.
 */
function tokenizeInlineText(str: string): InlineToken[] {
  // Matches emails or http(s) URLs
  const pattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(https?:\/\/[^\s<]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const tokens: InlineToken[] = [];

  while ((match = pattern.exec(str)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: str.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // Email matched: trailing punctuation is automatically excluded because TLD is letters only
      tokens.push({ type: 'email', value: match[1] });
      lastIndex = pattern.lastIndex;
    } else if (match[2]) {
      // URL matched: strip any trailing punctuation marks such as . , : ; ، ! ? )
      let url = match[2];
      let trailingPunct = '';
      const punctMatch = url.match(/[.,:;،!?)]+$/);
      if (punctMatch) {
        trailingPunct = punctMatch[0];
        url = url.slice(0, -trailingPunct.length);
      }
      tokens.push({ type: 'url', value: url });
      if (trailingPunct) {
        tokens.push({ type: 'text', value: trailingPunct });
      }
      lastIndex = pattern.lastIndex;
    }
  }

  if (lastIndex < str.length) {
    tokens.push({ type: 'text', value: str.slice(lastIndex) });
  }

  return tokens;
}

function renderInline(tokens: InlineToken[], keyPrefix: string): React.ReactNode {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.type === 'email') {
      return (
        <a
          key={key}
          href={`mailto:${token.value}`}
          className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-primary/40 rounded px-0.5 transition-colors"
        >
          <bdi dir="ltr">{token.value}</bdi>
        </a>
      );
    }

    if (token.type === 'url') {
      return (
        <a
          key={key}
          href={token.value}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-primary/40 rounded px-0.5 transition-colors"
        >
          <bdi dir="ltr">{token.value}</bdi>
        </a>
      );
    }

    return <React.Fragment key={key}>{token.value}</React.Fragment>;
  });
}

type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

/**
 * Parses raw legal content text into semantic paragraph and bullet list blocks.
 * Consecutive lines starting with "- " are merged into an unordered list.
 * Lines not starting with "- " are treated as paragraphs.
 */
function parseLegalBlocks(text: string): ContentBlock[] {
  if (!text || !text.trim()) return [];

  const rawLines = text.split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  let currentList: string[] | null = null;

  function flushList() {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: 'list', items: currentList });
      currentList = null;
    }
  }

  for (const line of rawLines) {
    const trimmed = line.trim();

    if (!trimmed) {
      // Empty line closes the active list
      flushList();
      continue;
    }

    if (trimmed.startsWith('- ')) {
      // List item
      const itemText = trimmed.slice(2).trim();
      if (!currentList) {
        currentList = [];
      }
      currentList.push(itemText);
    } else {
      // Non-bullet line is a paragraph
      flushList();
      blocks.push({ type: 'paragraph', text: trimmed });
    }
  }

  flushList();
  return blocks;
}

export interface RenderLegalContentOptions {
  className?: string;
}

/**
 * Pure function to render legal text with semantic <p> and <ul>/<li> elements,
 * custom primary bullets, logical hanging indent (ps-*), relaxed line-height (1.85 ar / 1.75 en),
 * reading column width constraint (max-w-prose), and interactive mailto/URL links.
 */
export function renderLegalContent(
  text: string,
  locale: 'ar' | 'en' = 'ar',
  options?: RenderLegalContentOptions
): React.ReactNode {
  if (!text || !text.trim()) {
    return null;
  }

  const isArabic = locale === 'ar';
  const leadingClass = isArabic ? 'leading-[1.85]' : 'leading-[1.75]';
  const blocks = parseLegalBlocks(text);

  return (
    <div
      className={`max-w-prose space-y-3.5 text-on-surface-variant ${options?.className || ''}`.trim()}
    >
      {blocks.map((block, blockIndex) => {
        if (block.type === 'paragraph') {
          const tokens = tokenizeInlineText(block.text);
          return (
            <p key={`p-${blockIndex}`} className={`${leadingClass} text-[14.5px] sm:text-[15px]`}>
              {renderInline(tokens, `p-${blockIndex}`)}
            </p>
          );
        }

        if (block.type === 'list') {
          return (
            <ul
              key={`ul-${blockIndex}`}
              className={`space-y-2 my-3 ps-5 ms-1 list-disc marker:text-primary ${leadingClass} text-[14.5px] sm:text-[15px]`}
            >
              {block.items.map((item, itemIndex) => {
                const tokens = tokenizeInlineText(item);
                return (
                  <li key={`li-${blockIndex}-${itemIndex}`} className="ps-1">
                    {renderInline(tokens, `li-${blockIndex}-${itemIndex}`)}
                  </li>
                );
              })}
            </ul>
          );
        }

        return null;
      })}
    </div>
  );
}
