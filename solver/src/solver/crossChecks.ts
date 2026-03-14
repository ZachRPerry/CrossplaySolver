import type { Board, Direction } from './types'
import type { Trie } from './trie'
import { BOARD_SIZE } from './boardConfig'

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Returns a map of 'row,col,direction' → Set of valid letters that can be placed there
// considering the perpendicular direction constraint.
export function getCrossChecks(
  board: Board,
  trie: Trie
): Map<string, Set<string>> {
  const checks = new Map<string, Set<string>>()

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) continue

      // Cross-check for an 'across' play: constrained by tiles above/below (down direction)
      checks.set(`${r},${c},across`, getValidLetters(board, r, c, 'down', trie))

      // Cross-check for a 'down' play: constrained by tiles left/right (across direction)
      checks.set(`${r},${c},down`, getValidLetters(board, r, c, 'across', trie))
    }
  }

  return checks
}

function getValidLetters(
  board: Board,
  row: number,
  col: number,
  perpDir: Direction,
  trie: Trie
): Set<string> {
  const [before, after] = getPerpendicularNeighbors(board, row, col, perpDir)

  // No perpendicular tiles → all letters are valid (no constraint)
  if (before.length === 0 && after.length === 0) {
    return new Set(ALL_LETTERS)
  }

  // Only letters that form a valid word when inserted between before and after
  const valid = new Set<string>()
  for (const letter of ALL_LETTERS) {
    const word = before + letter + after
    if (trie.hasWord(word)) {
      valid.add(letter)
    }
  }
  return valid
}

// Returns [tilesBefore, tilesAfter] in the perpendicular direction around (row, col)
function getPerpendicularNeighbors(
  board: Board,
  row: number,
  col: number,
  perpDir: Direction
): [string, string] {
  const before: string[] = []
  const after: string[] = []

  if (perpDir === 'down') {
    // Tiles above
    for (let r = row - 1; r >= 0 && board[r][col] !== null; r--) {
      before.unshift(board[r][col]!.letter)
    }
    // Tiles below
    for (let r = row + 1; r < BOARD_SIZE && board[r][col] !== null; r++) {
      after.push(board[r][col]!.letter)
    }
  } else {
    // Tiles to the left
    for (let c = col - 1; c >= 0 && board[row][c] !== null; c--) {
      before.unshift(board[row][c]!.letter)
    }
    // Tiles to the right
    for (let c = col + 1; c < BOARD_SIZE && board[row][c] !== null; c++) {
      after.push(board[row][c]!.letter)
    }
  }

  return [before.join(''), after.join('')]
}
