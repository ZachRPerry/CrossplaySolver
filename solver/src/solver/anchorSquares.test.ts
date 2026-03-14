import { describe, it, expect } from 'vitest'
import { getAnchorSquares } from './anchorSquares'
import { createEmptyBoard } from './boardConfig'
import type { Board } from './types'

function boardWith(placements: { r: number; c: number; letter: string }[]): Board {
  const board = createEmptyBoard() as Board
  for (const { r, c, letter } of placements) {
    board[r][c] = { letter, isBlank: false }
  }
  return board
}

describe('getAnchorSquares', () => {
  it('empty board → only center square (7,7)', () => {
    const anchors = getAnchorSquares(createEmptyBoard() as Board)
    expect(anchors.size).toBe(1)
    expect(anchors.has('7,7')).toBe(true)
  })

  it('single tile → all 4 adjacent empty squares are anchors', () => {
    const board = boardWith([{ r: 7, c: 7, letter: 'A' }])
    const anchors = getAnchorSquares(board)
    expect(anchors.has('6,7')).toBe(true)
    expect(anchors.has('8,7')).toBe(true)
    expect(anchors.has('7,6')).toBe(true)
    expect(anchors.has('7,8')).toBe(true)
    expect(anchors.has('7,7')).toBe(false) // occupied, not an anchor
  })

  it('placed tile is not itself an anchor', () => {
    const board = boardWith([{ r: 7, c: 7, letter: 'A' }])
    const anchors = getAnchorSquares(board)
    expect(anchors.has('7,7')).toBe(false)
  })

  it('does not include squares not adjacent to any tile', () => {
    const board = boardWith([{ r: 7, c: 7, letter: 'A' }])
    const anchors = getAnchorSquares(board)
    expect(anchors.has('0,0')).toBe(false)
    expect(anchors.has('14,14')).toBe(false)
  })
})
