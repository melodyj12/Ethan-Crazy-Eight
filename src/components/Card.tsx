import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType } from '../types';
import { getSuitSymbol, getSuitColor } from '../utils';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isPlayable?: boolean;
  isFaceDown?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  onClick, 
  isPlayable = false, 
  isFaceDown = false,
  className = ""
}) => {
  if (isFaceDown) {
    return (
      <motion.div
        layout
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative w-16 h-24 sm:w-24 sm:h-36 rounded-lg bg-indigo-700 border-2 border-white shadow-md flex items-center justify-center overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 border-white/30 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white/20 rounded-full" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: 0,
        boxShadow: isPlayable ? "0 0 15px rgba(59, 130, 246, 0.5)" : "0 4px 6px -1px rgb(0 0 0 / 0.1)"
      }}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`relative w-16 h-24 sm:w-24 sm:h-36 rounded-lg bg-white border border-slate-200 flex flex-col p-1 sm:p-2 cursor-pointer select-none ${isPlayable ? 'ring-2 ring-blue-400' : ''} ${className}`}
    >
      <div className={`text-xs sm:text-lg font-bold leading-none ${getSuitColor(card.suit)}`}>
        {card.rank}
      </div>
      <div className={`text-xs sm:text-sm leading-none ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </div>
      
      <div className={`flex-1 flex items-center justify-center text-2xl sm:text-5xl ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </div>
      
      <div className={`text-xs sm:text-lg font-bold leading-none self-end rotate-180 ${getSuitColor(card.suit)}`}>
        {card.rank}
      </div>
      <div className={`text-xs sm:text-sm leading-none self-end rotate-180 ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </div>
    </motion.div>
  );
};
