import type { Move } from '../solver'

interface Props {
  moves: Move[]
  selected: Move | null
  onSelect: (move: Move) => void
  onHover: (move: Move | null) => void
}

function positionLabel(move: Move): string {
  const row = String.fromCharCode(65 + move.row) // A–O
  const col = move.col + 1
  return `${row}${col} ${move.direction}`
}

export function ResultsList({ moves, selected, onSelect, onHover }: Props) {
  if (moves.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 text-sm">
        No moves found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-[600px]">
      {moves.map((move, i) => {
        const isSelected = selected === move
        return (
          <button
            key={i}
            onClick={() => onSelect(move)}
            onMouseEnter={() => onHover(move)}
            onMouseLeave={() => onHover(null)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
              isSelected
                ? 'bg-blue-100 border border-blue-300'
                : 'bg-white hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-gray-800 text-sm w-28 truncate">
                {move.word}
              </span>
              <span className="text-xs text-gray-400">{positionLabel(move)}</span>
              {move.crossWords.length > 0 && (
                <span className="text-xs text-gray-400 italic truncate max-w-24">
                  +{move.crossWords.join(', ')}
                </span>
              )}
            </div>
            <span className="font-bold text-blue-700 text-sm ml-2 shrink-0">
              {move.score} pts
            </span>
          </button>
        )
      })}
    </div>
  )
}
