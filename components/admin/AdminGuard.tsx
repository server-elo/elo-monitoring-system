'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { AdminUser } from '@/lib/admin/types';
import { adminAuth } from '@/lib/admin/auth';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: 'admin' | 'instructor';
  fallback?: React.ReactNode;
}

// interface AdminLoginProps {
//   onLogin: (user: AdminUser) => void;
// }

// function AdminLogin({ onLogin }: AdminLoginProps) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [twoFactorCode, setTwoFactorCode] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError('');

//     try {
//       const result = await adminAuth.authenticateAdmin(email, password, twoFactorCode);
      
//       if (result.success && result.user) {
//         onLogin(result.user);
//       } else {
//         if (result.error === 'Two-factor authentication required') {
//           setRequiresTwoFactor(true);
//         } else {
//           setError(result.error || 'Authentication failed');
//         }
//       }
//     } catch (error) {
//       setError('An unexpected error occurred');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="w-full max-w-md"
//       >
//         <Card className="bg-black/20 backdrop-blur-md border-white/10">
//           <div className="p-8">
//             {/* Header */}
//             <div className="text-center mb-8">
//               <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <Shield className="w-8 h-8 text-white" />
//               </div>
//               <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
//               <p className="text-gray-400">Sign in to access the admin panel</p>
//             </div>

//             {/* Error Message */}
//             {error && (
//               <motion.div
//                 initial={{ opacity: 0, height: 0 }}
//                 animate={{ opacity: 1, height: 'auto' }}
//                 className="mb-6 p-4 bg-red-500/10 border border-red-400/30 rounded-lg"
//               >
//                 <div className="flex items-center space-x-2">
//                   <AlertTriangle className="w-4 h-4 text-red-400" />
//                   <span className="text-red-400 text-sm">{error}</span>
//                 </div>
//               </motion.div>
//             )}

//             {/* Login Form */}
//             <form onSubmit={handleSubmit} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Email Address
//                 </label>
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
//                   placeholder="admin@example.com"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors pr-12"
//                     placeholder="Enter your password"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
//                   >
//                     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                   </button>
//                 </div>
//               </div>

//               {requiresTwoFactor && (
//                 <motion.div
//                   initial={{ opacity: 0, height: 0 }}
//                   animate={{ opacity: 1, height: 'auto' }}
//                 >
//                   <label className="block text-sm font-medium text-gray-300 mb-2">
//                     Two-Factor Authentication Code
//                   </label>
//                   <input
//                     type="text"
//                     value={twoFactorCode}
//                     onChange={(e) => setTwoFactorCode(e.target.value)}
//                     required
//                     maxLength={6}
//                     className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors text-center tracking-widest"
//                     placeholder="000000"
//                   />
//                 </motion.div>
//               )}

//               <Button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 rounded-lg transition-all duration-200"
//               >
//                 {isLoading ? (
//                   <div className="flex items-center justify-center space-x-2">
//                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                     <span>Authenticating...</span>
//                   </div>
//                 ) : (
//                   'Sign In'
//                 )}
//               </Button>
//             </form>

//             {/* Demo Credentials */}
//             <div className="mt-8 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
//               <h3 className="text-sm font-medium text-blue-400 mb-2">Demo Credentials</h3>
//               <div className="text-xs text-gray-400 space-y-1">
//                 <p>Email: admin@example.com</p>
//                 <p>Password: admin123</p>
//               </div>
//             </div>
//           </div>
//         </Card>
//       </motion.div>
//     </div>
//   );
// }

function PermissionDenied({ requiredPermission, requiredRole }: { requiredPermission?: string; requiredRole?: string }) {
  const currentUser = adminAuth.getCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400 mb-6">
              You don't have permission to access this resource.
            </p>

            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6">
              <div className="text-sm text-red-400 space-y-2">
                {requiredPermission && (
                  <p>Required permission: <code className="bg-black/20 px-2 py-1 rounded">{requiredPermission}</code></p>
                )}
                {requiredRole && (
                  <p>Required role: <code className="bg-black/20 px-2 py-1 rounded">{requiredRole}</code></p>
                )}
                {currentUser && (
                  <p>Your role: <code className="bg-black/20 px-2 py-1 rounded">{currentUser.role}</code></p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
              
              <Button
                onClick={() => window.location.href = '/admin'}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export function AdminGuard({ children, requiredPermission, requiredRole = 'admin', fallback }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      // Redirect to login with return URL
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (session?.user) {
      // Check role
      const userRole = session.user.role;
      let hasRequiredRole = false;

      if (requiredRole === 'admin') {
        hasRequiredRole = userRole === 'ADMIN';
      } else if (requiredRole === 'instructor') {
        hasRequiredRole = userRole === 'INSTRUCTOR' || userRole === 'ADMIN';
      }

      // For now, we'll simplify permission checking
      // In a full implementation, you'd check specific permissions based on requiredPermission
      setHasPermission(hasRequiredRole);
    }
  }, [session, status, requiredRole, requiredPermission, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    // This will be handled by the useEffect redirect
    return null;
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <PermissionDenied requiredPermission={requiredPermission} requiredRole={requiredRole} />;
  }

  return <>{children}</>;
}

// Higher-order component for protecting admin routes
export function withAdminGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: string,
  requiredRole?: 'admin' | 'instructor'
) {
  return function ProtectedComponent(props: P) {
    return (
      <AdminGuard requiredPermission={requiredPermission} requiredRole={requiredRole}>
        <Component {...props} />
      </AdminGuard>
    );
  };
}

// Hook for checking admin permissions in components
export function useAdminAuth() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = adminAuth.getCurrentUser();
    setCurrentUser(user);
    setIsAuthenticated(adminAuth.isAuthenticated());
  }, []);

  const hasPermission = (permission: string) => {
    return adminAuth.hasPermission(permission);
  };

  const hasRole = (role: string) => {
    return currentUser?.role === role;
  };

  const logout = () => {
    adminAuth.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return {
    currentUser,
    isAuthenticated,
    hasPermission,
    hasRole,
    logout,
    isAdmin: () => hasRole('admin'),
    isInstructor: () => hasRole('instructor') || hasRole('admin')
  };
}
