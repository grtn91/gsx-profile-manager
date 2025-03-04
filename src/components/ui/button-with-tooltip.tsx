import React from 'react';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface ButtonWithTooltipProps {
  tooltip: React.ReactNode;
  onClick?: () => void;
  icon: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
}

export function ButtonWithTooltip({
  tooltip,
  onClick,
  icon,
  className = "h-7 w-7",
  variant = "ghost",
  disabled = false,
}: ButtonWithTooltipProps) {
  return (
    <div className="inline-flex">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button
                variant={variant}
                className={className}
                onClick={onClick}
                disabled={disabled}
                type="button"
              >
                {icon}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {typeof tooltip === 'string' ? <p>{tooltip}</p> : tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}