import { describe, it, expect } from 'vitest'
import { solve } from './solver'
import { createEmptyBoard, savePremiumSquares } from './boardConfig'
import { Trie } from './trie'
import type { Board } from './types'

function boardWith(placements: { r: number; c: number; letter: string }[]): Board {
  const board = createEmptyBoard() as Board
  for (const { r, c, letter } of placements) {
    board[r][c] = { letter, isBlank: false }
  }
  return board
}

function makeTrie(words: string[]): Trie {
  const t = new Trie()
  words.forEach(w => t.insert(w))
  return t
}

describe('solve', () => {
  it('finds moves on an empty board', () => {
    savePremiumSquares(new Map())
    const board = createEmptyBoard() as Board
    const trie = makeTrie(['STAR', 'RATS', 'ARTS', 'TARS', 'AT', 'AR'])
    const results = solve(board, 'STAR', trie)
    expect(results.length).toBeGreaterThan(0)
    const words = results.map(m => m.word)
    expect(words).toContain('STAR')
  })

  it('results are sorted by score descending', () => {
    savePremiumSquares(new Map())
    const board = createEmptyBoard() as Board
    const trie = makeTrie(['STAR', 'RATS', 'ARTS', 'AT', 'AR', 'RAT'])
    const results = solve(board, 'STAR', trie)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score)
    }
  })

  it('returns empty array for empty rack', () => {
    const board = createEmptyBoard() as Board
    const trie = makeTrie(['STAR'])
    expect(solve(board, '', trie)).toEqual([])
  })

  it('finds a move using blank tile', () => {
    savePremiumSquares(new Map())
    const board = createEmptyBoard() as Board
    const trie = makeTrie(['CAT'])
    const results = solve(board, 'CA?', trie)
    expect(results.some(m => m.word === 'CAT')).toBe(true)
  })

  it('finds move extending left of existing tile', () => {
    savePremiumSquares(new Map())
    const board = boardWith([{ r: 7, c: 8, letter: 'S' }])
    const trie = makeTrie(['STARING', 'RING', 'STING'])
    const results = solve(board, 'TARING', trie)
    expect(results.some(m => m.word === 'STARING')).toBe(true)
  })

  it('deduplicates identical word/position from different blank assignments', () => {
    savePremiumSquares(new Map())
    const board = createEmptyBoard() as Board
    const trie = makeTrie(['CAT'])
    // Two blanks in rack — the same word at the same exact position should appear at most once
    const results = solve(board, 'CA??', trie)
    const seen = new Set<string>()
    for (const m of results) {
      const key = `${m.word}|${m.row}|${m.col}|${m.direction}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })
})
