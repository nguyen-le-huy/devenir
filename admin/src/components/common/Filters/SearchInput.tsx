/**
 * Search Input Component
 * Reusable search input with icon
 */
import React from 'react'
import { IconSearch } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchInput({ value, onChange, className, placeholder = 'Search...', ...props }: SearchInputProps) {
  return (
    <div className="relative flex-1">
      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('pl-10', className)}
        {...props}
      />
    </div>
  )
}
