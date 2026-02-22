import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo = ({ size = 'md', className }: LogoProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const iconSizes = {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28
  };

  const innerSizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-9 h-9",
    xl: "w-12 h-12"
  };

  return (
    <div className={cn(
      "bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-sm",
      sizeClasses[size],
      className
    )}>
      <div className={cn(
        "rounded-full border-2 border-white flex items-center justify-center",
        innerSizeClasses[size]
      )}>
        <Check size={iconSizes[size]} strokeWidth={3} className="text-white" />
      </div>
    </div>
  );
};
