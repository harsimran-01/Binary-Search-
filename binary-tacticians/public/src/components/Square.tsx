import React from 'react';
import { cn } from '@/lib/utils';
import { type Player } from '@/utils/gameLogic';

interface SquareProps {
  value: Player;
  onClick: () => void;
  isWinningSquare?: boolean;
  index: number;
}

const Square: React.FC<SquareProps> = ({ value, onClick, isWinningSquare = false, index }) => {
  // Calculate the delay for the entrance animation based on the square's index
  const animationDelay = `${50 * index}ms`;
  
  // Determine the classes for the square based on its value and winning status
  const squareClasses = cn(
    'square',
    value && 'square-active',
    isWinningSquare && 'winning-square'
  );
  
  // Determine the classes for the X or O mark
  const markClasses = cn(
    value === 'X' && 'x-mark',
    value === 'O' && 'o-mark'
  );
  
  // Special class for winning square content
  const contentClasses = cn(
    'square-content',
    isWinningSquare && 'winning-square-content bg-gradient-to-br from-purple-100 to-purple-200 border-primary border-2 shadow-glow'
  );
  
  return (
    <div 
      className={squareClasses}
      onClick={value === null ? onClick : undefined}
      style={{ animationDelay }}
    >
      <div 
        className={contentClasses}
        style={{ 
          opacity: 0,
          animation: 'fade-in 0.3s ease-out forwards',
          animationDelay: `calc(${animationDelay} + 100ms)`
        }}
      >
        {value && (
          <span 
            className={cn(
              markClasses,
              isWinningSquare && 'text-primary scale-110'
            )}
            style={{ 
              opacity: 0,
              animation: 'scale-in 0.3s ease-out forwards',
              animationDelay: `calc(${animationDelay} + 150ms)`
            }}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
};

export default Square;
