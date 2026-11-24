export default function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${s} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
    </div>
  );
}
