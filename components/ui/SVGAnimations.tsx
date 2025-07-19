import React, { useEffect, useState } from 'react';

interface SVGAnimationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  trigger?: 'hover' | 'click' | 'scroll' | 'auto';
  duration?: number;
  delay?: number;
}

// Animated Loading Spinner
export const SVGLoadingSpinner: React.FC<SVGAnimationProps> = ({
  className = '',
  width = 40,
  height = 40,
  duration = 1
}) => {
  return (
    <svg
      className={`svg-loading-spinner ${className}`}
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="28 28"
        fill="none"
        opacity="0.3"
      />
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="28 28"
        strokeDashoffset="28"
        fill="none"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 20 20;360 20 20"
          dur={`${duration}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dashoffset"
          values="28;0;28"
          dur={`${duration * 2}s`}
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

// Animated Checkmark
export const SVGCheckmark: React.FC<SVGAnimationProps & { 
  checked?: boolean;
  color?: string;
}> = ({
  className = '',
  width = 24,
  height = 24,
  checked = false,
  color = 'currentColor',
  duration = 0.5,
  delay = 0
}) => {
  return (
    <svg
      className={`svg-checkmark ${className}`}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeDasharray={checked ? "63" : "0"}
        strokeDashoffset={checked ? "0" : "63"}
        style={{
          transition: `stroke-dasharray ${duration}s ease ${delay}s, stroke-dashoffset ${duration}s ease ${delay}s`
        }}
      />
      <path
        d="M8 12l2 2 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={checked ? "8" : "0"}
        strokeDashoffset={checked ? "0" : "8"}
        style={{
          transition: `stroke-dasharray ${duration}s ease ${delay + 0.2}s, stroke-dashoffset ${duration}s ease ${delay + 0.2}s`
        }}
      />
    </svg>
  );
};

// Animated Arrow
export const SVGAnimatedArrow: React.FC<SVGAnimationProps & {
  direction?: 'up' | 'down' | 'left' | 'right';
  animated?: boolean;
}> = ({
  className = '',
  width = 24,
  height = 24,
  direction = 'right',
  animated = true,
  duration = 1
}) => {
  const rotationMap = {
    up: '270',
    down: '90',
    left: '180',
    right: '0'
  };

  return (
    <svg
      className={`svg-animated-arrow ${className}`}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotationMap[direction]}deg)` }}
    >
      <path
        d="M5 12h14M12 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={animated ? "20" : "none"}
        strokeDashoffset={animated ? "20" : "0"}
      >
        {animated && (
          <animate
            attributeName="stroke-dashoffset"
            values="20;0;20"
            dur={`${duration}s`}
            repeatCount="indefinite"
          />
        )}
      </path>
    </svg>
  );
};

// Morphing Icon
export const SVGMorphingIcon: React.FC<SVGAnimationProps & {
  icons: string[];
  currentIcon?: number;
}> = ({
  className = '',
  width = 24,
  height = 24,
  icons,
  currentIcon = 0,
  duration = 0.5
}) => {
  const [iconIndex, setIconIndex] = useState(currentIcon);

  useEffect(() => {
    setIconIndex(currentIcon);
  }, [currentIcon]);

  return (
    <svg
      className={`svg-morphing-icon ${className}`}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={icons[iconIndex] || icons[0]}
        fill="currentColor"
        style={{
          transition: `d ${duration}s ease`
        }}
      />
    </svg>
  );
};

// Animated Progress Ring
export const SVGProgressRing: React.FC<SVGAnimationProps & {
  progress: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}> = ({
  className = '',
  width = 60,
  height = 60,
  progress = 0,
  strokeWidth = 4,
  color = 'currentColor',
  backgroundColor = 'rgba(0,0,0,0.1)',
  duration = 1
}) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg
      className={`svg-progress-ring ${className}`}
      width={width}
      height={height}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle
        cx="30"
        cy="30"
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      
      {/* Progress circle */}
      <circle
        cx="30"
        cy="30"
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 30 30)"
        style={{
          transition: `stroke-dashoffset ${duration}s ease`
        }}
      />
      
      {/* Progress text */}
      <text
        x="30"
        y="30"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill={color}
        fontWeight="bold"
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
};

