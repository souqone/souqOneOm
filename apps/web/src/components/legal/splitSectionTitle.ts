export interface SplitTitleResult {
  number?: string;
  text: string;
}

/**
 * Splits a section title that starts with "1. ", "2. ", etc. into its numeric prefix
 * and text body. If no numeric prefix is found, returns the original title as text.
 * Pattern: /^(\d+)\.\s*(.*)$/
 */
export function splitSectionTitle(title: string): SplitTitleResult {
  if (!title) return { text: '' };
  const match = title.match(/^(\d+)\.\s*(.*)$/);
  if (match) {
    return {
      number: match[1],
      text: match[2],
    };
  }
  return {
    text: title,
  };
}
