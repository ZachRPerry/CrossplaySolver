import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { solve, loadDictionary, createEmptyBoard, getPremiumSquares, Trie, BOARD_SIZE } from './solver'
import type { Board, Move, Tile } from './solver'
import { BoardGrid } from './components/BoardGrid'
import { RackInput } from './components/RackInput'
import { ResultsList } from './components/ResultsList'

type Direction = 'across' | 'down'

function advanceCursor(board: Board, row: number, col: number, dir: Direction): { row: number; col: number } {
  let r = row, c = col
  while (true) {
    if (dir === 'across') c++; else r++
    if (r >= BOARD_SIZE || c >= BOARD_SIZE) return { row, col }
    if (board[r][c] === null) return { row: r, col: c }
  }
}

function retreatCursor(row: number, col: number, dir: Direction): { row: number; col: number } | null {
  if (dir === 'across') return col > 0 ? { row, col: col - 1 } : null
  return row > 0 ? { row: row - 1, col } : null
}

function loadSavedGame(): { board: Board; rack: string } {
  try {
    const saved = localStorage.getItem('crossplay_game')
    if (saved) return JSON.parse(saved)
  } catch {}
  return { board: createEmptyBoard() as Board, rack: '' }
}

function App() {
  const saved = loadSavedGame()
  const [board, setBoard] = useState<Board>(saved.board)
  const [rack, setRack] = useState(saved.rack)
  const [rackError, setRackError] = useState<string | null>(null)
  const [moves, setMoves] = useState<Move[]>([])
  const [selectedMove, setSelectedMove] = useState<Move | null>(null)
  const [hoveredMove, setHoveredMove] = useState<Move | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [direction, setDirection] = useState<Direction>('across')
  const [solving, setSolving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const trieRef = useRef<Trie | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  // Refs so handlers always see current values without stale closures
  const selectedCellRef = useRef(selectedCell)
  selectedCellRef.current = selectedCell
  const directionRef = useRef(direction)
  directionRef.current = direction
  const selectedMoveRef = useRef(selectedMove)
  selectedMoveRef.current = selectedMove

  const hasConfig = getPremiumSquares().size >= 56

  useEffect(() => {
    localStorage.setItem('crossplay_game', JSON.stringify({ board, rack }))
  }, [board, rack])

  useEffect(() => {
    setStatus('loading')
    loadDictionary().then(trie => {
      trieRef.current = trie
      setStatus('ready')
    }).catch(() => setStatus('error'))
  }, [])

  const handleCellClick = useCallback((row: number, col: number) => {
    const prev = selectedCellRef.current
    if (prev?.row === row && prev?.col === col) {
      setDirection(d => d === 'across' ? 'down' : 'across')
    } else {
      setSelectedCell({ row, col })
      setSelectedMove(null)
    }
  }, [])

  useEffect(() => {
    if (!selectedCell) return

    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedCell) return
      const { row, col } = selectedCell

      if (e.key === 'Escape') {
        setSelectedCell(null)
        return
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setDirection('across')
        setSelectedCell({ row, col: Math.min(col + 1, BOARD_SIZE - 1) })
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setDirection('across')
        setSelectedCell({ row, col: Math.max(col - 1, 0) })
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setDirection('down')
        setSelectedCell({ row: Math.min(row + 1, BOARD_SIZE - 1), col })
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setDirection('down')
        setSelectedCell({ row: Math.max(row - 1, 0), col })
        return
      }

      if (/^[A-Za-z]$/.test(e.key)) {
        e.preventDefault()
        const letter = e.key.toUpperCase()
        setBoard(prev => {
          const next = prev.map(r => [...r]) as Board
          next[row][col] = { letter, isBlank: false } as Tile
          setSelectedCell(advanceCursor(next, row, col, direction))
          return next
        })
        setMoves([])
        setSelectedMove(null)
        return
      }

      if (e.key === '?' || (e.key === ' ' && e.target === document.body)) {
        e.preventDefault()
        const letter = prompt('Blank tile — what letter is it playing as?')?.toUpperCase().trim()
        if (letter && /^[A-Z]$/.test(letter)) {
          setBoard(prev => {
            const next = prev.map(r => [...r]) as Board
            next[row][col] = { letter, isBlank: true } as Tile
            setSelectedCell(advanceCursor(next, row, col, direction))
            return next
          })
          setMoves([])
          setSelectedMove(null)
        }
        return
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        setBoard(prev => {
          const next = prev.map(r => [...r]) as Board
          if (next[row][col] !== null) {
            next[row][col] = null
          } else {
            const back = retreatCursor(row, col, direction)
            if (back) {
              next[back.row][back.col] = null
              setSelectedCell(back)
            }
          }
          return next
        })
        setMoves([])
        setSelectedMove(null)
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, direction])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boardRef.current && !boardRef.current.contains(e.target as Node)) {
        setSelectedCell(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleEnter(e: KeyboardEvent) {
      const move = selectedMoveRef.current
      if (e.key !== 'Enter' || !move) return
      e.preventDefault()
      setBoard(prev => {
        const next = prev.map(r => [...r]) as Board
        for (const { row, col, tile } of move.placements) next[row][col] = tile
        return next
      })
      setRack(prev => {
        let r = prev.toUpperCase()
        for (const { tile } of move.placements) {
          const ch = tile.isBlank ? '?' : tile.letter
          const idx = r.indexOf(ch)
          if (idx !== -1) r = r.slice(0, idx) + r.slice(idx + 1)
        }
        return r
      })
      setMoves([])
      setSelectedMove(null)
      setSelectedCell(null)
    }
    document.addEventListener('keydown', handleEnter)
    return () => document.removeEventListener('keydown', handleEnter)
  }, [])

  async function handleSolve() {
    if (!trieRef.current) return
    const blankCount = rack.split('').filter(c => c === '?').length
    if (rack.length === 0) { setRackError('Enter your rack letters'); return }
    if (rack.length > 7) { setRackError('Too many tiles'); return }
    if (blankCount > 3) { setRackError('Too many blanks'); return }
    setRackError(null)
    setSolving(true)
    setSelectedMove(null)
    await new Promise(r => setTimeout(r, 10))
    const result = solve(board, rack, trieRef.current)
    setMoves(result)
    setSolving(false)
  }

  function handleSubmitMove() {
    if (!selectedMove) return
    // Apply placements to board
    const newBoard = board.map(r => [...r]) as Board
    for (const { row, col, tile } of selectedMove.placements) {
      newBoard[row][col] = tile
    }
    // Remove used tiles from rack
    let newRack = rack.toUpperCase()
    for (const { tile } of selectedMove.placements) {
      const ch = tile.isBlank ? '?' : tile.letter
      const idx = newRack.indexOf(ch)
      if (idx !== -1) newRack = newRack.slice(0, idx) + newRack.slice(idx + 1)
    }
    setBoard(newBoard)
    setRack(newRack)
    setMoves([])
    setSelectedMove(null)
    setSelectedCell(null)
  }

  function handleClear() {
    setBoard(createEmptyBoard() as Board)
    setRack('')
    setMoves([])
    setSelectedMove(null)
    setSelectedCell(null)
    localStorage.removeItem('crossplay_game')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">Crossplay Solver</h1>
          {status === 'loading' && <span className="text-xs text-gray-400">Loading dictionary…</span>}
          {status === 'ready' && <span className="text-xs text-green-600">Dictionary ready</span>}
          {status === 'error' && <span className="text-xs text-red-500">Dictionary failed to load</span>}
        </div>
        <Link to="/setup" className="text-sm text-gray-500 hover:text-gray-800 underline">
          Board Setup
        </Link>
      </header>

      {!hasConfig && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            Premium squares not configured — scoring will be approximate.{' '}
            <Link to="/setup" className="underline font-medium">Set up the board →</Link>
          </span>
        </div>
      )}

      <main className="flex gap-6 p-4 items-start">
        <div className="flex flex-col gap-3 w-64 text-base text-gray-500 shrink-0">
          <div>
            <p className="font-semibold text-gray-600 mb-1">Entering tiles</p>
            <ul className="flex flex-col gap-0.5">
              <li>Click a cell, then type a letter</li>
              <li>Click the same cell to toggle direction</li>
              <li>Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-sm">?</kbd> or <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-sm">Space</kbd> to place a blank</li>
              <li><kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-sm">Backspace</kbd> to delete</li>
              <li><kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-sm">Esc</kbd> to deselect</li>
              <li>Arrow keys to move</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-600 mb-1">Finding moves</p>
            <ul className="flex flex-col gap-0.5">
              <li>Enter your rack letters (use <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-sm">?</kbd> for blanks)</li>
              <li>Click <strong>Solve</strong> to find top moves</li>
              <li>Hover a move to preview it on the board</li>
              <li>Click a move to select it</li>
              <li>Click <strong>Play</strong> or press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-sm">Enter</kbd> to commit</li>
            </ul>
          </div>
        </div>

        <div ref={boardRef} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDirection(d => d === 'across' ? 'down' : 'across')}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50"
            >
              Direction: <strong>{direction}</strong>
            </button>
            <button onClick={handleClear}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full text-gray-500 hover:bg-gray-50">
              Clear board
            </button>
            {selectedCell && (
              <span className="text-xs text-blue-500">
                Click same cell or Tab to toggle direction
              </span>
            )}
          </div>
          <BoardGrid
            board={board}
            selectedCell={selectedCell}
            selectedDirection={direction}
            previewMove={hoveredMove ?? selectedMove}
            isGhostPreview={hoveredMove !== null}
            onCellClick={handleCellClick}
          />
          {selectedCell && (
            <p className="text-xs text-gray-400">
              Click to select a cell, type a letter — Backspace to delete, Esc to deselect, arrows to move
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 w-80">
          <RackInput value={rack} onChange={setRack} error={rackError} />

          <button
            onClick={handleSolve}
            disabled={solving || status !== 'ready'}
            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {solving ? 'Solving…' : 'Solve'}
          </button>

          {selectedMove && (
            <button
              onClick={handleSubmitMove}
              className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Play "{selectedMove.word}" ({selectedMove.score} pts)
            </button>
          )}

          {moves.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{moves.length} moves found — click to preview</p>
              <ResultsList
                moves={moves}
                selected={selectedMove}
                onSelect={setSelectedMove}
                onHover={setHoveredMove}
              />
            </div>
          )}

          {moves.length === 0 && !solving && status === 'ready' && rack.length > 0 && (
            <p className="text-sm text-gray-400 text-center">Click Solve to find moves</p>
          )}
        </div>

      </main>
    </div>
  )
}

export default App