// Animated Wave
export const SVGWave: React.FC<SVGAnimationProps & {
  amplitude?: number;
  frequency?: number;
  color?: string;
}> = ({
  className = '',
  width = 200,
  height = 60,
  amplitude = 20,
  color = 'currentColor',
  duration = 3
}) => {
  // Ensure width and height are numbers for arithmetic operations
  const numWidth = typeof width === 'number' ? width : parseInt(width.toString(), 10) || 200;
  const numHeight = typeof height === 'number' ? height : parseInt(height.toString(), 10) || 60;

  const pathData = `M0,${numHeight/2} Q${numWidth/4},${numHeight/2 - amplitude} ${numWidth/2},${numHeight/2} T${numWidth},${numHeight/2}`;

  return (
    <svg
      className={`svg-wave ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${numWidth} ${numHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={pathData}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      >
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`0,0;${-numWidth},0;0,0`}
          dur={`${duration}s`}
          repeatCount="indefinite"
        />
      </path>

      <path
        d={pathData}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
        transform={`translate(${numWidth}, 0)`}
      >
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`${numWidth},0;0,0;${-numWidth},0`}
          dur={`${duration}s`}
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
};

// Animated Blockchain Icon
export const SVGBlockchainIcon: React.FC<SVGAnimationProps> = ({
  className = '',
  width = 48,
  height = 48,
  duration = 2
}) => {
  return (
    <svg
      className={`svg-blockchain-icon ${className}`}
      width={width}
      height={height}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Block 1 */}
      <rect
        x="4"
        y="16"
        width="12"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeDasharray="40"
        strokeDashoffset="40"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="40;0"
          dur={`${duration}s`}
          begin="0s"
          fill="freeze"
        />
      </rect>
      
      {/* Block 2 */}
      <rect
        x="18"
        y="16"
        width="12"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeDasharray="40"
        strokeDashoffset="40"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="40;0"
          dur={`${duration}s`}
          begin="0.5s"
          fill="freeze"
        />
      </rect>
      
      {/* Block 3 */}
      <rect
        x="32"
        y="16"
        width="12"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeDasharray="40"
        strokeDashoffset="40"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="40;0"
          dur={`${duration}s`}
          begin="1s"
          fill="freeze"
        />
      </rect>
      
      {/* Connection lines */}
      <line
        x1="16"
        y1="22"
        x2="18"
        y2="22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2"
        strokeDashoffset="2"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="2;0"
          dur="0.5s"
          begin="0.7s"
          fill="freeze"
        />
      </line>
      
      <line
        x1="30"
        y1="22"
        x2="32"
        y2="22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2"
        strokeDashoffset="2"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="2;0"
          dur="0.5s"
          begin="1.2s"
          fill="freeze"
        />
      </line>
    </svg>
  );
};

// Interactive SVG Button
export const SVGInteractiveButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}> = ({
  children,
  className = '',
  onClick,
  variant = 'primary'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const variantColors = {
    primary: '#3b82f6',
    secondary: '#6b7280'
  };

  return (
    <button
      className={`relative inline-flex items-center justify-center px-6 py-3 ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2"
          y="2"
          width="96"
          height="36"
          rx="18"
          stroke={variantColors[variant]}
          strokeWidth="2"
          fill="none"
          strokeDasharray={isHovered ? "none" : "10 5"}
          style={{
            transition: 'stroke-dasharray 0.3s ease'
          }}
        />
        
        {isPressed && (
          <circle
            cx="50"
            cy="20"
            r="0"
            fill={variantColors[variant]}
            opacity="0.2"
          >
            <animate
              attributeName="r"
              values="0;50;0"
              dur="0.6s"
              begin="0s"
            />
          </circle>
        )}
      </svg>
      
      <span className="relative z-10 font-medium">
        {children}
      </span>
    </button>
  );
};

export default SVGLoadingSpinner;
