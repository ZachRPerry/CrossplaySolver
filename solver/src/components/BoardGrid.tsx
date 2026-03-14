import { BoardCell } from './BoardCell'
import { BOARD_SIZE, getSquareType } from '../solver'
import type { Board, Move } from '../solver'

interface Props {
  board: Board
  selectedCell: { row: number; col: number } | null
  selectedDirection: 'across' | 'down'
  previewMove: Move | null
  isGhostPreview: boolean
  onCellClick: (row: number, col: number) => void
}

export function BoardGrid({ board, selectedCell, selectedDirection, previewMove, isGhostPreview, onCellClick }: Props) {
  const previewTileMap = new Map(
    previewMove?.placements.map(p => [`${p.row},${p.col}`, p.tile]) ?? []
  )

  return (
    <div
      className="inline-grid gap-px bg-white p-1 rounded shadow-md"
      style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 3rem)` }}
    >
      {Array.from({ length: BOARD_SIZE }, (_, row) =>
        Array.from({ length: BOARD_SIZE }, (_, col) => {
          const key = `${row},${col}`
          return (
            <BoardCell
              key={key}
              tile={board[row][col]}
              squareType={getSquareType(row, col)}
              isCenter={row === 7 && col === 7}
              isSelected={selectedCell?.row === row && selectedCell?.col === col}
              cursorDirection={selectedCell?.row === row && selectedCell?.col === col ? selectedDirection : undefined}
              isPreview={previewTileMap.has(key)}
              isGhostPreview={isGhostPreview}
              previewTile={previewTileMap.get(key)}
              onClick={() => onCellClick(row, col)}
            />
          )
        })
      )}
    </div>
  )
}
