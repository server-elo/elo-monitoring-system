import React from 'react';
import { motion } from 'framer-motion';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = ''
}) => {
  const currentValue = value[0] || 0;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    onValueChange([newValue]);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <motion.div
        className="absolute top-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2"
        style={{ left: `${percentage}%` }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      />
    </div>
  );
};

export default Slider;
