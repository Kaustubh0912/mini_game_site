"use client";

interface LoadingSkeletonProps {
  variant?: "page" | "gameCard" | "gameGrid" | "slider" | "list" | "profile";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant = "page",
  count = 1,
  className = "",
}: LoadingSkeletonProps) {
  const baseSkeletonClass =
    "bg-gray-200 dark:bg-gray-700 animate-pulse rounded";

  if (variant === "page") {
    return (
      <div
        className={`min-h-screen flex items-center justify-center px-4 ${className}`}
      >
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div
              className={`w-16 h-16 ${baseSkeletonClass} rounded-xl mx-auto mb-6`}
            />
            <div
              className={`h-8 ${baseSkeletonClass} max-w-[200px] mx-auto mb-4`}
            />
            <div className={`h-4 ${baseSkeletonClass} max-w-[300px] mx-auto`} />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`h-12 ${baseSkeletonClass} rounded-xl`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "gameCard") {
    return (
      <div
        className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg ${className}`}
      >
        {/* Image skeleton */}
        <div className={`aspect-[4/3] ${baseSkeletonClass} rounded-none`} />

        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          <div className={`h-6 ${baseSkeletonClass} w-3/4`} />
          <div className={`h-4 ${baseSkeletonClass} w-full`} />
          <div className={`h-4 ${baseSkeletonClass} w-2/3`} />

          {/* Stats skeleton */}
          <div className="flex justify-between mt-4">
            <div className={`h-4 ${baseSkeletonClass} w-16`} />
            <div className={`h-4 ${baseSkeletonClass} w-20`} />
          </div>
        </div>

        {/* Footer skeleton */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className={`w-8 h-8 ${baseSkeletonClass} rounded-full`} />
              <div className={`w-8 h-8 ${baseSkeletonClass} rounded-full`} />
            </div>
            <div className={`h-4 ${baseSkeletonClass} w-24`} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "gameGrid") {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
      >
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <LoadingSkeleton variant="gameCard" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "slider") {
    return (
      <div
        className={`relative aspect-video rounded-2xl overflow-hidden ${className}`}
      >
        <div className={`absolute inset-0 ${baseSkeletonClass} rounded-none`} />

        {/* Content overlay skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
          <div className={`h-8 ${baseSkeletonClass} w-1/2`} />
          <div className={`h-4 ${baseSkeletonClass} w-3/4`} />
          <div className={`h-4 ${baseSkeletonClass} w-1/2`} />
          <div className={`h-12 w-32 ${baseSkeletonClass} rounded-full`} />
        </div>

        {/* Navigation buttons skeleton */}
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <div className={`w-10 h-10 ${baseSkeletonClass} rounded-full`} />
          <div className={`w-10 h-10 ${baseSkeletonClass} rounded-full`} />
        </div>

        {/* Dots skeleton */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 ${baseSkeletonClass} rounded-full`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-4 p-4 bg-white dark:bg-slate-800 rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div
              className={`w-16 h-16 ${baseSkeletonClass} rounded-lg flex-shrink-0`}
            />
            <div className="flex-1 space-y-2">
              <div className={`h-5 ${baseSkeletonClass} w-1/3`} />
              <div className={`h-4 ${baseSkeletonClass} w-full`} />
              <div className={`h-4 ${baseSkeletonClass} w-2/3`} />
            </div>
            <div className={`h-8 w-20 ${baseSkeletonClass}`} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "profile") {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Profile header skeleton */}
        <div className="flex items-center space-x-6 animate-pulse">
          <div className={`w-24 h-24 ${baseSkeletonClass} rounded-full`} />
          <div className="space-y-3">
            <div className={`h-8 ${baseSkeletonClass} w-48`} />
            <div className={`h-4 ${baseSkeletonClass} w-32`} />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`h-8 ${baseSkeletonClass} w-12 mx-auto mb-2`} />
              <div className={`h-4 ${baseSkeletonClass} w-16 mx-auto`} />
            </div>
          ))}
        </div>

        {/* Content blocks skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-white dark:bg-slate-800 rounded-lg space-y-3 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`h-6 ${baseSkeletonClass} w-1/4`} />
              <div className={`h-4 ${baseSkeletonClass} w-full`} />
              <div className={`h-4 ${baseSkeletonClass} w-3/4`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// Specific skeleton components for common use cases
export const GameCardSkeleton = () => <LoadingSkeleton variant="gameCard" />;

export const GameGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <LoadingSkeleton variant="gameGrid" count={count} />
);

export const FeaturedSliderSkeleton = () => (
  <LoadingSkeleton variant="slider" />
);

export const ProfileSkeleton = () => <LoadingSkeleton variant="profile" />;

export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <LoadingSkeleton variant="list" count={count} />
);
