export default function LoadingSpinner({ size = 'md', text = 'Loading...', fullPage = false }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-primary-600 ${sizes[size]}`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  )
  if (fullPage) {
    return <div className="flex items-center justify-center min-h-screen">{spinner}</div>
  }
  return <div className="flex items-center justify-center py-12">{spinner}</div>
}
