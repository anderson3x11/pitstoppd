// Sélecteur à options exclusives (tri, onglets). options: [{ key, label }]
export default function Segmented({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-md border border-line bg-card p-0.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          aria-pressed={value === opt.key}
          className={`shrink-0 px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
            value === opt.key ? 'bg-raised text-white' : 'text-subtle hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
