import { describe, it, expect } from 'bun:test'
import { matchesPattern } from '../utils/permission-utils'

describe('matchesPattern', () => {
  it('returns true when pattern is exact wildcard *', () => {
    expect(matchesPattern('*', 'GET')).toBe(true)
    expect(matchesPattern('*', '/api/v1/users/123')).toBe(true)
    expect(matchesPattern('*', '')).toBe(true)
  })

  it('returns true for exact match (no wildcard)', () => {
    expect(matchesPattern('GET', 'GET')).toBe(true)
    expect(matchesPattern('/api/v1/users', '/api/v1/users')).toBe(true)
  })

  it('returns false for non-matching exact patterns', () => {
    expect(matchesPattern('GET', 'POST')).toBe(false)
    expect(matchesPattern('/api/v1/users', '/api/v1/roles')).toBe(false)
  })

  it('matches suffix wildcard: /api/v1/users/* matches subpaths', () => {
    expect(matchesPattern('/api/v1/users/*', '/api/v1/users/123')).toBe(true)
    expect(matchesPattern('/api/v1/users/*', '/api/v1/users/abc-def')).toBe(true)
  })

  it('suffix wildcard does not match the base path itself', () => {
    expect(matchesPattern('/api/v1/users/*', '/api/v1/users')).toBe(false)
  })

  it('matches action wildcard', () => {
    expect(matchesPattern('read:*', 'read:users')).toBe(true)
    expect(matchesPattern('read:*', 'read:roles')).toBe(true)
    expect(matchesPattern('read:*', 'write:users')).toBe(false)
  })

  it('matches multiple wildcards in pattern', () => {
    expect(matchesPattern('/api/*/users/*', '/api/v1/users/123')).toBe(true)
    expect(matchesPattern('/api/*/users/*', '/api/v2/users/456')).toBe(true)
    expect(matchesPattern('/api/*/users/*', '/api/v1/roles/123')).toBe(false)
  })

  it('handles regex-special characters in pattern literally', () => {
    expect(matchesPattern('/api/v1.0/users', '/api/v1.0/users')).toBe(true)
    expect(matchesPattern('/api/v1.0/users', '/api/v100/users')).toBe(false)
    expect(matchesPattern('user+admin', 'user+admin')).toBe(true)
    expect(matchesPattern('user+admin', 'useradmin')).toBe(false)
  })
})
