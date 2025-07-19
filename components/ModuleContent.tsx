
import React, { useState, useEffect } from 'react';
import { LearningModule } from '../types';
import QuizComponent from './QuizComponent';
import CopyButton from './CopyButton';
import { generateDiagramForConcept } from '../services/geminiService'; // Import the new service
import SpinnerIcon from './icons/SpinnerIcon'; // For loading state
import BotIcon from './icons/BotIcon'; // For diagram section title
import { marked } from 'marked'; // Import marked
import { withLearningModuleErrorBoundary } from '@/lib/components/ErrorBoundaryHOCs';

interface ModuleContentProps {
  module: LearningModule | null;
  isApiKeyMissing?: boolean;
  onQuizComplete: (moduleId: string) => void;
}

interface ContentSegment {
  type: 'text' | 'code';
  content: string;
  language?: string; // For code blocks
}

interface DiagramState {
  image: string | null;
  isLoading: boolean;
  error: string | null;
}

const parseModuleContent = (content: string): ContentSegment[] => {
  const segments: ContentSegment[] = [];
  // Adjusted regex to be non-greedy for language and ensure newline after language
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    }
    segments.push({
      type: 'code',
      language: match[1] || 'plaintext',
      content: match[2].trim(), // Keep content as is, trimming handled by pre/code
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.substring(lastIndex) });
  }

  return segments;
};

