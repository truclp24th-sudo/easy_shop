export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-gray-200 rounded-full" />
          <div className="h-3 w-10 bg-gray-200 rounded-full" />
        </div>
        <div className="h-3.5 w-full bg-gray-200 rounded-full" />
        <div className="h-3.5 w-2/3 bg-gray-200 rounded-full" />
        <div className="h-5 w-24 bg-gray-200 rounded-full mt-2" />
        <div className="flex gap-2 pt-2">
          <div className="h-9 flex-1 bg-gray-200 rounded-xl" />
          <div className="h-9 flex-1 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
