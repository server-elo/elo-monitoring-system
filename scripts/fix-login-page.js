#!/usr/bin/env node
const { readFileSync, writeFileSync, existsSync } = require("fs");
const { execSync } = require("child_process");

console.log("🔧 Fixing login page syntax errors...");

const loginFile = "app/auth/login/page.tsx";
if (existsSync(loginFile)) {
  const content = `"use client";

import React, { useState, useEffect, Suspense, ReactElement } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Chrome,
  ArrowRight,
  Shield,
  Loader2
} from "lucide-react";
import { GlassCard } from "@/components/ui/Glass";
import { AsyncSubmitButton } from "@/components/ui/EnhancedButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { loginSchema, type LoginData } from "@/lib/auth/password";
import { cn } from "@/lib/utils";
import { withAuthErrorBoundary } from "@/lib/components/ErrorBoundaryHOCs";

function LoginPageContent(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const error = searchParams.get("error");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur"
  });

  useEffect(() => {
    if (error) {
      switch (error) {
        case "CredentialsSignin":
          setAuthError("Invalid email or password. Please try again.");
          break;
        case "EmailSignin":
          setAuthError("Unable to send email. Please try again later.");
          break;
        case "OAuthSignin":
          setAuthError("OAuth sign-in failed. Please try again.");
          break;
        case "OAuthCallback":
          setAuthError("OAuth callback error. Please try again.");
          break;
        case "OAuthCreateAccount":
          setAuthError("Could not create OAuth account. Please try again.");
          break;
        case "EmailCreateAccount":
          setAuthError("Could not create account. Please try again.");
          break;
        case "Callback":
          setAuthError("Authentication callback error. Please try again.");
          break;
        case "OAuthAccountNotLinked":
          setAuthError(
            "This email is already associated with another account. Please sign in with your original method."
          );
          break;
        case "SessionRequired":
          setAuthError("Please sign in to access this page.");
          break;
        default:
          setAuthError("An authentication error occurred. Please try again.");
      }
    }
  }, [error]);

  const onSubmit = async (data: LoginData): Promise<void> => {
    try {
      setIsLoading(true);
      setAuthError("");
      
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false
      });

      if (result?.error) {
        setAuthError("Invalid email or password. Please check your credentials and try again.");
        return;
      }

      if (result?.ok) {
        const session = await getSession();
        if (session?.user) {
          router.push(returnUrl);
          router.refresh();
        } else {
          setAuthError("Authentication successful but session creation failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "github" | "google"): Promise<void> => {
    try {
      setIsLoading(true);
      await signIn(provider, { callbackUrl: returnUrl });
    } catch (error) {
      console.error(\`\${provider} sign-in error:\`, error);
      setAuthError(\`Failed to sign in with \${provider}. Please try again.\`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400">Sign in to your Solidity learning account</p>
        </div>

        {/* Main Form */}
        <GlassCard className="p-8">
          {/* Error Display */}
          {authError && (
            <ErrorMessage message={authError} className="mb-6" />
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <AsyncSubmitButton
              onClick={() => handleOAuthSignIn("github")}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>Continue with GitHub</span>
            </AsyncSubmitButton>
            
            <AsyncSubmitButton
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 rounded-lg transition-colors"
            >
              <Chrome className="w-5 h-5" />
              <span>Continue with Google</span>
            </AsyncSubmitButton>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">Or continue with email</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("email")}
                  type="email"
                  className={cn(
                    "w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    errors.email && "border-red-500 focus:ring-red-500"
                  )}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className={cn(
                    "w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    errors.password && "border-red-500 focus:ring-red-500"
                  )}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <AsyncSubmitButton
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </AsyncSubmitButton>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <a href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign up here
              </a>
            </p>
            <a href="/auth/reset-password" className="text-gray-400 hover:text-gray-300 text-sm">
              Forgot your password?
            </a>
          </div>
        </GlassCard>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            By signing in, you agree to our{" "}
            <a href="/terms" className="text-gray-400 hover:text-gray-300">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="text-gray-400 hover:text-gray-300">Privacy Policy</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
function LoginPage(): ReactElement {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

export default withAuthErrorBoundary(LoginPage);
`;

  writeFileSync(loginFile, content);
  console.log("✅ Fixed login page syntax");
  
  try {
    execSync("git add app/auth/login/page.tsx");
    execSync('git commit -m "fix: repair login page syntax errors\n\n🔧 Fixed app/auth/login/page.tsx:\n- Removed incorrect semicolons after string literals\n- Fixed import statements and component structure\n- Added proper ReactElement return types\n- Applied clean TypeScript patterns\n\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>"');
    console.log("✅ Committed login page fixes");
  } catch (error) {
    console.log("⚠️ Commit failed:", error.message);
  }
} else {
  console.log("❌ Login file not found");
}

console.log("🎉 Login page fix complete!");