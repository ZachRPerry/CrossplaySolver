import type { Board, Move } from './types'
import type { Trie } from './trie'
import { getAnchorSquares } from './anchorSquares'
import { getCrossChecks } from './crossChecks'
import { generateMoves, parseRack } from './moveGenerator'
import { scoreMove } from './scorer'

const MAX_RESULTS = 20

export function solve(board: Board, rackStr: string, trie: Trie): Move[] {
  const rack = parseRack(rackStr)
  if (rack.length === 0) return []

  const anchors = getAnchorSquares(board)
  const crossChecks = getCrossChecks(board, trie)
  const moves = generateMoves(board, rack, trie, anchors, crossChecks)

  // Score all moves (also populates move.crossWords)
  for (const move of moves) {
    move.score = scoreMove(board, move, trie)
  }

  // Validate cross-words — filter out any move where a formed cross-word isn't in the dictionary.
  // This is a correctness backstop for any edge cases in the cross-check logic.
  const valid = moves.filter(m => m.crossWords.every(w => trie.hasWord(w)))

  // Deduplicate (same word, row, col, direction can appear via different rack tile combos)
  const seen = new Set<string>()
  const unique = valid.filter(m => {
    const key = `${m.word}|${m.row}|${m.col}|${m.direction}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort by score descending, return top N
  return unique.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS)
}
