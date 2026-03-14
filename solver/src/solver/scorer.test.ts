import { describe, it, expect, beforeEach } from 'vitest'
import { scoreMove } from './scorer'
import { savePremiumSquares, createEmptyBoard, BINGO_BONUS } from './boardConfig'
import { Trie } from './trie'
import type { Board, Move, TilePlacement } from './types'

function makeBoard(placements: { r: number; c: number; letter: string }[] = []): Board {
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

function move(word: string, row: number, col: number, dir: 'across' | 'down', placements: TilePlacement[]): Move {
  return { word, row, col, direction: dir, score: 0, placements, crossWords: [] }
}

function tile(col: number, row: number, letter: string, isBlank = false): TilePlacement {
  return { row, col, tile: { letter, isBlank } }
}

beforeEach(() => {
  // Clear premium squares for a clean baseline
  savePremiumSquares(new Map())
})

describe('scorer', () => {
  it('scores a plain word with no bonuses', () => {
    const board = makeBoard()
    const trie = makeTrie(['CAT'])
    // C=3, A=1, T=1 → 5
    const m = move('CAT', 7, 7, 'across', [
      tile(7, 7, 'C'), tile(8, 7, 'A'), tile(9, 7, 'T'),
    ])
    expect(scoreMove(board, m, trie)).toBe(5)
  })

  it('blank tile contributes 0 to score', () => {
    const board = makeBoard()
    const trie = makeTrie(['CAT'])
    // C=3, A=1, T=0 (blank) → 4
    const m = move('CAT', 7, 7, 'across', [
      tile(7, 7, 'C'), tile(8, 7, 'A'), tile(9, 7, 'T', true),
    ])
    expect(scoreMove(board, m, trie)).toBe(4)
  })

  it('applies DL (double letter) bonus to newly placed tile', () => {
    // Put a DL square at (7,8)
    savePremiumSquares(new Map([['7,8', 'DL']]))
    const board = makeBoard()
    const trie = makeTrie(['CAT'])
    // C=3, A(DL)=1×2=2, T=1 → 6
    const m = move('CAT', 7, 7, 'across', [
      tile(7, 7, 'C'), tile(8, 7, 'A'), tile(9, 7, 'T'),
    ])
    expect(scoreMove(board, m, trie)).toBe(6)
  })

  it('applies TL (triple letter) bonus', () => {
    savePremiumSquares(new Map([['7,7', 'TL']]))
    const board = makeBoard()
    const trie = makeTrie(['CAT'])
    // C(TL)=3×3=9, A=1, T=1 → 11
    const m = move('CAT', 7, 7, 'across', [
      tile(7, 7, 'C'), tile(8, 7, 'A'), tile(9, 7, 'T'),
    ])
    expect(scoreMove(board, m, trie)).toBe(11)
  })

  it('applies DW (double word) bonus', () => {
    savePremiumSquares(new Map([['7,8', 'DW']]))
    const board = makeBoard()
    const trie = makeTrie(['CAT'])
    // (C=3 + A=1 + T=1) × 2 = 10
    const m = move('CAT', 7, 7, 'across', [
      tile(7, 7, 'C'), tile(8, 7, 'A'), tile(9, 7, 'T'),
    ])
    expect(scoreMove(board, m, trie)).toBe(10)
  })

  it('applies TW (triple word) bonus on non-center square', () => {
    savePremiumSquares(new Map([['7,8', 'TW']]))
    const board = makeBoard()
    const trie = makeTrie(['CAT'])
    // C=3, A(TW)=1 → wordMult×3, T=1 → (3+1+1)×3 = 15
    const m = move('CAT', 7, 7, 'across', [
      tile(7, 7, 'C'), tile(8, 7, 'A'), tile(9, 7, 'T'),
    ])
    expect(scoreMove(board, m, trie)).toBe(15)
  })

  it('center square has NO word multiplier (Crossplay rule)', () => {
    // Even if center were marked DW, Crossplay does not apply it
    // Center is at (7,7) — mark it DW and verify no bonus applied
    savePremiumSquares(new Map([['7,7', 'DW']]))
    const board = makeBoard()
    const trie = makeTrie(['CAT'])
    const m = move('CAT', 7, 7, 'across', [
      tile(7, 7, 'C'), tile(8, 7, 'A'), tile(9, 7, 'T'),
    ])
    // C at center = no multiplier, A=1, T=1 → 5 (not 10)
    expect(scoreMove(board, m, trie)).toBe(5)
  })

  it('bonus squares only apply to newly placed tiles', () => {
    savePremiumSquares(new Map([['7,7', 'DW']]))
    // Board already has C at (7,7) — placing A, T onto existing board
    const board = makeBoard([{ r: 7, c: 7, letter: 'C' }])
    const trie = makeTrie(['CAT'])
    const m = move('CAT', 7, 7, 'across', [
      tile(8, 7, 'A'), tile(9, 7, 'T'), // C is already on board, not in placements
    ])
    // C already placed (no bonus), A=1, T=1 → 5, DW on (7,7) not triggered (tile already there)
    expect(scoreMove(board, m, trie)).toBe(5)
  })

  it('bingo bonus: +40 when all 7 tiles are played', () => {
    const board = makeBoard()
    const trie = makeTrie(['PLAYING'])
    // P=3,L=2,A=1,Y=4,I=1,N=1,G=4 = 16 + BINGO_BONUS(40) = 56
    const m = move('PLAYING', 7, 7, 'across', [
      tile(7, 7, 'P'), tile(8, 7, 'L'), tile(9, 7, 'A'),
      tile(10, 7, 'Y'), tile(11, 7, 'I'), tile(12, 7, 'N'), tile(13, 7, 'G'),
    ])
    expect(scoreMove(board, m, trie)).toBe(16 + BINGO_BONUS)
  })
})
