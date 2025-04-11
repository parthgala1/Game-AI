
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  color?: 'green' | 'pink' | 'blue' | 'purple';
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  icon?: React.ReactNode;
}

const NeonButton = ({
  children,
  color = 'green',
  size = 'default',
  variant = 'default',
  icon,
  className,
  ...props
}: NeonButtonProps) => {
  const colorClasses = {
    green: 'border-space-neon-green text-space-neon-green shadow-[0_0_10px_rgba(0,255,170,0.3)] hover:shadow-[0_0_15px_rgba(0,255,170,0.5)] hover:bg-space-neon-green/10',
    pink: 'border-space-neon-pink text-space-neon-pink shadow-[0_0_10px_rgba(255,0,170,0.3)] hover:shadow-[0_0_15px_rgba(255,0,170,0.5)] hover:bg-space-neon-pink/10',
    blue: 'border-space-neon-blue text-space-neon-blue shadow-[0_0_10px_rgba(0,170,255,0.3)] hover:shadow-[0_0_15px_rgba(0,170,255,0.5)] hover:bg-space-neon-blue/10',
    purple: 'border-space-neon-purple text-space-neon-purple shadow-[0_0_10px_rgba(170,0,255,0.3)] hover:shadow-[0_0_15px_rgba(170,0,255,0.5)] hover:bg-space-neon-purple/10',
  };

  const sizeClasses = {
    default: 'px-6 py-2',
    sm: 'px-4 py-1 text-sm',
    lg: 'px-8 py-3 text-lg',
  };

  const variantClasses = {
    default: 'bg-space-medium/50',
    outline: 'bg-transparent',
    ghost: 'bg-transparent border-transparent shadow-none hover:shadow-none',
  };

  return (
    <Button
      className={cn(
        'font-future border-2 rounded-md transition-all duration-300 flex items-center gap-2',
        colorClasses[color],
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </Button>
  );
};

export default NeonButton;
