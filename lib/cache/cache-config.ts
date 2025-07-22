export const cacheConfig = {
  // API cache times (in seconds)
  api: {
    user: 300,
    // 5 minutes
    courses: 3600,
    // 1 hour
    lessons: 3600,
    // 1 hour
    achievements: 1800,
    // 30 minutes
    leaderboard: 600,
    // 10 minutes
  },
  // Static asset cache times
  static: {
    images: 2592000, // 30 days
    fonts: 2592000, // 30 days
    styles: 86400, // 1 day
    scripts: 86400, // 1 day
  },
  // SWR configuration for data fetching
  swr: {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
  },
};
// Cache headers helper
export const getCacheHeaders = (
  type: keyof typeof cacheConfig.api | keyof typeof cacheConfig.static,
) => {
  const cacheTime =
    cacheConfig.api[type as keyof typeof cacheConfig.api] ||
    cacheConfig.static[type as keyof typeof cacheConfig.static] ||
    300;
  return {
    "Cache-Control": `public, max-age=${cacheTime}, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime * 2}`,
  };
};
