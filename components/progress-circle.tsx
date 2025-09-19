"use client"

import { cn } from "@/lib/utils"

interface ProgressCircleProps {
  percentage: number
  size?: number
  strokeWidth?: number
  className?: string
  showText?: boolean
  variant?: 'default' | 'minimal' | 'bold'
}

export function ProgressCircle({ 
  percentage, 
  size = 20, 
  strokeWidth = 2, 
  className,
  showText = false,
  variant = 'default'
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  // Cores modernas baseadas na porcentagem - alinhadas com shadcn
  const getProgressColor = () => {
    if (percentage >= 100) return "hsl(142.1 76.2% 36.3%)" // green-600
    if (percentage >= 75) return "hsl(221.2 83.2% 53.3%)" // blue-500
    if (percentage >= 50) return "hsl(47.9 95.8% 53.1%)" // yellow-500
    if (percentage >= 25) return "hsl(24.6 95% 53.1%)" // orange-500
    return "hsl(210 40% 80%)" // gray-300
  }

  const getTextColor = () => {
    if (percentage >= 100) return "text-green-600"
    if (percentage >= 75) return "text-blue-500"
    if (percentage >= 50) return "text-yellow-600"
    if (percentage >= 25) return "text-orange-500"
    return "text-muted-foreground"
  }

  // Estilos baseados na variante
  const getContainerStyles = () => {
    switch (variant) {
      case 'minimal':
        return "relative inline-flex items-center justify-center"
      case 'bold':
        return cn(
          "relative inline-flex items-center justify-center",
          "rounded-full bg-background border-2 border-border",
          "shadow-md hover:shadow-lg transition-shadow duration-200"
        )
      default:
        return cn(
          "relative inline-flex items-center justify-center",
          "rounded-full bg-background/80 backdrop-blur-sm",
          "ring-1 ring-border/30 shadow-sm hover:shadow-md",
          "transition-all duration-200"
        )
    }
  }

  return (
    <div className={cn(getContainerStyles(), className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(210 40% 88%)"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getProgressColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{
            filter: percentage >= 100 ? 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.4))' : 
                   percentage >= 75 ? 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.3))' :
                   'drop-shadow(0 0 2px rgba(0,0,0,0.1))'
          }}
        />
      </svg>
      {/* Percentage text */}
      {showText && (
        <span className={cn(
          "absolute font-bold leading-none select-none",
          size >= 24 ? "text-xs" : size >= 18 ? "text-[9px]" : "text-[8px]",
          getTextColor(),
          "drop-shadow-sm"
        )}>
          {percentage}
        </span>
      )}
    </div>
  )
}
