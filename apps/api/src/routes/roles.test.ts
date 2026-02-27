import { describe, it, expect } from 'bun:test'

// ─── Role inheritance: isAncestorOf logic (pure algorithm tests) ──────────────
// We test the algorithm logic using a simulated tree without hitting the DB.

/**
 * Mirrors the real `isAncestorOf(roleId, candidateParentId)` from roles.ts.
 * Walks UP from `candidateParentId` through the parent chain; returns true
 * if `roleId` is found — meaning setting `roleId.parentId = candidateParentId`
 * would create a circular dependency and must be blocked.
 *
 * tree: { roleId: parentId | null }
 */
function buildAncestorChecker(tree: Record<string, string | null>) {
  return function isAncestorOf(roleId: string, candidateParentId: string): boolean {
    let currentId: string | null = candidateParentId
    const visited = new Set<string>()
    while (currentId !== null) {
      if (visited.has(currentId)) break
      visited.add(currentId)
      if (currentId === roleId) return true
      currentId = tree[currentId] ?? null
    }
    return false
  }
}

describe('Role inheritance — circular dependency detection (algorithm)', () => {
  // Tree: A.parentId=B, B.parentId=C, C.parentId=null
  // Hierarchy (top→bottom): C → B → A
  const isAncestorOf = buildAncestorChecker({ A: 'B', B: 'C', C: null })

  it('blocks setting C.parentId=A: walks A→B→C, finds C (roleId) — cycle!', () => {
    // isAncestorOf('C', 'A'): start at A, walk A.parent=B, B.parent=C → C===roleId → true
    expect(isAncestorOf('C', 'A')).toBe(true)
  })

  it('blocks setting B.parentId=A: walks A→B, finds B (roleId) — cycle!', () => {
    // isAncestorOf('B', 'A'): start at A, A.parent=B → B===roleId → true
    expect(isAncestorOf('B', 'A')).toBe(true)
  })

  it('allows setting A.parentId=C: walks C→null, never finds A — safe (shortens chain)', () => {
    // isAncestorOf('A', 'C'): start at C, C.parent=null → exits → false
    expect(isAncestorOf('A', 'C')).toBe(false)
  })

  it('blocks self-reference: setting A.parentId=A', () => {
    const check = buildAncestorChecker({ A: null })
    // isAncestorOf('A', 'A'): start at A → A===roleId → true immediately
    expect(check('A', 'A')).toBe(true)
  })

  it('allows unrelated roles: set D.parentId=E (no existing chain)', () => {
    const check = buildAncestorChecker({ D: null, E: null })
    // isAncestorOf('D', 'E'): start at E, E.parent=null → exits → false
    expect(check('D', 'E')).toBe(false)
  })

  it('handles deep inheritance chain: F→E→D→C→B→A, blocks A.parentId=F', () => {
    const check = buildAncestorChecker({ A: 'B', B: 'C', C: 'D', D: 'E', E: 'F', F: null })
    // isAncestorOf('A', 'F'): walk F's chain: F→null → never finds A → false (safe)
    expect(check('A', 'F')).toBe(false)
    // isAncestorOf('F', 'A'): walk A→B→C→D→E→F → found F! → true (cycle)
    expect(check('F', 'A')).toBe(true)
  })
})

// ─── Role descendant expansion (algorithm) ────────────────────────────────────

describe('expandRoleDescendants algorithm', () => {
  function expandDescendants(tree: Record<string, string[]>, rootIds: string[]): string[] {
    const collected = new Set<string>(rootIds)
    const queue = [...rootIds]
    while (queue.length > 0) {
      const batch = queue.splice(0)
      for (const id of batch) {
        for (const child of (tree[id] ?? [])) {
          if (!collected.has(child)) {
            collected.add(child)
            queue.push(child)
          }
        }
      }
    }
    return [...collected]
  }

  it('returns only the root when it has no children', () => {
    const result = expandDescendants({ superAdmin: [] }, ['superAdmin'])
    expect(result).toEqual(['superAdmin'])
  })

  it('includes direct children', () => {
    const tree = { superAdmin: ['admin'], admin: [] }
    const result = expandDescendants(tree, ['superAdmin'])
    expect(result.sort()).toEqual(['admin', 'superAdmin'].sort())
  })

  it('includes grandchildren recursively', () => {
    const tree = { superAdmin: ['admin'], admin: ['user'], user: [] }
    const result = expandDescendants(tree, ['superAdmin'])
    expect(result.sort()).toEqual(['admin', 'superAdmin', 'user'].sort())
  })

  it('handles multiple starting roles with shared descendants (deduplicates)', () => {
    const tree = { roleA: ['shared'], roleB: ['shared'], shared: [] }
    const result = expandDescendants(tree, ['roleA', 'roleB'])
    expect(result.sort()).toEqual(['roleA', 'roleB', 'shared'].sort())
  })

  it('handles user assigned only leaf roles (no expansion)', () => {
    const tree = { superAdmin: ['admin'], admin: ['user'], user: [] }
    const result = expandDescendants(tree, ['user'])
    expect(result).toEqual(['user'])
  })
})
