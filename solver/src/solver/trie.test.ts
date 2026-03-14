import { describe, it, expect } from 'vitest'
import { Trie } from './trie'

describe('Trie', () => {
  it('finds inserted words', () => {
    const trie = new Trie()
    trie.insert('STARING')
    trie.insert('STAR')
    expect(trie.hasWord('STARING')).toBe(true)
    expect(trie.hasWord('STAR')).toBe(true)
  })

  it('does not find non-inserted words', () => {
    const trie = new Trie()
    trie.insert('STAR')
    expect(trie.hasWord('STARS')).toBe(false)
    expect(trie.hasWord('STA')).toBe(false)
    expect(trie.hasWord('STARING')).toBe(false)
  })

  it('hasPrefix returns true for valid prefixes', () => {
    const trie = new Trie()
    trie.insert('STARING')
    expect(trie.hasPrefix('S')).toBe(true)
    expect(trie.hasPrefix('ST')).toBe(true)
    expect(trie.hasPrefix('STAR')).toBe(true)
    expect(trie.hasPrefix('STARING')).toBe(true)
  })

  it('hasPrefix returns false for dead-end prefixes', () => {
    const trie = new Trie()
    trie.insert('STAR')
    expect(trie.hasPrefix('SX')).toBe(false)
    expect(trie.hasPrefix('STARS')).toBe(false)
  })

  it('getNode returns the correct node', () => {
    const trie = new Trie()
    trie.insert('STAR')
    const node = trie.getNode('STA')
    expect(node).not.toBeNull()
    expect(node!.children.has('R')).toBe(true)
  })

  it('terminal flag is set only on complete words', () => {
    const trie = new Trie()
    trie.insert('STAR')
    expect(trie.getNode('STA')?.isTerminal).toBe(false)
    expect(trie.getNode('STAR')?.isTerminal).toBe(true)
  })

  it('handles empty trie', () => {
    const trie = new Trie()
    expect(trie.hasWord('A')).toBe(false)
    expect(trie.hasPrefix('A')).toBe(false)
  })
})
