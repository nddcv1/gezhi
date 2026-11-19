export function BackBar({ title }: { title: string }) {
  return (
    <header className="backbar">
      <button
        className="text-btn"
        onClick={() => {
          if (history.length > 1) history.back()
          else location.hash = '#/today'
        }}
      >
        ← 返回
      </button>
      <span className="backbar-title">{title}</span>
    </header>
  )
}
