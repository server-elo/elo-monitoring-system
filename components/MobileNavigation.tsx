import React, { useState, useEffect } from 'react';
import { LearningModule } from '../types';
import MenuIcon from './icons/MenuIcon';
import Sidebar from './Sidebar';

interface MobileNavigationProps {
  modules: LearningModule[];
  selectedModuleId: string | null;
  onSelectModule: (id: string) => void;
  completedModuleIds: string[];
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
  onResetProgress: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  modules,
  selectedModuleId,
  onSelectModule,
  completedModuleIds,
  currentView,
  onViewChange,
  onLogout,
  onResetProgress,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [selectedModuleId, currentView]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleModuleSelect = (moduleId: string) => {
    onSelectModule(moduleId);
    setIsMenuOpen(false);
  };

  const handleViewChange = (view: string) => {
    onViewChange(view);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden bg-brand-bg-medium border-b border-brand-bg-light/20 px-4 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-brand-bg-light transition-colors focus-brand"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            <MenuIcon className="w-6 h-6 text-brand-text-primary" isOpen={isMenuOpen} />
          </button>
          <h1 className="text-lg font-bold text-brand-primary-400">Solidity DevPath</h1>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewChange('achievements')}
            className="p-2 rounded-lg hover:bg-brand-bg-light transition-colors focus-brand"
            aria-label="View achievements"
          >
            <svg className="w-5 h-5 text-brand-accent-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        md:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full bg-brand-bg-medium border-r border-brand-bg-light/20 shadow-2xl">
          {/* Mobile Sidebar Header */}
          <div className="p-4 border-b border-brand-bg-light/20 flex items-center justify-between">
            <h1 className="text-xl font-bold text-brand-primary-400">Solidity DevPath</h1>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-brand-bg-light transition-colors focus-brand"
              aria-label="Close menu"
            >
              <MenuIcon className="w-5 h-5 text-brand-text-primary" isOpen={true} />
            </button>
          </div>

          {/* Mobile Sidebar Content */}
          <div className="h-full overflow-y-auto scrollbar-brand pb-20">
            <Sidebar
              modules={modules}
              selectedModuleId={selectedModuleId}
              onSelectModule={handleModuleSelect}
              completedModuleIds={completedModuleIds}
            />
          </div>

          {/* Mobile Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-brand-bg-medium border-t border-brand-bg-light/20 space-y-2">
            <button
              onClick={() => handleViewChange('achievements')}
              className="w-full btn btn-secondary text-sm"
            >
              My Achievements
            </button>
            <button
              onClick={onResetProgress}
              className="w-full btn btn-error text-sm"
            >
              Reset Progress
            </button>
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full btn btn-ghost text-sm"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
