import React, { useState, useEffect } from 'react';
import { QuizData, QuizQuestion } from '../types';

interface QuizComponentProps {
  quizData: QuizData;
  moduleId: string; // To identify which module's quiz is completed
  onQuizComplete: (moduleId: string) => void; // Callback when quiz is done
}

const QuizComponent: React.FC<QuizComponentProps> = ({ quizData, moduleId, onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({});
  const [showFeedback, setShowFeedback] = useState<{ [questionId: string]: boolean }>({});
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion: QuizQuestion = quizData.questions[currentQuestionIndex];

  useEffect(() => {
    // Reset state if quizData changes (e.g., new module selected)
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowFeedback({});
    setQuizFinished(false);
  }, [quizData]);

  const handleOptionSelect = (optionId: string) => {
    if (quizFinished) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
    setShowFeedback(prev => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      // Last question answered
      setQuizFinished(true);
      onQuizComplete(moduleId);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
      setQuizFinished(false); // If they go back, quiz isn't "finished" from this state
    }
  };
  
  const isAttempted = showFeedback[currentQuestion.id];
  const selectedOptionId = selectedAnswers[currentQuestion.id];

  // const allQuestionsAttempted = quizData.questions.every(q => showFeedback[q.id]);

  if (!currentQuestion) {
    return <div className="text-brand-text-muted">Loading quiz...</div>;
  }

  return (
    <div className="bg-brand-surface-1 p-6 rounded-lg shadow-md text-brand-text-primary">
      <h3 className="text-lg font-semibold text-brand-accent mb-4">{quizData.title} - Question {currentQuestionIndex + 1} of {quizData.questions.length}</h3>
      
      <div className="mb-6">
        <p className="text-brand-text-secondary text-lg mb-4">{currentQuestion.questionText}</p>
        <div className="space-y-3">
          {currentQuestion.options.map(option => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = currentQuestion.correctOptionId === option.id;
            
            let buttonClass = "w-full text-left p-3 rounded-md transition-colors duration-150 ease-in-out border-2 ";
            if (isAttempted && !quizFinished) { // Feedback style during quiz
              if (isCorrect) {
                buttonClass += "bg-green-500/20 border-green-500 text-green-300";
              } else if (isSelected && !isCorrect) {
                buttonClass += "bg-red-500/20 border-red-500 text-red-300";
              } else {
                 buttonClass += "bg-brand-bg-light border-brand-bg-medium hover:bg-brand-secondary/30 text-brand-text-secondary";
              }
            } else if (quizFinished) { // Style when quiz is fully finished
                if (isCorrect) {
                    buttonClass += "bg-green-600/30 border-green-600 text-green-200";
                } else if (selectedAnswers[currentQuestion.id] === option.id && !isCorrect) { // User selected this wrong answer
                    buttonClass += "bg-red-600/30 border-red-600 text-red-200 opacity-70";
                }
                 else {
                    buttonClass += "bg-brand-bg-light border-transparent text-brand-text-muted opacity-60";
                 }
            }
            else { // Default style before attempt
              buttonClass += `bg-brand-bg-light border-brand-bg-medium hover:bg-brand-secondary/40 text-brand-text-secondary ${isSelected ? 'ring-2 ring-brand-accent' : ''}`;
            }

            return (
              <button
                key={option.id}
                onClick={() => !isAttempted && !quizFinished && handleOptionSelect(option.id)}
                disabled={isAttempted || quizFinished}
                className={buttonClass}
                aria-pressed={isSelected}
              >
                {option.text}
                {isAttempted && !quizFinished && isSelected && (isCorrect ? " (Correct!)" : " (Incorrect)")}
                {isAttempted && !quizFinished && !isSelected && isCorrect && " (Correct Answer)"}
              </button>
            );
          })}
        </div>
      </div>

      {isAttempted && currentQuestion.explanation && (
        <div className={`p-3 rounded-md mt-4 text-sm ${selectedOptionId === currentQuestion.correctOptionId ? 'bg-green-500/10 text-green-200' : 'bg-red-500/10 text-red-200'}`}>
          <h4 className="font-semibold mb-1">Explanation:</h4>
          <p>{currentQuestion.explanation}</p>
        </div>
      )}

      {quizFinished && (
        <div className="mt-6 p-4 bg-brand-primary/20 text-brand-accent rounded-md text-center">
          <h4 className="text-lg font-semibold">Quiz Completed!</h4>
          <p>Your progress for this module has been saved.</p>
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 bg-brand-secondary text-white rounded-md hover:bg-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="text-sm text-brand-text-muted">
            Question {currentQuestionIndex + 1} / {quizData.questions.length}
        </span>
        <button
          onClick={handleNextQuestion}
          disabled={(!isAttempted && !quizFinished) || (currentQuestionIndex === quizData.questions.length - 1 && quizFinished) }
          className="px-4 py-2 bg-brand-secondary text-white rounded-md hover:bg-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {currentQuestionIndex === quizData.questions.length - 1 ? (quizFinished ? 'Finished' : 'Finish Quiz') : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default QuizComponent;