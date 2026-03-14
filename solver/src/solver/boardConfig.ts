import type { SquareType } from './types'

export const BOARD_SIZE = 15
export const CENTER = { row: 7, col: 7 }
export const BINGO_BONUS = 40

// Crossplay (NYT) tile values
export const TILE_VALUES: Record<string, number> = {
  A: 1, B: 4, C: 3, D: 2, E: 1, F: 4, G: 4, H: 3,
  I: 1, J: 10, K: 5, L: 2, M: 3, N: 1, O: 1, P: 3,
  Q: 10, R: 1, S: 1, T: 1, U: 2, V: 6, W: 5, X: 8,
  Y: 4, Z: 10, '?': 0,
}

// Crossplay premium square layout (verified from real screenshot, 2026-03-13)
// 20×DL, 20×TL, 8×DW, 8×TW = 56 total. Format: 'row,col' → SquareType (0-indexed)
const DEFAULT_PREMIUM_SQUARES: [string, SquareType][] = [
  // Double Letter (DL) — 20 squares
  ['0,7','DL'], ['5,7','DL'], ['9,7','DL'], ['14,7','DL'],
  ['7,0','DL'], ['7,5','DL'], ['7,9','DL'], ['7,14','DL'],
  ['2,4','DL'], ['3,3','DL'], ['4,2','DL'],
  ['2,10','DL'], ['3,11','DL'], ['4,12','DL'],
  ['10,2','DL'], ['11,3','DL'], ['12,4','DL'],
  ['10,12','DL'], ['11,11','DL'], ['12,10','DL'],
  // Triple Letter (TL) — 20 squares
  ['0,0','TL'], ['0,14','TL'], ['14,0','TL'], ['14,14','TL'],
  ['1,6','TL'], ['1,8','TL'],
  ['6,1','TL'], ['8,1','TL'],
  ['6,13','TL'], ['8,13','TL'],
  ['13,6','TL'], ['13,8','TL'],
  ['4,5','TL'], ['5,4','TL'], ['9,4','TL'], ['10,5','TL'],
  ['4,9','TL'], ['5,10','TL'], ['9,10','TL'], ['10,9','TL'],
  // Double Word (DW) — 8 squares
  ['1,1','DW'], ['1,13','DW'], ['13,1','DW'], ['13,13','DW'],
  ['3,7','DW'], ['11,7','DW'], ['7,3','DW'], ['7,11','DW'],
  // Triple Word (TW) — 8 squares
  ['0,3','TW'], ['0,11','TW'], ['14,3','TW'], ['14,11','TW'],
  ['3,0','TW'], ['11,0','TW'], ['3,14','TW'], ['11,14','TW'],
]

let runtimePremiumSquares: Map<string, SquareType> | null = null

function localStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null
  } catch {
    return false
  }
}

function loadPremiumSquares(): Map<string, SquareType> {
  if (localStorageAvailable()) {
    const stored = localStorage.getItem('crossplay_premium_squares')
    if (stored) {
      const entries = JSON.parse(stored) as [string, SquareType][]
      return new Map(entries)
    }
  }
  // Fall back to hardcoded default layout
  return new Map(DEFAULT_PREMIUM_SQUARES)
}

export function getPremiumSquares(): Map<string, SquareType> {
  if (!runtimePremiumSquares) {
    runtimePremiumSquares = loadPremiumSquares()
  }
  return runtimePremiumSquares
}

// Sets in-memory value only — use persistPremiumSquares() to also save to localStorage
export function savePremiumSquares(squares: Map<string, SquareType>): void {
  runtimePremiumSquares = squares
}

// Saves to localStorage (browser only — not available in test environment)
export function persistPremiumSquares(squares: Map<string, SquareType>): void {
  savePremiumSquares(squares)
  if (localStorageAvailable()) {
    localStorage.setItem(
      'crossplay_premium_squares',
      JSON.stringify([...squares.entries()])
    )
  }
}

export function getSquareType(row: number, col: number): SquareType | null {
  return getPremiumSquares().get(`${row},${col}`) ?? null
}

export function createEmptyBoard(): (null)[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null))
}
