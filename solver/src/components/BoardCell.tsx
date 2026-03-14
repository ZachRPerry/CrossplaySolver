import type { Tile, SquareType } from '../solver'
import { TILE_VALUES } from '../solver'

interface Props {
  tile: Tile | null
  squareType: SquareType | null
  isCenter: boolean
  isSelected: boolean
  cursorDirection?: 'across' | 'down'
  isPreview: boolean
  isGhostPreview: boolean
  previewTile?: Tile
  onClick: () => void
}

const SQUARE_STYLE: Record<string, { bg: string; text: string }> = {
  DL: { bg: 'bg-[#f0eacd]', text: 'text-[#816236]' },
  TL: { bg: 'bg-[#dfe7d1]', text: 'text-[#afb89a]' },
  DW: { bg: 'bg-[#d9e0ee]', text: 'text-[#4c618e]' },
  TW: { bg: 'bg-[#e6dde8]', text: 'text-[#a236ac]' },
}

const SQUARE_LABEL: Record<string, string> = {
  DL: '2L', TL: '3L', DW: '2W', TW: '3W',
}

export function BoardCell({ tile, squareType, isCenter, isSelected, cursorDirection, isPreview, isGhostPreview, previewTile, onClick }: Props) {
  let bg = 'bg-[#f1eeed]'
  let textColor = 'text-[#7a7060]'
  let label = ''

  // Determine what tile to display (real tile, or preview tile)
  const displayTile: Tile | null = tile ?? (isPreview ? (previewTile ?? null) : null)

  if (displayTile) {
    bg = isPreview && !tile
      ? (isGhostPreview ? 'bg-[#a0b4d8]' : 'bg-[#2a5492]')
      : 'bg-[#4076c6]'
    textColor = isGhostPreview && isPreview && !tile ? 'text-[#2a5492]' : 'text-white'
  } else if (squareType) {
    const s = SQUARE_STYLE[squareType]
    if (s) { bg = s.bg; textColor = s.text }
    label = SQUARE_LABEL[squareType] ?? ''
  } else if (isCenter) {
    bg = 'bg-[#c8c4bc]'
    label = '★'
  }

  const ring = isSelected ? 'ring-2 ring-inset ring-yellow-400' : ''

  const letter = displayTile
    ? (displayTile.isBlank ? displayTile.letter.toLowerCase() : displayTile.letter)
    : isSelected ? (cursorDirection === 'across' ? '→' : '↓') : ''

  const pointValue = displayTile
    ? (displayTile.isBlank ? 0 : (TILE_VALUES[displayTile.letter] ?? 0))
    : null

  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 relative rounded-sm flex items-center justify-center select-none ${displayTile ? '' : 'border border-white'} ${bg} ${textColor} ${ring}`}
    >
      {displayTile ? (
        <>
          <span className="text-lg font-bold leading-none">{letter}</span>
          <span className="absolute top-1 right-1 text-[11px] leading-none opacity-75 font-semibold">{pointValue}</span>
        </>
      ) : (
        <span className="text-xs font-semibold">{letter || label}</span>
      )}
    </button>
  )
}
