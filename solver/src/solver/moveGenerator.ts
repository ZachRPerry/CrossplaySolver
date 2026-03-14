import type { Board, Direction, Move, TilePlacement } from './types'
import type { Trie, TrieNode } from './trie'
import { BOARD_SIZE } from './boardConfig'

type RackTile = { letter: string; isBlank: boolean }

export function generateMoves(
  board: Board,
  rack: RackTile[],
  trie: Trie,
  anchors: Set<string>,
  crossChecks: Map<string, Set<string>>
): Move[] {
  const moves: Move[] = []

  // Generate across moves on the normal board
  generateDirectionalMoves(board, rack, trie, anchors, crossChecks, 'across', moves)

  // Generate down moves by transposing the board, running across, then transposing results back
  const transposed = transpose(board)
  const transposedAnchors = transposeKeys(anchors)
  const transposedChecks = transposeCheckKeys(crossChecks)
  const downMoves: Move[] = []
  generateDirectionalMoves(transposed, rack, trie, transposedAnchors, transposedChecks, 'across', downMoves)
  for (const move of downMoves) {
    moves.push({
      ...move,
      row: move.col,
      col: move.row,
      direction: 'down',
      placements: move.placements.map(p => ({ ...p, row: p.col, col: p.row })),
    })
  }

  return moves
}

function generateDirectionalMoves(
  board: Board,
  rack: RackTile[],
  trie: Trie,
  anchors: Set<string>,
  crossChecks: Map<string, Set<string>>,
  direction: Direction,
  results: Move[]
): void {
  for (const key of anchors) {
    const [r, c] = key.split(',').map(Number)

    // Find how many squares we can extend to the left of this anchor
    // Either they are empty (rack tiles) or already occupied (board tiles become prefix)
    const maxLeft = computeMaxLeft(board, r, c)

    // Case 1: There are tiles already to the left — they form the prefix, extend right from anchor
    if (board[r][c - 1] !== null) {
      const prefix = collectLeftTiles(board, r, c)
      const node = trie.getNode(prefix)
      if (node) {
        extendRight(board, rack, trie, anchors, crossChecks, direction, r, c, r, c, prefix, node, [], results, true)
      }
      continue
    }

    // Case 2: Empty squares to the left — try all left-part lengths (including 0)
    for (let leftLen = 0; leftLen <= maxLeft; leftLen++) {
      const startCol = c - leftLen
      // Skip if the leftmost new tile would be immediately adjacent to an existing tile —
      // that forms a longer board word that isn't validated here. The anchor AT startCol
      // (which has Case 1 applied) already handles that scenario correctly.
      if (startCol > 0 && board[r][startCol - 1] !== null) continue
      buildLeftPart(board, rack, trie, anchors, crossChecks, direction, r, c, startCol, c, '', trie.root, [], leftLen, results)
    }
  }
}

// Build left part by placing rack tiles to the left of the anchor, then extend right
function buildLeftPart(
  board: Board,
  rack: RackTile[],
  trie: Trie,
  anchors: Set<string>,
  crossChecks: Map<string, Set<string>>,
  direction: Direction,
  anchorRow: number,
  anchorCol: number,
  currentCol: number,
  targetCol: number, // stop building left, switch to right extension
  prefix: string,
  node: TrieNode,
  placed: TilePlacement[],
  remaining: number, // how many more left tiles to place
  results: Move[]
): void {
  if (remaining === 0) {
    // Done building left part — now extend right from anchor
    extendRight(board, rack, trie, anchors, crossChecks, direction, anchorRow, anchorCol, anchorRow, anchorCol, prefix, node, placed, results, false)
    return
  }

  // Try each rack tile at currentCol
  const usedLetters = new Set<string>()
  for (let i = 0; i < rack.length; i++) {
    const tile = rack[i]
    const letters = tile.isBlank ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') : [tile.letter]

    for (const letter of letters) {
      if (usedLetters.has(tile.isBlank ? `?${letter}` : letter)) continue
      usedLetters.add(tile.isBlank ? `?${letter}` : letter)

      const childNode = node.children.get(letter)
      if (!childNode) continue

      // Cross-check: left-part tiles must also form valid perpendicular words
      const crossCheckKey = `${anchorRow},${currentCol},${direction}`
      const validLetters = crossChecks.get(crossCheckKey) ?? new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))
      if (!validLetters.has(letter)) continue

      const newPrefix = prefix + letter
      const newRack = [...rack.slice(0, i), ...rack.slice(i + 1)]
      const newPlaced: TilePlacement[] = [...placed, {
        row: anchorRow,
        col: currentCol,
        tile: { letter, isBlank: tile.isBlank }
      }]

      buildLeftPart(board, newRack, trie, anchors, crossChecks, direction, anchorRow, anchorCol, currentCol + 1, targetCol, newPrefix, childNode, newPlaced, remaining - 1, results)
    }
  }
}

