import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Download,
  Filter,
  Search,
  Calendar,
  Star,
  MessageSquare,
  Target,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uatScenarios, uatSuccessCriteria } from '@/lib/testing/uatScenarios';
// import { useToast } from '@/hooks/use-toast'; // Temporarily disabled for build

/**
 * Comprehensive UAT Management Dashboard
 * Tracks testing progress, analyzes feedback, and provides insights
 */

interface UATMetrics {
  totalTesters: number;
  activeSessions: number;
  completedTasks: number;
  averageCompletionRate: number;
  averageSatisfactionScore: number;
  criticalIssues: number;
  averageTaskTime: number;
  errorRate: number;
}

interface UATAnalytics {
  taskPerformance: Array<{
    taskId: string;
    taskTitle: string;
    completionRate: number;
    averageTime: number;
    satisfactionScore: number;
    errorCount: number;
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  }>;
  testerFeedback: Array<{
    id: string;
    testerId: string;
    taskId: string;
    rating: number;
    comment: string;
    category: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  performanceTrends: Array<{
    date: string;
    completionRate: number;
    satisfactionScore: number;
    errorRate: number;
  }>;
}

export const UATDashboard: React.FC = () => {
  // const { toast } = useToast(); // Temporarily disabled for build
  const [metrics, setMetrics] = useState<UATMetrics>({
    totalTesters: 0,
    activeSessions: 0,
    completedTasks: 0,
    averageCompletionRate: 0,
    averageSatisfactionScore: 0,
    criticalIssues: 0,
    averageTaskTime: 0,
    errorRate: 0
  });

  const [analytics, setAnalytics] = useState<UATAnalytics>({
    taskPerformance: [],
    testerFeedback: [],
    performanceTrends: []
  });

  const [sessions, setSessions] = useState<UATSession[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced loading state management with analytics
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);

      // Track loading completion for analytics
      const loadingData = {
        component: 'UATDashboard',
        loadTime: Date.now(),
        sessionsCount: sessions.length,
        analyticsCount: analytics.taskPerformance.length,
        metricsLoaded: !!metrics,
        timestamp: Date.now()
      };

      // Store loading analytics
      localStorage.setItem('uat-dashboard-loading', JSON.stringify(loadingData));
      console.log('UAT Dashboard loaded:', loadingData);
    }, 1500); // Simulate loading time

    return () => clearTimeout(loadingTimer);
  }, [sessions.length, analytics.taskPerformance.length, metrics]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    loadUATData();
  }, [selectedTimeRange, filterCategory]);

  const loadUATData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls to load UAT data
      const response = await fetch(`/api/uat/dashboard?timeRange=${selectedTimeRange}&category=${filterCategory}`);
      const data = await response.json();
      
      setMetrics(data.metrics);
      setAnalytics(data.analytics);
      setSessions(data.sessions);
    } catch (error) {
      console.error('Failed to load UAT data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await fetch('/api/uat/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeRange: selectedTimeRange,
          category: filterCategory,
          includeRawData: true
        })
      });
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `uat-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs_improvement': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const renderMetricsOverview = () => (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Testers</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalTesters}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <Badge variant={metrics.totalTesters >= 30 ? 'default' : 'secondary'}>
              Target: 30 testers
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.averageCompletionRate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2">
            <Progress value={metrics.averageCompletionRate} className="h-2" />
            <Badge variant={metrics.averageCompletionRate >= uatSuccessCriteria.taskCompletionRate.target ? 'default' : 'destructive'}>
              Target: {uatSuccessCriteria.taskCompletionRate.target}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.averageSatisfactionScore.toFixed(1)}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="mt-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= metrics.averageSatisfactionScore
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <Badge variant={metrics.averageSatisfactionScore >= uatSuccessCriteria.userSatisfactionScore.target ? 'default' : 'destructive'}>
              Target: {uatSuccessCriteria.userSatisfactionScore.target}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Issues</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.criticalIssues}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-2">
            <Badge variant={metrics.criticalIssues === 0 ? 'default' : 'destructive'}>
              {metrics.criticalIssues === 0 ? 'No critical issues' : 'Needs attention'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderTaskPerformance = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Task Performance Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.taskPerformance.map((task) => (
            <div key={task.taskId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{task.taskTitle}</h4>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Completion Rate</p>
                  <p className="font-semibold">{task.completionRate}%</p>
                  <Progress value={task.completionRate} className="h-1 mt-1" />
                </div>
                
                <div>
                  <p className="text-gray-600 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Avg. Time</span>
                  </p>
                  <p className="font-semibold">{task.averageTime}m</p>
                </div>
                
                <div>
                  <p className="text-gray-600">Satisfaction</p>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{task.satisfactionScore.toFixed(1)}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-600">Errors</p>
                  <p className="font-semibold text-red-600">{task.errorCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderFeedbackAnalysis = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Tester Feedback</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.testerFeedback
            .filter(feedback => 
              searchTerm === '' || 
              feedback.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
              feedback.category.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .slice(0, 10)
            .map((feedback) => (
              <div key={feedback.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(feedback.priority)}`} />
                    <Badge variant="outline">{feedback.category}</Badge>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= feedback.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(feedback.timestamp).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{feedback.comment}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Tester: {feedback.testerId}</span>
                  <span>Task: {uatScenarios.find(t => t.id === feedback.taskId)?.title}</span>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderActiveSessions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Active Testing Sessions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions
            .filter(session => session.status === 'in_progress')
            .map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{session.testerInfo.name}</p>
                  <p className="text-sm text-gray-600">
                    {session.testerInfo.experience} • {session.testerInfo.device} • {session.testerInfo.browser}
                  </p>
                  <p className="text-xs text-gray-500">
                    Started: {new Date(session.startTime).toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {session.metrics.tasksCompleted}/{session.assignedTasks.length} tasks
                  </p>
                  <Progress 
                    value={(session.metrics.tasksCompleted / session.assignedTasks.length) * 100} 
                    className="h-2 w-20"
                  />
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading UAT Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">UAT Dashboard</h1>
          <p className="text-gray-600">Monitor user acceptance testing progress and feedback</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </Button>

          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportReport} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {renderMetricsOverview()}

      {/* Main Content */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Task Performance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Analysis</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search feedback, tasks, or testers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="collaboration">Collaboration</SelectItem>
              <SelectItem value="ai-tutoring">AI Tutoring</SelectItem>
              <SelectItem value="learning-path">Learning Path</SelectItem>
              <SelectItem value="social">Social Features</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              // Calendar date picker functionality
              console.log('Date Range Picker clicked - Advanced date filtering coming soon!');
              // toast({
              //   title: 'Date Range Picker',
              //   description: 'Advanced date filtering coming soon!',
              // });
            }}
            className="flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Date Range</span>
          </Button>
        </div>

        <TabsContent value="performance">
          {renderTaskPerformance()}
        </TabsContent>

        <TabsContent value="feedback">
          {renderFeedbackAnalysis()}
        </TabsContent>

        <TabsContent value="sessions">
          {renderActiveSessions()}
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Performance Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Trend charts would be implemented here with a charting library</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UATDashboard;
