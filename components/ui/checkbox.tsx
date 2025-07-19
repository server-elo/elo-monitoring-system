import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel
}) => {
  const handleChange = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      onClick={handleChange}
      disabled={disabled}
      className={`
        relative w-5 h-5 border-2 border-gray-300 rounded-md
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${checked ? 'bg-blue-500 border-blue-500' : 'bg-white hover:border-gray-400'}
        ${className}
      `}
    >
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default Checkbox;