// Extend rightward from current position, collecting a valid word
function extendRight(
  board: Board,
  rack: RackTile[],
  trie: Trie,
  anchors: Set<string>,
  crossChecks: Map<string, Set<string>>,
  direction: Direction,
  anchorRow: number,
  anchorCol: number,
  row: number,
  col: number,
  word: string,
  node: TrieNode,
  placed: TilePlacement[],
  results: Move[],
  anchorCovered: boolean
): void {
  // If we've gone past the board, try to record and stop
  if (col >= BOARD_SIZE) {
    if (anchorCovered && node.isTerminal && placed.length > 0) {
      recordMove(board, word, row, anchorCol - (word.length - (col - anchorCol)), col - 1, direction, placed, results)
    }
    return
  }

  const existingTile = board[row][col]

  if (existingTile !== null) {
    // Square already has a tile — consume it and continue
    const childNode = node.children.get(existingTile.letter)
    if (childNode) {
      extendRight(board, rack, trie, anchors, crossChecks, direction, anchorRow, anchorCol, row, col + 1, word + existingTile.letter, childNode, placed, results, anchorCovered || col === anchorCol)
    }
  } else {
    // Empty square — record if we have a valid word covering the anchor
    if (anchorCovered && node.isTerminal && placed.length > 0) {
      const startCol = col - word.length
      recordMove(board, word, row, startCol, col - 1, direction, placed, results)
    }

    // Try placing a rack tile here
    const crossCheckKey = `${row},${col},${direction}`
    const validLetters = crossChecks.get(crossCheckKey) ?? new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))
    const isAnchor = anchors.has(`${row},${col}`)

    const usedLetters = new Set<string>()
    for (let i = 0; i < rack.length; i++) {
      const tile = rack[i]
      const letters = tile.isBlank ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') : [tile.letter]

      for (const letter of letters) {
        if (usedLetters.has(tile.isBlank ? `?${letter}` : letter)) continue
        if (!validLetters.has(letter)) continue

        const childNode = node.children.get(letter)
        if (!childNode) continue

        usedLetters.add(tile.isBlank ? `?${letter}` : letter)

        const newRack = [...rack.slice(0, i), ...rack.slice(i + 1)]
        const newPlaced: TilePlacement[] = [...placed, { row, col, tile: { letter, isBlank: tile.isBlank } }]
        const coversAnchor = anchorCovered || col === anchorCol || isAnchor

        extendRight(board, newRack, trie, anchors, crossChecks, direction, anchorRow, anchorCol, row, col + 1, word + letter, childNode, newPlaced, results, coversAnchor)
      }
    }
  }
}

function recordMove(
  _board: Board,
  word: string,
  _row: number,
  startCol: number,
  _endCol: number,
  direction: Direction,
  placed: TilePlacement[],
  results: Move[]
): void {
  if (placed.length === 0) return
  const minRow = Math.min(...placed.map(p => p.row))
  const minCol = Math.min(...placed.map(p => p.col))

  results.push({
    word,
    row: minRow,
    col: direction === 'across' ? startCol : minCol,
    direction,
    score: 0, // scored separately
    placements: placed,
    crossWords: [],
  })
}

// Collect tiles already on the board to the left of col (returns them as a string prefix)
function collectLeftTiles(board: Board, row: number, col: number): string {
  const tiles: string[] = []
  for (let c = col - 1; c >= 0 && board[row][c] !== null; c--) {
    tiles.unshift(board[row][c]!.letter)
  }
  return tiles.join('')
}

// Max empty squares to the left of an anchor (stops at board edge or occupied square)
function computeMaxLeft(board: Board, row: number, col: number): number {
  let count = 0
  for (let c = col - 1; c >= 0 && board[row][c] === null; c--) {
    count++
  }
  return count
}

function transpose(board: Board): Board {
  const result: Board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null))
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      result[c][r] = board[r][c]
    }
  }
  return result
}

function transposeKeys(keys: Set<string>): Set<string> {
  const result = new Set<string>()
  for (const key of keys) {
    const [r, c] = key.split(',')
    result.add(`${c},${r}`)
  }
  return result
}

function transposeCheckKeys(checks: Map<string, Set<string>>): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>()
  for (const [key, val] of checks) {
    const parts = key.split(',')
    const r = parts[0], c = parts[1], dir = parts[2]
    // swap row/col, flip direction
    const newDir = dir === 'across' ? 'down' : 'across'
    result.set(`${c},${r},${newDir}`, val)
  }
  return result
}

export function parseRack(rack: string): RackTile[] {
  return rack.toUpperCase().split('').map(ch => ({
    letter: ch === '?' ? '' : ch,
    isBlank: ch === '?'
  }))
}
