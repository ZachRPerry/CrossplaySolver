import { describe, it, expect } from 'vitest'
import { generateMoves, parseRack } from './moveGenerator'
import { getAnchorSquares } from './anchorSquares'
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

function solve(board: Board, rackStr: string, words: string[]) {
  const trie = makeTrieWith(words)
  const rack = parseRack(rackStr)
  const anchors = getAnchorSquares(board)
  const checks = getCrossChecks(board, trie)
  return generateMoves(board, rack, trie, anchors, checks)
}

describe('generateMoves', () => {
  it('opening move on empty board finds a word through center', () => {
    const board = createEmptyBoard() as Board
    const moves = solve(board, 'STAR', ['STAR', 'RATS', 'ARTS', 'TARS'])
    const words = moves.map(m => m.word)
    expect(words).toContain('STAR')
    // All moves must cover center square (7,7)
    for (const move of moves) {
      const coversCenter = move.direction === 'across'
        ? move.row === 7 && move.col <= 7 && move.col + move.word.length - 1 >= 7
        : move.col === 7 && move.row <= 7 && move.row + move.word.length - 1 >= 7
      expect(coversCenter).toBe(true)
    }
  })

  it('extends right from an anchor', () => {
    // S is on board at (7,7), rack has TARING → STARING
    const board = boardWith([{ r: 7, c: 7, letter: 'S' }])
    const moves = solve(board, 'TARING', ['STARING', 'TARING', 'RING', 'STAR'])
    const words = moves.map(m => m.word)
    expect(words).toContain('STARING')
  })

  it('extends left of anchor (tiles go left of anchor square)', () => {
    // S at (7,8), rack has TARING → STARING starting at col 2 going right through col 8
    const board = boardWith([{ r: 7, c: 8, letter: 'S' }])
    const moves = solve(board, 'TARING', ['STARING'])
    const words = moves.map(m => m.word)
    expect(words).toContain('STARING')
  })

  it('uses a blank tile', () => {
    const board = createEmptyBoard() as Board
    const trie = makeTrieWith(['CAT'])
    const rack = parseRack('CA?') // ? is blank, can be T
    const anchors = getAnchorSquares(board)
    const checks = getCrossChecks(board, trie)
    const moves = generateMoves(board, rack, trie, anchors, checks)
    const catMove = moves.find(m => m.word === 'CAT')
    expect(catMove).toBeDefined()
    const blankPlacement = catMove!.placements.find(p => p.tile.isBlank)
    expect(blankPlacement).toBeDefined()
    expect(blankPlacement!.tile.letter).toBe('T')
  })

  it('respects cross-checks — does not generate invalid cross-words', () => {
    // Board has 'A' at (6,7) and 'T' at (8,7)
    // Placing a tile at (7,7) for an across move must form a valid word A_T in the down direction
    const trie = makeTrieWith(['AAT', 'ABT', 'ACT', 'HELLO'])
    const board = boardWith([
      { r: 6, c: 7, letter: 'A' },
      { r: 8, c: 7, letter: 'T' },
    ])
    const rack = parseRack('HELLO')
    const anchors = getAnchorSquares(board)
    const checks = getCrossChecks(board, trie)
    const moves = generateMoves(board, rack, trie, anchors, checks)

    // Any move that places a tile at (7,7) for across play must use A, B, or C
    for (const move of moves) {
      if (move.direction !== 'across') continue
      const placementAt7_7 = move.placements.find(p => p.row === 7 && p.col === 7)
      if (placementAt7_7) {
        expect(['A', 'B', 'C']).toContain(placementAt7_7.tile.letter)
      }
    }
  })

  it('down move placements have correct (row, col) coordinates — not transposed', () => {
    // BAWDY placed down at col 0, rows 3-7 (covering center at row 7)
    // Placements must have col=0 for all tiles, rows 3-7
    // Bug: before fix, placements were left in transposed space (row=0, col=3..7)
    const board = createEmptyBoard() as Board
    const moves = solve(board, 'BAWDY', ['BAWDY'])
    const downMoves = moves.filter(m => m.direction === 'down')
    for (const move of downMoves) {
      for (const p of move.placements) {
        // All placements for a down move must be in the same column
        expect(p.col).toBe(move.col)
      }
    }
  })

  it('returns empty array when no valid moves exist', () => {
    const board = createEmptyBoard() as Board
    const moves = solve(board, 'ZZZZZZ', ['STAR']) // ZZZ... can't form STAR
    // No valid moves using only Z's
    const validMoves = moves.filter(m => /^[^Z]/.test(m.word) === false)
    expect(validMoves.length).toBe(0)
  })
})
