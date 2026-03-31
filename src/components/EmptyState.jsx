export default function EmptyState({ title = 'No data', description = 'Nothing to display yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
        <span className="text-xl">📭</span>
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
  )
}
