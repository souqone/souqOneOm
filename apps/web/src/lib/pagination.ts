/**
 * Windowed pagination helper.
 *
 * Returns an array of page numbers and '…' ellipsis markers for a windowed
 * pagination control.  Always shows the first page, the last page, and a
 * window of ±2 pages around the current page.
 *
 * Examples (currentPage / totalPages → output):
 *   1  / 10  → [1, 2, 3, '…', 10]
 *   5  / 10  → [1, '…', 3, 4, 5, 6, 7, '…', 10]
 *   10 / 10  → [1, '…', 8, 9, 10]
 */
export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount = 2,
): (number | '…')[] {
  // No need for ellipsis when total pages is small
  if (totalPages <= siblingCount * 2 + 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages)

  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < totalPages - 1

  const pages: (number | '…')[] = []

  // Always show page 1
  pages.push(1)

  if (showLeftEllipsis) {
    pages.push('…')
  } else {
    // Fill from 2 up to leftSibling
    for (let i = 2; i < leftSibling; i++) pages.push(i)
  }

  // Window around current page
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== totalPages) pages.push(i)
  }

  if (showRightEllipsis) {
    pages.push('…')
  } else {
    // Fill from rightSibling+1 up to totalPages-1
    for (let i = rightSibling + 1; i < totalPages; i++) pages.push(i)
  }

  // Always show last page
  if (totalPages > 1) pages.push(totalPages)

  return pages
}
