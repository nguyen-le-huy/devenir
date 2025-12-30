/**
 * Select Filter Component
 * Reusable select dropdown for filtering
 */
import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface SelectFilterProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
  className?: string
}

export function SelectFilter({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  className,
}: SelectFilterProps) {
  return (
    <div className={className}>
      {label && <label className="text-sm font-medium mb-2 block">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.icon ? (
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              ) : (
                option.label
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
