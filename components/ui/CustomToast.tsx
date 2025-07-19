import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

interface CustomToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg border backdrop-blur-md ${getBackgroundColor()}`}
    >
      {getIcon()}
      <span className="text-white text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default CustomToast;
