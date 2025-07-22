"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { SessionManager } from "@/lib/auth/sessionManager";
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "STUDENT" | "INSTRUCTOR" | "MENTOR" | "ADMIN";
}
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
interface AuthActions {
  login: (
    provider?: string;
    credentials?: { email: string;
    password: string;
  },
) => Promise<boolean>;
logout: () => Promise<void>;
register: (data: {
  name: string;
  email: string;
  password: string;
}) => Promise<boolean>;
updateProfile: (data: Partial<AuthUser>) => Promise<boolean>;
}
export function useAuth(): AuthState & AuthActions {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionManager] = useState(() => SessionManager.getInstance());
  // Derived state
  const user: AuthUser | null = session?.user
  ? {
    id: session.user.id || "",
    name: session.user.name || "",
    email: session.user.email || "",
    image: session.user.image || undefined,
    role: (session.user as any).role || "STUDENT"
  }
  : null;
  const isAuthenticated = !!session && !!user;
  const isSessionLoading = status === "loading";
  // Session management integration
  useEffect(() => {
    if (session && user) {
      sessionManager.setSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        lastActivity: new Date(),
        createdAt: new Date(),
        deviceId: "",
        sessionId: ""
      });
    } else {
      sessionManager.clearSession();
    }
  }, [session, user, sessionManager]);
  // Login function
  const login = useCallback(
    async (
      provider: string = "credentials",
      credentials?: { email: string; password: string },
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        let result;
        if (provider === "credentials" && credentials) {
          result = await signIn("credentials", {
            email: credentials.email,
            password: credentials.password,
            redirect: false
          });
        } else {
          result = await signIn(provider, {
            redirect: false,
            callbackUrl: "/"
          });
        }
        if (result?.error) {
          setError(
            result.error === "CredentialsSignin"
            ? "Invalid email or password"
            : "Authentication failed",
          );
          return false;
        }
        if (result?.ok) {
          // Refresh the session to get updated user data
          await update();
          return true;
        }
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [update],
  );
  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut({
        redirect: false,
        callbackUrl: "/"
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setIsLoading(false);
    }
  }, [router]);
  // Register function
  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
    }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || "Registration failed");
          return false;
        }
        // Auto-login after successful registration
        return await login("credentials", {
          email: data.email,
          password: data.password
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registration failed");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [login],
  );
  // Update profile function
  const updateProfile = useCallback(
    async (data: Partial<AuthUser>): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || "Profile update failed");
          return false;
        }
        // Refresh the session to get updated user data
        await update();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Profile update failed");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [update],
  );
  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isSessionLoading,
    error,
    login,
    logout,
    register,
    updateProfile
  };
}
