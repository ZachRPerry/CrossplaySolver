import { describe, it, expect } from 'vitest'
import { getCrossChecks } from './crossChecks'
import { createEmptyBoard } from './boardConfig'
import { Trie } from './trie'
import type { Board } from './types'

function boardWith(placements: { r: number; c: number; letter: string }[]): Board {
  const board = createEmptyBoard() as Board
  for (const { r, c, letter } of placements) {
    board[r][c] = { letter, isBlank: false }
  }
  return board
}

function makeTrieWith(words: string[]): Trie {
  const trie = new Trie()
  for (const w of words) trie.insert(w)
  return trie
}

describe('getCrossChecks', () => {
  it('no perpendicular tiles → all letters valid', () => {
    const board = createEmptyBoard() as Board
    const trie = makeTrieWith(['STAR'])
    const checks = getCrossChecks(board, trie)
    const set = checks.get('7,7,across')!
    expect(set.size).toBe(26)
  })

  it('constrained by tiles above/below for across play', () => {
    // Place 'S' above and 'T' below row 7, col 7
    // Valid letters at (7,7) for across play: letter L where SLT is a word
    const trie = makeTrieWith(['SLT', 'SAT', 'SET'])
    const board = boardWith([
      { r: 6, c: 7, letter: 'S' },
      { r: 8, c: 7, letter: 'T' },
    ])
    const checks = getCrossChecks(board, trie)
    const valid = checks.get('7,7,across')!
    expect(valid.has('A')).toBe(true)  // SAT is a word
    expect(valid.has('E')).toBe(true)  // SET is a word
    expect(valid.has('L')).toBe(true)  // SLT is a word
    expect(valid.has('Z')).toBe(false) // SZT is not
  })

  it('constrained by tiles left/right for down play', () => {
    const trie = makeTrieWith(['CAT', 'COT'])
    const board = boardWith([
      { r: 7, c: 6, letter: 'C' },
      { r: 7, c: 8, letter: 'T' },
    ])
    const checks = getCrossChecks(board, trie)
    const valid = checks.get('7,7,down')!
    expect(valid.has('A')).toBe(true)  // CAT
    expect(valid.has('O')).toBe(true)  // COT
    expect(valid.has('Z')).toBe(false) // CZT not a word
  })
})