const ModuleContentComponent: React.FC<ModuleContentProps> = ({ module, isApiKeyMissing, onQuizComplete }) => {
  const [diagramState, setDiagramState] = useState<DiagramState>({
    image: null,
    isLoading: false,
    error: null,
  });

  const handleGenerateDiagram = async () => {
    if (!module || isApiKeyMissing) {
      setDiagramState({
        image: null,
        isLoading: false,
        error: isApiKeyMissing ? "Cannot generate diagram: Gemini API Key is missing." : "Module data is missing."
      });
      return;
    }

    setDiagramState({ image: null, isLoading: true, error: null });

    const prompt = `Create a clear and visually informative diagram to explain the core concepts of: "${module.title}". 
    The diagram should be suitable for a technical learning platform about Solidity and blockchain. 
    Key aspects to illustrate include: "${module.summary}". 
    Relevant keywords for context: ${module.keywords.join(', ')}. 
    Style: Use a clean, modern, flat design. Prefer interconnected nodes, flowcharts, or conceptual maps. Avoid overly cartoonish or overly complex imagery. Ensure text within the diagram (if any) is legible. Output as a PNG.`;

    const result = await generateDiagramForConcept(prompt);

    if (result.base64Image) {
      setDiagramState({ image: result.base64Image, isLoading: false, error: null });
    } else {
      setDiagramState({ image: null, isLoading: false, error: result.error || "Failed to generate diagram." });
    }
  };
  
  useEffect(() => {
    setDiagramState({ image: null, isLoading: false, error: null });
  }, [module]);


  if (!module) {
    let welcomeDetail = "Select a module from the sidebar to start your learning journey.";
    if (isApiKeyMissing) {
      welcomeDetail = "Select a module from the sidebar to view its content. AI features and automatic module loading are unavailable until the Gemini API Key is configured.";
    }

    return (
      <div className="p-8 text-center text-brand-text-muted">
        <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary">Welcome to Solidity DevPath!</h2>
        <p className="text-lg mb-6">{welcomeDetail}</p>
        <div className="mt-8 p-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-300">Select a module to begin your learning journey</p>
        </div>
      </div>
    );
  }

  const contentSegments = parseModuleContent(module.content);

  return (
    <article className="p-6 md:p-8 bg-brand-surface-2 rounded-lg shadow-md text-brand-text-secondary space-y-8">
      <header className="pb-4 border-b border-brand-bg-medium/60">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-brand-primary mb-1">{module.title}</h1>
                <p className="text-sm text-brand-text-muted italic">{module.category} - {module.level}</p>
            </div>
             <span className={`text-xs font-semibold px-3 py-1 rounded-full h-fit
                ${module.level === 'Beginner' ? 'bg-green-600/80 text-green-100' :
                  module.level === 'Intermediate' ? 'bg-yellow-600/80 text-yellow-100' :
                  module.level === 'Advanced' ? 'bg-red-600/80 text-red-100' :
                  module.level === 'Master' ? 'bg-purple-600/80 text-purple-100' :
                  'bg-gray-600/80 text-gray-100'}`}>
                {module.level}
            </span>
        </div>
      </header>
      
      <section>
        <h2 className="text-xl font-semibold text-brand-text-primary mb-2">Summary</h2>
        <p className="text-brand-text-secondary leading-relaxed">{module.summary}</p>
      </section>

      {!isApiKeyMissing && (
        <section className="p-4 border border-brand-bg-light/50 rounded-lg bg-brand-surface-1 shadow">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <BotIcon className="w-6 h-6 text-brand-accent"/>
                    <h2 className="text-lg font-semibold text-brand-accent">Visual Explanation</h2>
                </div>
                <button
                    onClick={handleGenerateDiagram}
                    disabled={diagramState.isLoading || isApiKeyMissing}
                    className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                    {diagramState.isLoading ? (
                        <SpinnerIcon className="w-5 h-5 mr-2 inline" /> 
                    ): null}
                    {diagramState.isLoading ? 'Generating...' : (diagramState.image ? 'Re-generate Diagram' : 'Generate Diagram')}
                </button>
            </div>
            {diagramState.isLoading && (
                <div className="flex items-center justify-center h-48 bg-brand-bg-medium rounded-md p-4">
                    <SpinnerIcon className="w-10 h-10 text-brand-accent" />
                    <p className="ml-3 text-brand-text-muted">Generating diagram, please wait...</p>
                </div>
            )}
            {diagramState.error && !diagramState.isLoading && (
                <div className="p-3 my-2 bg-red-700/20 border border-red-600/50 text-red-200 rounded-md text-sm">
                    <p className="font-semibold">Error generating diagram:</p>
                    <p>{diagramState.error}</p>
                </div>
            )}
            {diagramState.image && !diagramState.isLoading && !diagramState.error && (
                <div className="mt-2 p-2 border border-brand-bg-light/50 rounded-md bg-brand-bg-dark flex justify-center items-center">
                <img 
                    src={diagramState.image} 
                    alt={`AI-generated diagram for ${module.title}`} 
                    className="max-w-full h-auto rounded-md shadow-lg"
                />
                </div>
            )}
            {isApiKeyMissing && (
                 <p className="text-xs text-brand-text-muted mt-2">Diagram generation is disabled. Please configure your Gemini API Key.</p>
            )}
        </section>
      )}


      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-brand-text-primary mb-3">Details</h2>
        {contentSegments.map((segment, index) => {
          if (segment.type === 'code') {
            return (
              <div key={index} className="relative group bg-brand-bg-dark p-4 rounded-md shadow-lg my-4">
                <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-200">
                  <CopyButton textToCopy={segment.content} />
                </div>
                <pre className="text-sm text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">
                  <code>{segment.content}</code>
                </pre>
                {segment.language && segment.language !== 'plaintext' && (
                   <span className="absolute bottom-2 right-2 text-xs text-brand-text-muted opacity-70">{segment.language}</span>
                )}
              </div>
            );
          }
          // For text segments, use marked to parse Markdown
          return (
            <div 
              key={index} 
              className="prose prose-sm md:prose-base max-w-none"
              dangerouslySetInnerHTML={{ __html: marked.parse(segment.content) as string }}
            />
          );
        })}
      </section>

      {module.videoEmbedUrl && (
        <section>
          <h2 className="text-xl font-semibold text-brand-text-primary mb-3">Watch & Learn</h2>
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-md">
            <iframe 
              src={module.videoEmbedUrl}
              title={`${module.title} Video Tutorial`}
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </section>
      )}

      {module.quiz && (
        <section>
          <h2 className="text-xl font-semibold text-brand-text-primary mb-4">Test Your Knowledge</h2>
          <QuizComponent 
            quizData={module.quiz} 
            moduleId={module.id}
            onQuizComplete={onQuizComplete}
          />
        </section>
      )}

      {module.keywords && module.keywords.length > 0 && (
        <footer className="pt-6 border-t border-brand-bg-medium/60">
          <h3 className="text-sm font-semibold text-brand-text-primary mb-2">Keywords:</h3>
          <div className="flex flex-wrap gap-2">
            {module.keywords.map(keyword => (
              <span key={keyword} className="px-3 py-1 bg-brand-bg-medium text-brand-accent text-xs font-medium rounded-full">
                {keyword}
              </span>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
};

// Wrap with learning module error boundary for specialized learning content error handling
const ModuleContent = withLearningModuleErrorBoundary(ModuleContentComponent, {
  name: 'ModuleContent',
  enableRetry: true,
  maxRetries: 2,
  showErrorDetails: process.env.NODE_ENV === 'development'
});

export default ModuleContent;