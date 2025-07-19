import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Send, 
  X,
  FileText,
  Video,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

/**
 * Comprehensive Feedback Collection System for UAT
 * Collects user feedback through multiple channels and formats
 */

interface FeedbackData {
  type: 'rating' | 'survey' | 'bug_report' | 'feature_request' | 'usability';
  rating?: number;
  category: string;
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  steps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  screenRecording?: boolean;
  contactInfo?: {
    email?: string;
    allowFollowUp?: boolean;
  };
  metadata: {
    page: string;
    userAgent: string;
    timestamp: string;
    sessionId: string;
    userId?: string;
  };
}

interface FeedbackCollectionSystemProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    page: string;
    feature: string;
    taskId?: string;
  };
}

export const FeedbackCollectionSystem: React.FC<FeedbackCollectionSystemProps> = ({
  isOpen,
  onClose,
  context
}) => {
  const { toast } = useToast();
  const [feedbackType, setFeedbackType] = useState<FeedbackData['type']>('rating');
  const [formData, setFormData] = useState<Partial<FeedbackData>>({
    type: 'rating',
    category: context?.feature || 'general',
    title: '',
    description: '',
    rating: 5,
    severity: 'medium',
    steps: [''],
    contactInfo: {
      allowFollowUp: false
    }
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPermissions, setRecordingPermissions] = useState({
    screen: false,
    audio: false,
    camera: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize form with context
      setFormData(prev => ({
        ...prev,
        metadata: {
          page: context?.page || window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          sessionId: sessionStorage.getItem('session-id') || 'anonymous',
          userId: localStorage.getItem('user-id') || undefined
        }
      }));
    }
  }, [isOpen, context]);

  const handleRatingChange = (value: number[]) => {
    setFormData(prev => ({ ...prev, rating: value[0] }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...(formData.steps || [''])];
    newSteps[index] = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const addStep = () => {
    setFormData(prev => ({ 
      ...prev, 
      steps: [...(prev.steps || ['']), ''] 
    }));
  };

  const removeStep = (index: number) => {
    const newSteps = (formData.steps || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const requestRecordingPermissions = async () => {
    try {
      // Request screen recording permission
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      setRecordingPermissions(prev => ({ ...prev, screen: true, audio: true }));
      
      // Stop the stream immediately (we just wanted permission)
      screenStream.getTracks().forEach(track => track.stop());
      
      toast({
        title: 'Recording Permissions Granted',
        description: 'You can now record your screen for bug reports.',
      });
    } catch (error) {
      toast({
        title: 'Recording Permission Denied',
        description: 'Screen recording is optional but helps us understand issues better.',
        variant: 'destructive'
      });
    }
  };

  const startRecording = async () => {
    if (!recordingPermissions.screen) {
      await requestRecordingPermissions();
      return;
    }

    try {
      setIsRecording(true);
      toast({
        title: 'Recording Started',
        description: 'Please reproduce the issue you want to report.',
      });
    } catch (error) {
      setIsRecording(false);
      toast({
        title: 'Recording Failed',
        description: 'Unable to start screen recording.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setFormData(prev => ({ ...prev, screenRecording: true }));
    toast({
      title: 'Recording Stopped',
      description: 'Screen recording will be included with your feedback.',
    });
  };

  const submitFeedback = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title and description for your feedback.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: 'Feedback Submitted',
          description: `Thank you! Your feedback ID is: ${result.id}`,
        });

        // Reset form
        setFormData({
          type: 'rating',
          category: 'general',
          title: '',
          description: '',
          rating: 5,
          severity: 'medium',
          steps: [''],
          contactInfo: { allowFollowUp: false }
        });
        
        onClose();
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Unable to submit feedback. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportFeedbackData = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `feedback-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const renderRatingForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rating">Overall Rating</Label>
        <div className="flex items-center space-x-2 mt-2">
          <Slider
            value={[formData.rating || 5]}
            onValueChange={handleRatingChange}
            max={5}
            min={1}
            step={1}
            className="flex-1"
          />
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= (formData.rating || 5)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <select
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="general">General Experience</option>
          <option value="collaboration">Real-time Collaboration</option>
          <option value="ai-tutoring">AI Tutoring</option>
          <option value="authentication">Authentication</option>
          <option value="learning-path">Learning Path</option>
          <option value="code-editor">Code Editor</option>
          <option value="performance">Performance</option>
          <option value="mobile">Mobile Experience</option>
        </select>
      </div>
    </div>
  );

  const renderBugReportForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="severity">Severity</Label>
        <select
          value={formData.severity}
          onChange={(e) => handleInputChange('severity', e.target.value)}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="low">Low - Minor issue</option>
          <option value="medium">Medium - Affects functionality</option>
          <option value="high">High - Major functionality broken</option>
          <option value="critical">Critical - System unusable</option>
        </select>
      </div>

      <div>
        <Label>Steps to Reproduce</Label>
        {(formData.steps || ['']).map((step, index) => (
          <div key={index} className="flex items-center space-x-2 mt-2">
            <Input
              value={step}
              onChange={(e) => handleStepChange(index, e.target.value)}
              placeholder={`Step ${index + 1}`}
              className="flex-1"
            />
            {(formData.steps?.length || 0) > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeStep(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStep}
          className="mt-2"
        >
          Add Step
        </Button>
      </div>

      <div>
        <Label htmlFor="expected">Expected Behavior</Label>
        <Textarea
          value={formData.expectedBehavior || ''}
          onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
          placeholder="What did you expect to happen?"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="actual">Actual Behavior</Label>
        <Textarea
          value={formData.actualBehavior || ''}
          onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
          placeholder="What actually happened?"
          className="mt-1"
        />
      </div>

      <div className="flex items-center space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={isRecording ? stopRecording : startRecording}
          className="flex items-center space-x-2"
        >
          {isRecording ? (
            <>
              <Video className="w-4 h-4 text-red-500" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              {recordingPermissions.screen ? (
                <Camera className="w-4 h-4" />
              ) : (
                <CameraOff className="w-4 h-4 text-gray-400" />
              )}
              <span>{recordingPermissions.screen ? 'Record Screen' : 'Enable Camera'}</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Toggle voice recording functionality
            if (recordingPermissions.audio) {
              toast({
                title: 'Voice Recording',
                description: 'Voice recording feature coming soon!',
              });
            } else {
              requestRecordingPermissions();
            }
          }}
          className="flex items-center space-x-2"
        >
          {recordingPermissions.audio ? (
            <>
              <Mic className="w-4 h-4 text-green-500" />
              <span>Record Voice</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-gray-400" />
              <span>Enable Mic</span>
            </>
          )}
        </Button>

        {formData.screenRecording && (
          <span className="text-sm text-green-600">✓ Recording attached</span>
        )}
      </div>
    </div>
  );

  const renderContactForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          type="email"
          value={formData.contactInfo?.email || ''}
          onChange={(e) => handleInputChange('contactInfo', {
            ...formData.contactInfo,
            email: e.target.value
          })}
          placeholder="your.email@example.com"
          className="mt-1"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={formData.contactInfo?.allowFollowUp || false}
          onCheckedChange={(checked) => handleInputChange('contactInfo', {
            ...formData.contactInfo,
            allowFollowUp: checked
          })}
        />
        <Label>Allow follow-up questions about this feedback</Label>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Share Your Feedback</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportFeedbackData}
                    title="Export feedback data"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Feedback Type Selection */}
                <div>
                  <Label>Feedback Type</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { type: 'rating', label: 'Rating & Review', icon: Star },
                      { type: 'bug_report', label: 'Bug Report', icon: FileText },
                      { type: 'feature_request', label: 'Feature Request', icon: ThumbsUp },
                      { type: 'usability', label: 'Usability Issue', icon: MessageSquare },
                      { type: 'negative_feedback', label: 'Report Issue', icon: ThumbsDown }
                    ].map(({ type, label, icon: Icon }) => (
                      <Button
                        key={type}
                        variant={feedbackType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setFeedbackType(type as FeedbackData['type']);
                          setFormData(prev => ({ ...prev, type: type as FeedbackData['type'] }));
                        }}
                        className="flex items-center space-x-2"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Common Fields */}
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief summary of your feedback"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Please provide detailed feedback..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                {/* Type-specific Forms */}
                {feedbackType === 'rating' && renderRatingForm()}
                {feedbackType === 'bug_report' && renderBugReportForm()}

                {/* Contact Information */}
                {renderContactForm()}

                {/* Context Information */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <Label className="text-sm font-medium">Context Information</Label>
                  <div className="text-xs text-gray-600 mt-1 space-y-1">
                    <div>Page: {formData.metadata?.page}</div>
                    <div>Feature: {context?.feature || 'General'}</div>
                    <div>Browser: {navigator.userAgent.split(' ')[0]}</div>
                    {context?.taskId && <div>Task ID: {context.taskId}</div>}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={submitFeedback}
                    disabled={isSubmitting}
                    className="flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackCollectionSystem;
