export function ProductCardSkeleton() {
  return (
    <div>
      <div className="aspect-[4/5] shimmer" />
      <div className="mt-3 h-5 w-3/4 shimmer" />
      <div className="mt-2 h-3 w-1/3 shimmer" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
