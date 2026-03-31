export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-gray-200 dark:border-gray-700 border-t-indigo-600 rounded-full animate-spin" />
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}
