import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPremiumSquares, persistPremiumSquares, BOARD_SIZE } from '../solver'
import type { SquareType } from '../solver'

const CYCLE: (SquareType | null)[] = [null, 'DL', 'TL', 'DW', 'TW']

const SQUARE_STYLES: Record<string, string> = {
  DL: 'bg-yellow-300 text-yellow-900',
  TL: 'bg-green-400 text-green-900',
  DW: 'bg-blue-400 text-white',
  TW: 'bg-purple-500 text-white',
}

const SQUARE_LABELS: Record<string, string> = {
  DL: '2L',
  TL: '3L',
  DW: '2W',
  TW: '3W',
}

const TARGET_COUNTS: Record<string, number> = { DL: 20, TL: 20, DW: 8, TW: 8 }

export function SetupPage() {
  const navigate = useNavigate()
  const [squares, setSquares] = useState<Map<string, SquareType>>(() => new Map(getPremiumSquares()))
  const [saved, setSaved] = useState(false)

  useEffect(() => { setSaved(false) }, [squares])

  function handleCellClick(row: number, col: number) {
    const key = `${row},${col}`
    const current = squares.get(key) ?? null
    const currentIdx = CYCLE.indexOf(current)
    const next = CYCLE[(currentIdx + 1) % CYCLE.length]
    const updated = new Map(squares)
    if (next === null) updated.delete(key)
    else updated.set(key, next)
    setSquares(updated)
  }

  function handleSave() {
    persistPremiumSquares(squares)
    setSaved(true)
  }

  function handleReset() {
    setSquares(new Map())
  }

  function handleExport() {
    const data = JSON.stringify([...squares.entries()], null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'crossplay-premium-squares.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const counts: Record<string, number> = { DL: 0, TL: 0, DW: 0, TW: 0 }
  for (const type of squares.values()) counts[type] = (counts[type] ?? 0) + 1

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Premium Square Setup</h1>
            <p className="text-sm text-gray-500 mt-1">
              Click a square to cycle: plain → <span className="text-yellow-700 font-medium">2L</span> → <span className="text-green-700 font-medium">3L</span> → <span className="text-blue-600 font-medium">2W</span> → <span className="text-purple-600 font-medium">3W</span> → plain
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-800 underline"
          >
            ← Back to Solver
          </button>
        </div>

        {/* Count indicators */}
        <div className="flex gap-4 mb-4">
          {Object.entries(TARGET_COUNTS).map(([type, target]) => {
            const count = counts[type] ?? 0
            const done = count === target
            return (
              <div
                key={type}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
                  done ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-600'
                }`}
              >
                <span className={`w-3 h-3 rounded-sm ${SQUARE_STYLES[type]?.split(' ')[0]}`} />
                {SQUARE_LABELS[type]}: {count}/{target}
                {done && <span className="text-green-500">✓</span>}
              </div>
            )
          })}
        </div>

        {/* Board grid */}
        <div
          className="inline-grid border-2 border-gray-400 rounded bg-gray-300 p-0.5 gap-0.5"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 3rem)` }}
        >
          {Array.from({ length: BOARD_SIZE }, (_, row) =>
            Array.from({ length: BOARD_SIZE }, (_, col) => {
              const key = `${row},${col}`
              const type = squares.get(key) ?? null
              const isCenter = row === 7 && col === 7
              return (
                <button
                  key={key}
                  onClick={() => handleCellClick(row, col)}
                  className={`
                    w-9 h-9 text-xs font-bold rounded-sm border transition-colors select-none
                    ${type ? SQUARE_STYLES[type] : isCenter ? 'bg-gray-400 text-gray-600 border-gray-500' : 'bg-gray-50 hover:bg-gray-200 text-gray-400 border-gray-200'}
                  `}
                  title={`${row},${col}${type ? ` — ${SQUARE_LABELS[type]}` : ''}`}
                >
                  {type ? SQUARE_LABELS[type] : isCenter ? '★' : ''}
                </button>
              )
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4 items-center">
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Configuration
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
          >
            Reset All
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium">✓ Saved</span>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 text-sm text-gray-600 max-w-md">
          <p className="font-medium text-gray-800 mb-2">Instructions</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open Crossplay next to this window</li>
            <li>Compare the boards and click each premium square here</li>
            <li>Target: 20×2L, 20×3L, 8×2W, 8×3W (56 total)</li>
            <li>Click <strong>Save</strong> when done — the solver will use these coordinates</li>
            <li>Click <strong>Export JSON</strong> to download for the codebase</li>
          </ol>
        </div>

      </div>
    </div>
  )
}
