/**
 * "Monday, 23 March 2025"
 */
export function formatDateLong(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

/**
 * "23 Mar 2025"
 */
export function formatDateShort(date) {
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
