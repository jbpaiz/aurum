import * as React from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  return (
    <span className={`relative inline-flex items-center ${className} group`}> 
      <span className="cursor-help">{children}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full mb-2 hidden w-max max-w-xs rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg leading-tight group-hover:block dark:bg-gray-700"
      >
        {content}
      </span>
    </span>
  )
}

export default Tooltip
