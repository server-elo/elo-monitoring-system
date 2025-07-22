'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
} from 'lucide-react'
interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}
interface QuizComponentProps {
  questions: QuizQuestion[]
  onComplete: (score: number) => void
  moduleTitle: string
}
export default function QuizComponent({
  questions,
  onComplete,
  moduleTitle,
}: QuizComponentProps): void {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set(),
  )
  const [showExplanation, setShowExplanation] = useState(false)
  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const handleAnswerSelect = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
  }
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer
    setShowResult(true)
    setShowExplanation(true)
    if (isCorrect && !answeredQuestions.has(currentQuestionIndex)) {
      setScore(score + 1)
      setAnsweredQuestions(
        new Set([...answeredQuestions, currentQuestionIndex]),
      )
    }
  }
  const handleNextQuestion = () => {
    if (isLastQuestion) {
      onComplete(score)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setShowExplanation(false)
    }
  }
  const handleRetry = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setShowExplanation(false)
    setScore(0)
    setAnsweredQuestions(new Set())
  }
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400 bg-green-400/10'
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'hard':
        return 'text-red-400 bg-red-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }
  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-text-primary mb-2">
          {moduleTitle} - Quiz
        </h2>
        <div className="flex items-center justify-between mb-4">
          <span className="text-brand-text-secondary">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}
          >
            {currentQuestion.difficulty}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="h-2 bg-brand-surface-2 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
          />
        </div>
      </div>
      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-brand-surface-1 rounded-xl p-6 mb-6"
        >
          <h3 className="text-xl font-semibold text-brand-text-primary mb-6">
            {currentQuestion.question}
          </h3>
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === currentQuestion.correctAnswer
              const showCorrectness = showResult && (isSelected || isCorrect)
              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  disabled={showResult}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    showCorrectness
                      ? isCorrect
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-red-500 bg-red-500/10'
                      : isSelected
                        ? 'border-brand-accent bg-brand-accent/10'
                        : 'border-brand-border hover:border-brand-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`${
                        showCorrectness
                          ? isCorrect
                            ? 'text-green-400'
                            : 'text-red-400'
                          : 'text-brand-text-primary'
                      }`}
                    >
                      {option}
                    </span>
                    {showCorrectness && (
                      <div>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : isSelected ? (
                          <XCircle className="h-5 w-5 text-red-400" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
              >
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium mb-1">
                      Explanation
                    </p>
                    <p className="text-blue-300/80 text-sm">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-brand-text-secondary">
          Score:{' '}
          <span className="font-semibold text-brand-accent">
            {score}/{questions.length}
          </span>
        </div>
        <div className="flex gap-3">
          {showResult ? (
            <>
              {isLastQuestion ? (
                <>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-brand-surface-2 text-brand-text-primary rounded-lg hover:bg-brand-surface-3 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retry Quiz
                  </button>
                  <button
                    onClick={() => onComplete(score)}
                    className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent-dark transition-colors flex items-center gap-2"
                  >
                    Complete
                    <Trophy className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent-dark transition-colors flex items-center gap-2"
                >
                  Next Question
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
