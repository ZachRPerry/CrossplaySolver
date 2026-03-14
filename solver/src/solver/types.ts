export type Tile = {
  letter: string   // uppercase A-Z
  isBlank: boolean // true if this tile is a blank playing as `letter`
}

export type Board = (Tile | null)[][]

export type Direction = 'across' | 'down'

export type SquareType = 'DL' | 'TL' | 'DW' | 'TW'

export type TilePlacement = {
  row: number
  col: number
  tile: Tile
}

export type Move = {
  word: string
  row: number
  col: number
  direction: Direction
  score: number
  placements: TilePlacement[]
  crossWords: string[]
}
