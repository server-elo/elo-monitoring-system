"use client";

import { ReactElement, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaGlobe,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
  FaTrophy,
  FaFire,
  FaChartLine
} from "react-icons/fa";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  githubUsername?: string;
  twitterUsername?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  totalXP: number;
  currentLevel: number;
  streak: number;
  skillLevel: string;
}
interface UserStats {
  completedLessons: number;
  totalLessons: number;
  achievements: number;
  projectsCompleted: number;
  averageScore: number;
  timeSpent: number;
}
export default function ProfilePage(): ReactElement {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
      fetchStats();
    }
  }, [session]);
  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditedProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/user/progress-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedProfile)
      });
      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully"
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = () => {
    setEditedProfile(profile || {});
    setIsEditing(false);
  };
  if (!profile) {
    return (
      <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
      <p className="text-gray-400">Loading profile...</p>
      </div>
      </div>
      </ProtectedRoute>
    );
  }
  const xpForNextLevel = profile.currentLevel * 1000;
  const xpProgress = (profile.totalXP % 1000) / 10;
  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-900 py-12 px-4">
    <div className="max-w-6xl mx-auto">
    {/* Header */}
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8"><h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
    <p className="text-gray-400">
    Manage your profile and track your progress
    </p>
    </motion.div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Profile Card */}
    <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="lg:col-span-1"><Card className="bg-gray-800 border-gray-700">
    <CardContent className="p-6">
    <div className="text-center">
    <div className="relative inline-block">
    <Avatar className="w-32 h-32 mx-auto mb-4">
    <img
    src={
      profile.image ||
      `https://ui-avatars.com/api/?name=${profile.name}&background=3b82f6&color=fff`
    }
    alt={profile.name}
    className="w-full h-full object-cover"
    />
    </Avatar>
    {isEditing && (
      <button className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors">
      <FaCamera className="text-white" />
      </button>
    )}
    </div>
    <h2 className="text-2xl font-bold text-white mb-1">
    {profile.name}
    </h2>
    <p className="text-gray-400 mb-4">{profile.email}</p>
    <div className="flex justify-center gap-2 mb-6">
    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600">
    Level {profile.currentLevel}
    </Badge>
    <Badge className="bg-purple-600/20 text-purple-400 border-purple-600">
    {profile.skillLevel}
    </Badge>
    </div>
    {/* XP Progress */}
    <div className="mb-6">
    <div className="flex justify-between text-sm mb-2">
    <span className="text-gray-400">XP Progress</span>
    <span className="text-gray-400">
    {profile.totalXP} / {xpForNextLevel}
    </span>
    </div>
    <Progress
    value={xpProgress}
    className="h-2 bg-gray-700"
    />
    </div>
    {/* Stats */}
    <div className="grid grid-cols-3 gap-4">
    <div className="text-center">
    <div className="text-2xl font-bold text-blue-400">
    {profile.totalXP}
    </div>
    <div className="text-xs text-gray-400">Total XP</div>
    </div>
    <div className="text-center">
    <div className="text-2xl font-bold text-orange-400 flex items-center justify-center">
    <FaFire className="mr-1" />
    {profile.streak}
    </div>
    <div className="text-xs text-gray-400">Day Streak</div>
    </div>
    <div className="text-center">
    <div className="text-2xl font-bold text-green-400">
    {stats?.achievements || 0}
    </div>
    <div className="text-xs text-gray-400">
    Achievements
    </div>
    </div>
    </div>
    </div>
    </CardContent>
    </Card>
    </motion.div>
    {/* Profile Details */}
    <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="lg:col-span-2"><Card className="bg-gray-800 border-gray-700">
    <CardHeader>
    <div className="flex justify-between items-center">
    <CardTitle className="text-white">
    Profile Information
    </CardTitle>
    {!isEditing ? (
      <Button
      onClick={() => setIsEditing(true)}
      variant="outline"
      size="sm"
      className="border-gray-600 hover:bg-gray-700"><FaEdit className="mr-2" />
      Edit Profile
      </Button>
    ) : (
      <div className="flex gap-2">
      <Button
      onClick={handleSave}
      size="sm"
      disabled={isLoading}
      className="bg-green-600 hover:bg-green-700"><FaSave className="mr-2" />
      Save
      </Button>
      <Button
      onClick={handleCancel}
      variant="outline"
      size="sm"
      disabled={isLoading}
      className="border-gray-600 hover:bg-gray-700"><FaTimes className="mr-2" />
      Cancel
      </Button>
      </div>
    )}
    </div>
    </CardHeader>
    <CardContent className="space-y-6">
    <Tabs defaultValue="info" className="w-full">
    <TabsList className="grid w-full grid-cols-2 bg-gray-700">
    <TabsTrigger value="info">Basic Info</TabsTrigger>
    <TabsTrigger value="social">Social Links</TabsTrigger>
    </TabsList>
    <TabsContent value="info" className="space-y-4 mt-6">
    <div>
    <Label htmlFor="name" className="text-gray-300">
    Name
    </Label>
    {isEditing ? (
      <Input
      id="name"
      value={editedProfile.name || ""}
      onChange={(e) =>
      setEditedProfile({
        ...editedProfile,
        name: e.target.value
      })
    }
    className="bg-gray-700 border-gray-600 text-white"
    />
  ) : (
    <p className="text-white mt-1">{profile.name}</p>
  )}
  </div>
  <div>
  <Label htmlFor="bio" className="text-gray-300">
  Bio
  </Label>
  {isEditing ? (
    <Textarea
    id="bio"
    value={editedProfile.bio || ""}
    onChange={(e) =>
    setEditedProfile({
      ...editedProfile,
      bio: e.target.value
    })
  }
  placeholder="Tell us about yourself..."
  className="bg-gray-700 border-gray-600 text-white"
  rows={4}
  />
) : (
  <p className="text-white mt-1">
  {profile.bio || "No bio yet"}
  </p>
)}
</div>
</TabsContent>
<TabsContent value="social" className="space-y-4 mt-6">
<div>
<Label htmlFor="github" className="text-gray-300">
<FaGithub className="inline mr-2" />
GitHub Username
</Label>
{isEditing ? (
  <Input
  id="github"
  value={editedProfile.githubUsername || ""}
  onChange={(e) =>
  setEditedProfile({
    ...editedProfile,
    githubUsername: e.target.value
  })
}
placeholder="username"
className="bg-gray-700 border-gray-600 text-white"
/>
) : (
  <p className="text-white mt-1">
  {profile.githubUsername || "Not set"}
  </p>
)}
</div>
<div>
<Label htmlFor="twitter" className="text-gray-300">
<FaTwitter className="inline mr-2" />
Twitter Username
</Label>
{isEditing ? (
  <Input
  id="twitter"
  value={editedProfile.twitterUsername || ""}
  onChange={(e) =>
  setEditedProfile({
    ...editedProfile,
    twitterUsername: e.target.value
  })
}
placeholder="@username"
className="bg-gray-700 border-gray-600 text-white"
/>
) : (
  <p className="text-white mt-1">
  {profile.twitterUsername || "Not set"}
  </p>
)}
</div>
<div>
<Label htmlFor="linkedin" className="text-gray-300">
<FaLinkedin className="inline mr-2" />
LinkedIn URL
</Label>
{isEditing ? (
  <Input
  id="linkedin"
  value={editedProfile.linkedinUrl || ""}
  onChange={(e) =>
  setEditedProfile({
    ...editedProfile,
    linkedinUrl: e.target.value
  })
}
placeholder="https://linkedin.com/in/username"
className="bg-gray-700 border-gray-600 text-white"
/>
) : (
  <p className="text-white mt-1">
  {profile.linkedinUrl || "Not set"}
  </p>
)}
</div>
<div>
<Label htmlFor="website" className="text-gray-300">
<FaGlobe className="inline mr-2" />
Website
</Label>
{isEditing ? (
  <Input
  id="website"
  value={editedProfile.websiteUrl || ""}
  onChange={(e) =>
  setEditedProfile({
    ...editedProfile,
    websiteUrl: e.target.value
  })
}
placeholder="https://example.com"
className="bg-gray-700 border-gray-600 text-white"
/>
) : (
  <p className="text-white mt-1">
  {profile.websiteUrl || "Not set"}
  </p>
)}
</div>
</TabsContent>
</Tabs>
</CardContent>
</Card>
{/* Learning Stats */}
{stats && (
  <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
  className="mt-8"><Card className="bg-gray-800 border-gray-700">
  <CardHeader>
  <CardTitle className="text-white flex items-center">
  <FaChartLine className="mr-2" />
  Learning Statistics
  </CardTitle>
  </CardHeader>
  <CardContent>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
  <div>
  <div className="text-3xl font-bold text-blue-400">
  {stats.completedLessons}/{stats.totalLessons}
  </div>
  <div className="text-sm text-gray-400">
  Lessons Completed
  </div>
  </div>
  <div>
  <div className="text-3xl font-bold text-green-400">
  {stats.projectsCompleted}
  </div>
  <div className="text-sm text-gray-400">
  Projects Completed
  </div>
  </div>
  <div>
  <div className="text-3xl font-bold text-purple-400">
  {stats.averageScore}%
  </div>
  <div className="text-sm text-gray-400">
  Average Score
  </div>
  </div>
  <div>
  <div className="text-3xl font-bold text-orange-400">
  {Math.round(stats.timeSpent / 60)}h
  </div>
  <div className="text-sm text-gray-400">
  Time Spent
  </div>
  </div>
  <div>
  <div className="text-3xl font-bold text-yellow-400 flex items-center">
  <FaTrophy className="mr-2" />
  {stats.achievements}
  </div>
  <div className="text-sm text-gray-400">
  Achievements
  </div>
  </div>
  </div>
  </CardContent>
  </Card>
  </motion.div>
)}
</motion.div>
</div>
</div>
</div>
</ProtectedRoute>
);
}