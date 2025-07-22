import React, { ReactElement } from "react";
("use client");
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LearningDashboard } from "@/components/learning/LearningDashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
export default function LearnPage(): void {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login?callbackUrl=/learn");
    }
  }, [session, status, router]);
  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    );
  }
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <LearningDashboard userId={session.user.id as any} />
      </div>
    </ProtectedRoute>
  );
}
