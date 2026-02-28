/**
 * Match a stored permission pattern against a runtime value.
 * `*` in the pattern matches any sequence of characters (including `/`).
 * Examples:
 *   matchesPattern('/api/v1/users/*', '/api/v1/users/123') → true
 *   matchesPattern('*', 'GET') → true
 *   matchesPattern('GET', 'POST') → false
 */
export function matchesPattern(pattern: string, value: string): boolean {
  if (pattern === '*') return true
  if (!pattern.includes('*')) return pattern === value
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  const regexStr = escaped.replace(/\*/g, '.*')
  return new RegExp(`^${regexStr}$`).test(value)
}
