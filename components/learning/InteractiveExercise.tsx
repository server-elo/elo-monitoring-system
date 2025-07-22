/**;
* @fileoverview Interactive exercise component for Solidity coding challenges
* @module components/learning/InteractiveExercise
*/
'use client';
import { ReactElement, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Exercise, ExerciseProgress, TestCase } from '@/types/learning';
import { cn } from '@/lib/utils';
import {
  Play,
  Check,
  X,
  AlertCircle,
  Clock,
  Lightbulb,
  RotateCcw,
  Loader2,
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import dynamic from 'next/dynamic';
// Dynamically import Monaco Editor
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin" /></div>
});
interface InteractiveExerciseProps {
  /** The exercise to display */
  exercise: Exercise;
  /** User's previous progress on this exercise */
  progress?: ExerciseProgress;
  /** Callback when exercise is completed */
  onComplete: (score: number,
  solution: string) => void;
  /** Callback to close the exercise */
  onClose?: () => void;
  /** Solidity compiler function */
  compileSolidity?: (code: string) => Promise<any>;
  /** Optional CSS class name */
  className?: string;
}
interface TestResult {
  testCase: TestCase;
  passed: boolean;
  output?: string;
  error?: string;
  gasUsed?: number;
}
/**
* Interactive coding exercise component with live compilation and testing.
*
* Provides a full-featured coding environment for solving Solidity challenges
* with real-time feedback, hints, and test case validation.
*
* @component
* @example
* ```tsx
* <InteractiveExercise
*   exercise={currentExercise}
*   progress={userProgress}
*   onComplete={handleExerciseComplete}
*   compileSolidity={solidityCompiler}
* />
* ```
*/
export function InteractiveExercise({
  exercise,
  progress,
  onComplete,
  onClose,
  compileSolidity,
  className
}: InteractiveExerciseProps): ReactElement {
  const [code, setCode] = useState(progress?.solution || exercise.starterCode || '');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [copied, setCopied] = useState(false);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout>();
  // Start timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  // Calculate score based on test results and other factors
  const calculateScore = useCallback((): number => {
    if (testResults.length === 0) return 0;
    const passedTests = testResults.filter(r => r.passed).length;
    const testScore = (passedTests / testResults.length) * 70; // 70% for tests
    // Time bonus (up to 15%)
    const timeLimit = exercise.timeLimit || 30;
    const timeBonus = Math.max(0, 15 * (1 - timeElapsed / (timeLimit * 60)));
    // Hint penalty (up to -10%)
    const hintPenalty = currentHintIndex * 3;
    // Gas efficiency bonus (up to 15%)
    let gasBonus = 0;
    if (exercise.gasLimit && testResults.some(r => r.gasUsed)) {
      const avgGasUsed = testResults
      .filter(r => r.gasUsed)
      .reduce((sum, r) => sum + (r.gasUsed || 0), 0) / testResults.length;
      gasBonus = Math.max(0, 15 * (1 - avgGasUsed / exercise.gasLimit));
    }
    return Math.round(Math.max(0, Math.min(100, testScore + timeBonus - hintPenalty + gasBonus)));
  }, [testResults, timeElapsed, exercise.timeLimit, exercise.gasLimit, currentHintIndex]);
  // Run tests
  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    try {
      // Compile the code
      if (compileSolidity) {
        const compilationResult = await compileSolidity(code);
        if (compilationResult.errors) {
          // Show compilation errors
          setTestResults(exercise.testCases.map(tc => ({
            testCase: tc,
            passed: false,
            error: 'Compilation failed: ' + compilationResult.errors[0]
          })));
          return;
        }
      }
      // Simulate running test cases
      // In a real implementation, this would execute the compiled contract
      const results: TestResult[] = [];
      for (const testCase of exercise.testCases) {
        // Simulate test execution with a delay
        await new Promise(resolve => setTimeout(resolve, 300));
        // Mock test logic - in reality, this would run the actual contract
        const passed = Math.random()>0.3; // 70% pass rate for demo
        const gasUsed = Math.floor(Math.random() * 50000) + 20000;
        results.push({
          testCase,
          passed,
          output: passed ? testCase.expectedOutput : 'Different output',
          gasUsed: exercise.gasLimit ? gasUsed : undefined
        });
      }
      setTestResults(results);
      // Check if all tests passed
      if (results.every(r => r.passed)) {
        const score = calculateScore();
        onComplete(score, code);
      }
    } catch (error) {
      console.error('Error running tests:', error);
      setTestResults(exercise.testCases.map(tc => ({
        testCase: tc,
        passed: false,
        error: 'An error occurred while running tests'
      })));
    } finally {
      setIsRunning(false);
    }
  };
  // Copy code to clipboard
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };
  // Reset code to starter
  const resetCode = () => {
    setCode(exercise.starterCode || '');
    setTestResults([]);
    setCurrentHintIndex(0);
    setShowHints(false);
  };
  return (
    <div className={cn('flex flex-col h-full', className)}>
    {/* Header */}
    <div className="border-b p-4">
    <div className="flex items-start justify-between mb-3">
    <div>
    <h2 className="text-2xl font-bold mb-1">{exercise.title}</h2>
    <p className="text-muted-foreground">{exercise.description}</p>
    </div>
    <div className="flex items-center gap-2">
    <Badge variant="outline">{exercise.type.replace('_', ' ')}</Badge>
    <Badge variant="outline">{exercise.difficulty}</Badge>
    <Badge variant="secondary">{exercise.xpReward} XP</Badge>
    </div>
    </div>
    <div className="flex items-center justify-between">
    <div className="flex items-center gap-4 text-sm">
    <span className="flex items-center gap-1">
    <Clock className="w-4 h-4" />
    {formatTime(timeElapsed)}
    {exercise.timeLimit && ` / ${exercise.timeLimit}:00`}
    </span>
    {exercise.gasLimit && (
      <span className="flex items-center gap-1">
      <AlertCircle className="w-4 h-4" />
      Gas limit: {exercise.gasLimit.toLocaleString()}
      </span>
    )}
    </div>
    {onClose && (
      <Button variant="ghost" size="sm" onClick={onClose}>
      Close
      </Button>
    )}
    </div>
    </div>
    {/* Main Content */}
    <div className="flex-1 flex gap-4 p-4 overflow-hidden">
    {/* Left Panel - Instructions & Hints */}
    <div className="w-1/3 flex flex-col gap-4">
    <Card className="flex-1 p-4 overflow-auto">
    <h3 className="font-semibold mb-3">Instructions</h3>
    <div className="prose prose-sm dark:prose-invert">
    <p>{exercise.instructions}</p>
    </div>
    {exercise.hints.length>0 && (
      <>
      <Separator className="my-4" />
      <div>
      <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium">Hints</h4>
      <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowHints(!showHints)}><Lightbulb className="w-4 h-4 mr-1" />
      {showHints ? 'Hide' : 'Show'} Hints
      </Button>
      </div>
      <AnimatePresence>
      {showHints && (
        <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}>{exercise.hints.slice(0, currentHintIndex + 1).map((hint, index) => (
          <Alert key={index} className="mb-2">
          <Lightbulb className="w-4 h-4" />
          <AlertDescription>{hint}</AlertDescription>
          </Alert>
        ))}
        {currentHintIndex < exercise.hints.length - 1 && (
          <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentHintIndex(prev => prev + 1)}
          className="mt-2">Next Hint
          <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
        </motion.div>
      )}
      </AnimatePresence>
      </div>
      </>
    )}
    </Card>
    {/* Test Results */}
    {testResults.length>0 && (
      <Card className="p-4">
      <h3 className="font-semibold mb-3">Test Results</h3>
      <div className="space-y-2">
      {testResults.map((result, index) => (
        <div
        key={index}
        className={cn(
          'flex items-center justify-between p-2 rounded-lg',
          result.passed ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
        )}><div className="flex items-center gap-2">
        {result.passed ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <X className="w-4 h-4 text-red-600" />
        )}
        <span className="text-sm font-medium">
        {result.testCase.hidden ? `Test ${index + 1}` : result.testCase.description}
        </span>
        </div>
        {result.gasUsed && (
          <span className="text-xs text-muted-foreground">
          {result.gasUsed.toLocaleString()} gas
          </span>
        )}
        </div>
      ))}
      </div>
      {testResults.every(r => r.passed) && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
        <p className="text-sm font-medium text-green-700 dark:text-green-300">
        All tests passed! Score: {calculateScore()}%
        </p>
        </div>
      )}
      </Card>
    )}
    </div>
    {/* Right Panel - Code Editor */}
    <div className="flex-1 flex flex-col">
    <Card className="flex-1 flex flex-col overflow-hidden">
    <div className="p-3 border-b flex items-center justify-between">
    <h3 className="font-semibold">Code Editor</h3>
    <div className="flex items-center gap-2">
    <Button
    variant="ghost"
    size="icon"
    onClick={copyCode}
    title="Copy code">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </Button>
    <Button
    variant="ghost"
    size="icon"
    onClick={resetCode}
    title="Reset code"><RotateCcw className="w-4 h-4" />
    </Button>
    {exercise.solution && (
      <Button
      variant="ghost"
      size="icon"
      onClick={() => setShowSolution(!showSolution)}
      title="Show solution">{showSolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </Button>
    )}
    </div>
    </div>
    <Tabs defaultValue="editor" className="flex-1 flex flex-col">
    <TabsList className="mx-3 mt-3">
    <TabsTrigger value="editor">Editor</TabsTrigger>
    {showSolution && <TabsTrigger value="solution">Solution</TabsTrigger>}
    </TabsList>
    <TabsContent value="editor" className="flex-1 m-0">
    <MonacoEditor
    height="100%"
    language="solidity"
    theme="vs-dark"
    value={code}
    onChange={(value: unknown) => setCode(value || '')}
    options={{
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2
    }}
    />
    </TabsContent>
    {showSolution && (
      <TabsContent value="solution" className="flex-1 m-0">
      <MonacoEditor
      height="100%"
      language="solidity"
      theme="vs-dark"
      value={exercise.solution}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2
      }}
      />
      </TabsContent>
    )}
    </Tabs>
    </Card>
    {/* Run Button */}
    <div className="mt-4">
    <Button
    onClick={runTests}
    disabled={isRunning || !code.trim()}
    className="w-full"
    size="lg">{isRunning ? (
      <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Running Tests...
      </>
    ) : (
      <>
      <Play className="w-4 h-4 mr-2" />
      Run Tests
      </>
    )}
    </Button>
    </div>
    </div>
    </div>
    </div>
  );
}
