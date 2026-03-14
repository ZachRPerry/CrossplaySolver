import { describe, it, expect } from 'vitest'
import { TILE_VALUES, CENTER, BOARD_SIZE, BINGO_BONUS, createEmptyBoard } from './boardConfig'

describe('boardConfig', () => {
  it('TILE_VALUES covers all letters and blank', () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    for (const letter of letters) {
      expect(TILE_VALUES[letter]).toBeTypeOf('number')
    }
    expect(TILE_VALUES['?']).toBe(0)
  })

  it('high-value tiles are correct', () => {
    expect(TILE_VALUES['Q']).toBe(10)
    expect(TILE_VALUES['Z']).toBe(10)
    expect(TILE_VALUES['J']).toBe(10)
    expect(TILE_VALUES['X']).toBe(8)
    expect(TILE_VALUES['K']).toBe(5)
    expect(TILE_VALUES['V']).toBe(6)
  })

  it('common tiles are worth 1', () => {
    for (const letter of ['A', 'E', 'I', 'O', 'N', 'R', 'S', 'T']) {
      expect(TILE_VALUES[letter]).toBe(1)
    }
  })

  it('L and U are worth 2 in Crossplay', () => {
    expect(TILE_VALUES['L']).toBe(2)
    expect(TILE_VALUES['U']).toBe(2)
  })

  it('CENTER is row 7, col 7', () => {
    expect(CENTER).toEqual({ row: 7, col: 7 })
  })

  it('BOARD_SIZE is 15', () => {
    expect(BOARD_SIZE).toBe(15)
  })

  it('BINGO_BONUS is 40', () => {
    expect(BINGO_BONUS).toBe(40)
  })

  it('createEmptyBoard returns 15x15 all-null grid', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(15)
    for (const row of board) {
      expect(row).toHaveLength(15)
      for (const cell of row) {
        expect(cell).toBeNull()
      }
    }
  })
})
