import React from 'react';
import { LearningModule, LearningLevel } from '../types';
import CheckIcon from './icons/CheckIcon'; // Import CheckIcon

interface SidebarProps {
  modules: LearningModule[];
  selectedModuleId: string | null;
  onSelectModule: (id: string) => void;
  completedModuleIds: string[]; 
}

interface GroupedByLevel {
  [level: string]: {
    [category: string]: LearningModule[];
  };
}

const LEVEL_ORDER: LearningLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Master'];

const Sidebar: React.FC<SidebarProps> = ({ modules, selectedModuleId, onSelectModule, completedModuleIds }) => {
  const groupedModules = modules.reduce((acc, module) => {
    const level = module.level;
    const category = module.category || 'Uncategorized';

    if (!acc[level]) {
      acc[level] = {};
    }
    if (!acc[level][category]) {
      acc[level][category] = [];
    }
    acc[level][category].push(module);
    return acc;
  }, {} as GroupedByLevel);

  const getLevelColor = (level: LearningLevel): string => {
    switch (level) {
      case 'Beginner': return 'bg-green-500/30 text-green-300';
      case 'Intermediate': return 'bg-yellow-500/30 text-yellow-300';
      case 'Advanced': return 'bg-red-500/30 text-red-300';
      case 'Master': return 'bg-purple-500/30 text-purple-300';
      default: return 'bg-gray-500/30 text-gray-300';
    }
  }

  const totalModules = modules.length;
  const completedCount = completedModuleIds.length;
  const progressPercentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <aside className="w-full md:w-80 bg-brand-bg-medium text-brand-text-primary h-full p-4 overflow-y-auto shadow-xl scrollbar-thin scrollbar-thumb-brand-primary scrollbar-track-brand-bg-dark">
      <h1 className="text-2xl font-bold text-brand-accent">Solidity DevPath</h1>
      <div className="my-4 p-3 bg-brand-surface-1 rounded-md shadow">
        <h3 className="text-sm font-semibold text-brand-text-secondary mb-1">Overall Progress</h3>
        <div className="w-full bg-brand-bg-light rounded-full h-2.5 mb-1">
          <div 
            className="bg-brand-accent h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
            aria-label={`Learning progress: ${progressPercentage}%`}
          ></div>
        </div>
        <p className="text-xs text-brand-text-muted text-right">
          {completedCount} of {totalModules} modules ({progressPercentage}%)
        </p>
      </div>
      <nav className="space-y-6">
        {LEVEL_ORDER.map(level => (
          groupedModules[level] && (
            <div key={level}>
              <h2 className="text-lg font-semibold text-brand-text-primary mb-3 border-b border-brand-bg-light/30 pb-1">{level}</h2>
              {Object.keys(groupedModules[level]).sort().map(category => (
                <div key={category} className="mb-4">
                  <h3 className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2 ml-1">{category}</h3>
                  <ul className="space-y-1">
                    {groupedModules[level][category].map(module => (
                      <li key={module.id}>
                        <button
                          onClick={() => onSelectModule(module.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all duration-150 ease-in-out flex justify-between items-center
                                      ${selectedModuleId === module.id 
                                        ? 'bg-brand-primary text-white font-semibold shadow-lg scale-105' 
                                        : 'hover:bg-brand-bg-light text-brand-text-secondary hover:text-white hover:shadow-md'}`}
                          aria-current={selectedModuleId === module.id ? "page" : undefined}
                        >
                          <span className="flex items-center">
                            {completedModuleIds.includes(module.id) && (
                              <CheckIcon className="w-4 h-4 text-green-400 mr-2 shrink-0" />
                            )}
                            {module.title}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(module.level)}`}>
                            {module.level.substring(0,3)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;