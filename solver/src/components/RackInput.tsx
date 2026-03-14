interface Props {
  value: string
  onChange: (val: string) => void
  error: string | null
}

export function RackInput({ value, onChange, error }: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z?]/g, '')
    onChange(raw)
  }

  const tileCount = value.length
  const blankCount = value.split('').filter(c => c === '?').length

  let validation = error
  if (!validation && tileCount > 7) validation = 'Too many tiles (max 7)'
  if (!validation && blankCount > 3) validation = 'Too many blanks (max 3 in Crossplay)'

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        Your Rack
        <span className="ml-2 text-gray-400 font-normal text-xs">A–Z, use ? for blank</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          maxLength={7}
          placeholder="e.g. ADEGRT?"
          className={`w-40 px-3 py-2 border rounded-lg font-mono text-lg tracking-widest uppercase bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            validation ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        <span className="text-sm text-gray-400">{tileCount}/7</span>
      </div>
      {validation && (
        <p className="text-xs text-red-600">{validation}</p>
      )}
    </div>
  )
}
