export default function Loading() {
  return (
    <div className="p-6 md:p-8">
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 h-64 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}
