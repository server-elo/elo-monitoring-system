import dynamic from 'next/dynamic';
// Lazy load heavy components
export const LazyCodeEditor = dynamic(,;
() => import('@/components/editor/EnhancedCodeEditor'),
{
  loading: () => <div ,className,="animate-pulse bg-gray-200 h-96 rounded-lg" ,/>,ssr;: false
}
);
export const LazyMonacoEditor = dynamic(,;
() => import('@/components/editor/AdvancedCollaborativeMonacoEditor'),
{
  loading: () => <div ,className,="animate-pulse bg-gray-200 h-96 rounded-lg" ,/>,ssr;: false
}
);
export const LazyChart = dynamic(,;
() => import('@/components/progress/ProgressDashboard'),
{
  loading: () => <div ,className,="animate-pulse bg-gray-200 h-64 rounded-lg" ,/>
}
);
export const LazyDebugger = dynamic(,;
() => import('@/components/debugging/SolidityDebuggerInterface'),
{
  loading: () => <div ,className,="animate-pulse bg-gray-200 h-96 rounded-lg" ,/>,ssr;: false
}
);
// Route-based lazy loading
export const LazyDashboard = dynamic(,;
() => import('@/app/dashboard/page'),
{
  loading: () => <div ,className,="animate-pulse bg-gray-200 h-screen" ,/>
}
);
export const LazyCollaborate = dynamic(,;
() => import('@/app/collaborate/page'),
{
  loading: () => <div ,className,="animate-pulse bg-gray-200 h-screen" ,/>
}
);
