import type { Board, Move, TilePlacement } from './types'
import { TILE_VALUES, BINGO_BONUS, CENTER, BOARD_SIZE, getSquareType } from './boardConfig'
import type { Trie } from './trie'

export function scoreMove(board: Board, move: Move, _trie: Trie): number {
  const newBoard = applyPlacements(board, move.placements)
  const placedSet = new Set(move.placements.map(p => `${p.row},${p.col}`))

  let total = 0
  const crossWords: string[] = []

  // Score primary word
  total += scoreLine(move.placements, newBoard, placedSet, move.direction)

  // Score cross-words formed by each newly placed tile
  const perpDir = move.direction === 'across' ? 'down' : 'across'
  for (const placement of move.placements) {
    const crossWord = extractWord(newBoard, placement.row, placement.col, perpDir)
    if (crossWord && crossWord.length > 1) {
      const crossPlacements = [placement] // only the newly placed tile gets bonuses in the cross-word
      total += scoreLine(crossPlacements, newBoard, placedSet, perpDir, placement.row, placement.col)
      crossWords.push(crossWord)
    }
  }

  // Bingo bonus: all 7 rack tiles used
  if (move.placements.length === 7) {
    total += BINGO_BONUS
  }

  move.crossWords = crossWords
  return total
}

function scoreLine(
  placements: TilePlacement[],
  board: Board,
  newlyPlaced: Set<string>,
  direction: 'across' | 'down',
  startRow?: number,
  startCol?: number
): number {
  // Find the full extent of the word in this direction
  const { minRow, minCol, maxRow, maxCol } = getWordExtent(placements, board, direction, startRow, startCol)

  let letterSum = 0
  let wordMultiplier = 1

  if (direction === 'across') {
    for (let c = minCol; c <= maxCol; c++) {
      const tile = board[minRow][c]!
      const isNew = newlyPlaced.has(`${minRow},${c}`)
      const { letterScore, wordMult } = scoreCell(minRow, c, tile, isNew)
      letterSum += letterScore
      wordMultiplier *= wordMult
    }
  } else {
    for (let r = minRow; r <= maxRow; r++) {
      const tile = board[r][minCol]!
      const isNew = newlyPlaced.has(`${r},${minCol}`)
      const { letterScore, wordMult } = scoreCell(r, minCol, tile, isNew)
      letterSum += letterScore
      wordMultiplier *= wordMult
    }
  }

  return letterSum * wordMultiplier
}

function scoreCell(
  row: number,
  col: number,
  tile: { letter: string; isBlank: boolean },
  isNewlyPlaced: boolean
): { letterScore: number; wordMult: number } {
  const baseValue = tile.isBlank ? 0 : (TILE_VALUES[tile.letter] ?? 0)

  if (!isNewlyPlaced) {
    return { letterScore: baseValue, wordMult: 1 }
  }

  const squareType = getSquareType(row, col)

  // Letter multipliers always apply (including on center square)
  if (squareType === 'DL') return { letterScore: baseValue * 2, wordMult: 1 }
  if (squareType === 'TL') return { letterScore: baseValue * 3, wordMult: 1 }

  // Center square: no word multiplier on first play (Crossplay rule)
  const isCenter = row === CENTER.row && col === CENTER.col
  if (isCenter) return { letterScore: baseValue, wordMult: 1 }

  if (squareType === 'DW') return { letterScore: baseValue, wordMult: 2 }
  if (squareType === 'TW') return { letterScore: baseValue, wordMult: 3 }

  return { letterScore: baseValue, wordMult: 1 }
}

function getWordExtent(
  placements: TilePlacement[],
  board: Board,
  direction: 'across' | 'down',
  startRow?: number,
  startCol?: number
): { minRow: number; minCol: number; maxRow: number; maxCol: number } {
  const row = startRow ?? placements[0].row
  const col = startCol ?? placements[0].col

  if (direction === 'across') {
    // Extend left and right from the leftmost placed tile in this row
    const placedCols = placements.filter(p => p.row === row).map(p => p.col)
    let minCol = Math.min(...placedCols)
    let maxCol = Math.max(...placedCols)
    while (minCol > 0 && board[row][minCol - 1] !== null) minCol--
    while (maxCol < BOARD_SIZE - 1 && board[row][maxCol + 1] !== null) maxCol++
    return { minRow: row, minCol, maxRow: row, maxCol }
  } else {
    // Extend up and down from the topmost placed tile in this column
    const placedRows = placements.filter(p => p.col === col).map(p => p.row)
    let minRow = Math.min(...placedRows)
    let maxRow = Math.max(...placedRows)
    while (minRow > 0 && board[minRow - 1][col] !== null) minRow--
    while (maxRow < BOARD_SIZE - 1 && board[maxRow + 1][col] !== null) maxRow++
    return { minRow, minCol: col, maxRow, maxCol: col }
  }
}

function extractWord(board: Board, row: number, col: number, direction: 'across' | 'down'): string | null {
  if (direction === 'across') {
    let c = col
    while (c > 0 && board[row][c - 1] !== null) c--
    const letters: string[] = []
    while (c < BOARD_SIZE && board[row][c] !== null) {
      letters.push(board[row][c]!.letter)
      c++
    }
    return letters.length > 1 ? letters.join('') : null
  } else {
    let r = row
    while (r > 0 && board[r - 1][col] !== null) r--
    const letters: string[] = []
    while (r < BOARD_SIZE && board[r][col] !== null) {
      letters.push(board[r][col]!.letter)
      r++
    }
    return letters.length > 1 ? letters.join('') : null
  }
}

function applyPlacements(board: Board, placements: TilePlacement[]): Board {
  const newBoard = board.map(row => [...row])
  for (const { row, col, tile } of placements) {
    newBoard[row][col] = tile
  }
  return newBoard
}
