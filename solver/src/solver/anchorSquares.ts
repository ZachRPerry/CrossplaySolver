import type { Board } from './types'
import { BOARD_SIZE, CENTER } from './boardConfig'

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]]

export function getAnchorSquares(board: Board): Set<string> {
  const anchors = new Set<string>()

  // Check if board is empty
  const isEmpty = board.every(row => row.every(cell => cell === null))
  if (isEmpty) {
    anchors.add(`${CENTER.row},${CENTER.col}`)
    return anchors
  }

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) continue // only empty squares can be anchors
      for (const [dr, dc] of DIRS) {
        const nr = r + dr
        const nc = c + dc
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] !== null) {
          anchors.add(`${r},${c}`)
          break
        }
      }
    }
  }

  return anchors
}
