export function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 animate-pulse">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl mx-auto mb-6" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded max-w-[200px] mx-auto mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded max-w-[300px] mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
