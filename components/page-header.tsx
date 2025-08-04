"use client"

import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, children, className = "" }: PageHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 xl:mb-4 2xl:mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="mt-2 lg:mt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
