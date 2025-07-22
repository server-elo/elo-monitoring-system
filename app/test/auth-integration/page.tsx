"use client";
import { ReactElement } from "react";
import { useSession } from "next-auth/react";
import { useAuthProgress } from "@/hooks/useAuthProgress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
export default function AuthTestPage(): ReactElement {
  const { data: session, status } = useSession();
  const {
    progress,
    isLoading,
    startLesson,
    completeLesson,
    getModuleProgress,
  } = useAuthProgress();
  const handleTestProgress = async () => {
    // Test starting a lesson
    await startLesson("test-lesson-1", "test-module-1", "test-course-1");
    // Test completing a lesson
    setTimeout(async () => {
      await completeLesson(
        "test-lesson-1",
        85,
        30,
        "test-module-1",
        "test-course-1",
      );
    }, 2000);
  };
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-8">
          Authentication Integration Test
        </h1>
        {/* Session Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Session Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Status:</span>
                <Badge
                  className={
                    status === "authenticated"
                      ? "bg-green-600"
                      : "bg-yellow-600"
                  }
                >
                  {status}
                </Badge>
              </div>
              {session && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">User ID:</span>
                    <span className="text-white font-mono text-sm">
                      {session.user.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{session.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{session.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Role:</span>
                    <Badge className="bg-purple-600">{session.user.role}</Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Progress Tracking */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Progress Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={handleTestProgress}
                disabled={!session || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Test Progress Update
              </Button>
              {progress.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-white font-medium">User Progress:</h3>
                  {progress.map((p, index) => (
                    <div key={index} className="p-3 bg-gray-700 rounded">
                      <div className="text-sm text-gray-300">
                        <div>Lesson: {p.lessonId || "N/A"}</div>
                        <div>
                          Status: <Badge>{p.status}</Badge>
                        </div>
                        {p.score && <div>Score: {p.score}%</div>}
                        <div>Time Spent: {p.timeSpent} min</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Auth Features */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Authentication Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-700 rounded">
                <h3 className="text-white font-medium mb-2">✅ Implemented</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• NextAuth.js with JWT</li>
                  <li>• Google OAuth</li>
                  <li>• GitHub OAuth</li>
                  <li>• Email/Password</li>
                  <li>• Protected Routes</li>
                  <li>• User Profile</li>
                  <li>• Progress Tracking</li>
                  <li>• Dashboard</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-700 rounded">
                <h3 className="text-white font-medium mb-2">
                  🔄 Integration Points
                </h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Learning Dashboard</li>
                  <li>• Code Editor</li>
                  <li>• Achievements</li>
                  <li>• Collaboration</li>
                  <li>• Certificates</li>
                  <li>• Job Board</li>
                  <li>• XP System</li>
                  <li>• Leaderboard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
