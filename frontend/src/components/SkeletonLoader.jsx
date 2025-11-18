import React from 'react';

const SkeletonLoader = ({ 
  type = 'list', 
  count = 3, 
  className = '' 
}) => {
  const shimmer = "animate-pulse";
  
  const SkeletonCard = () => (
    <div className={`${shimmer} bg-white dark:bg-surface p-6 rounded-xl border border-gray-100 dark:border-app mb-4`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-app rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-app rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-app rounded w-1/2"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 dark:bg-app rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 dark:bg-app rounded-full w-20"></div>
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-app rounded"></div>
      </div>
    </div>
  );

  const SkeletonTable = () => (
    <div className={`${shimmer} bg-white dark:bg-surface rounded-xl border border-gray-100 dark:border-app overflow-hidden`}>
      <div className="p-4 border-b border-gray-100 dark:border-app">
        <div className="h-6 bg-gray-200 dark:bg-app rounded w-48"></div>
      </div>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="p-4 border-b border-gray-50 dark:border-app/50 last:border-b-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 dark:bg-app rounded"></div>
            <div className="flex-1 h-4 bg-gray-200 dark:bg-app rounded"></div>
            <div className="w-20 h-6 bg-gray-200 dark:bg-app rounded-full"></div>
            <div className="w-16 h-8 bg-gray-200 dark:bg-app rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (type === 'table') {
    return <SkeletonTable />;
  }

  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonLoader;