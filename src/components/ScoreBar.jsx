export default function ScoreBar({ score, size = 'md' }) {
  const color = score >= 75 ? 'bg-emerald-500' : score >= 55 ? 'bg-amber-500' : 'bg-red-500'
  const height = size === 'lg' ? 'h-3' : 'h-2'

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${color} rounded-full animate-grow-bar`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={`text-sm font-semibold tabular-nums ${score >= 75 ? 'text-emerald-600 dark:text-emerald-400' : score >= 55 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}
