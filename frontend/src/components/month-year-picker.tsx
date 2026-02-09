"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface MonthYearPickerProps {
  value: { month: number; year: number }
  onChange: (value: { month: number; year: number }) => void
  minYear?: number
  maxYear?: number
  placeholder?: string
  disabled?: boolean
}

const thaiMonths = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]

const shortThaiMonths = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
  "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
  "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
]

export function MonthYearPicker({
  value,
  onChange,
  minYear = 2500,
  maxYear = 2600,
  placeholder = "เลือกเดือน/ปี",
  disabled = false,
}: MonthYearPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewYear, setViewYear] = React.useState(value.year)
  const [isEditingYear, setIsEditingYear] = React.useState(false)
  const [yearInput, setYearInput] = React.useState(String(value.year))

  const handleMonthSelect = (month: number) => {
    onChange({ month, year: viewYear })
    setOpen(false)
  }

  const handleYearChange = (delta: number) => {
    const newYear = viewYear + delta
    if (newYear >= minYear && newYear <= maxYear) {
      setViewYear(newYear)
      setYearInput(String(newYear))
    }
  }

  const handleYearInputSubmit = () => {
    const year = parseInt(yearInput)
    if (!isNaN(year) && year >= minYear && year <= maxYear) {
      setViewYear(year)
      setIsEditingYear(false)
    } else {
      setYearInput(String(viewYear))
      setIsEditingYear(false)
    }
  }

  const handleYearInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleYearInputSubmit()
    } else if (e.key === "Escape") {
      setYearInput(String(viewYear))
      setIsEditingYear(false)
    }
  }

  // Generate quick year options
  const currentBuddhistYear = new Date().getFullYear() + 543
  const quickYears = [
    currentBuddhistYear,
    currentBuddhistYear - 1,
    currentBuddhistYear - 2,
    currentBuddhistYear - 3,
    currentBuddhistYear - 4,
    currentBuddhistYear - 5,
  ].filter(y => y >= minYear && y <= maxYear)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-secondary border-border hover:bg-secondary/80",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value.month && value.year ? (
            `${thaiMonths[value.month - 1]} ${value.year}`
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-card border-border" align="start">
        {/* Year Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleYearChange(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {isEditingYear ? (
            <Input
              type="number"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onBlur={handleYearInputSubmit}
              onKeyDown={handleYearInputKeyDown}
              className="w-24 h-8 text-center bg-secondary border-border"
              autoFocus
            />
          ) : (
            <Button
              variant="ghost"
              className="font-semibold text-lg"
              onClick={() => setIsEditingYear(true)}
            >
              พ.ศ. {viewYear}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleYearChange(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Year Selection */}
        <div className="p-2 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2 px-1">ปีล่าสุด</p>
          <div className="flex flex-wrap gap-1">
            {quickYears.map((year) => (
              <Button
                key={year}
                variant={viewYear === year ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setViewYear(year)
                  setYearInput(String(year))
                }}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>

        {/* Month Grid */}
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {thaiMonths.map((month, index) => {
              const isSelected = value.month === index + 1 && value.year === viewYear
              return (
                <Button
                  key={month}
                  variant={isSelected ? "default" : "ghost"}
                  className={cn(
                    "h-10 text-sm",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleMonthSelect(index + 1)}
                >
                  {shortThaiMonths[index]}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              const now = new Date()
              onChange({ month: now.getMonth() + 1, year: now.getFullYear() + 543 })
              setOpen(false)
            }}
          >
            เดือน/ปีปัจจุบัน
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Simple Year Picker Component
interface YearPickerProps {
  value: number
  onChange: (year: number) => void
  minYear?: number
  maxYear?: number
  disabled?: boolean
}

export function YearPicker({
  value,
  onChange,
  minYear = 2500,
  maxYear = 2600,
  disabled = false,
}: YearPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [yearInput, setYearInput] = React.useState(String(value))

  const currentBuddhistYear = new Date().getFullYear() + 543
  
  // Generate year range
  const years = React.useMemo(() => {
    const result = []
    for (let y = currentBuddhistYear + 2; y >= currentBuddhistYear - 10; y--) {
      if (y >= minYear && y <= maxYear) {
        result.push(y)
      }
    }
    return result
  }, [minYear, maxYear, currentBuddhistYear])

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYearInput(e.target.value)
  }

  const handleYearInputSubmit = () => {
    const year = parseInt(yearInput)
    if (!isNaN(year) && year >= minYear && year <= maxYear) {
      onChange(year)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[100px] justify-between bg-secondary border-border hover:bg-secondary/80"
          disabled={disabled}
        >
          {value}
          <ChevronLeft className="h-4 w-4 rotate-[-90deg]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2 bg-card border-border" align="start">
        <div className="mb-2">
          <Input
            type="number"
            placeholder="พิมพ์ปี พ.ศ."
            value={yearInput}
            onChange={handleYearInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleYearInputSubmit()
            }}
            className="h-8 text-center bg-secondary border-border"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto space-y-1">
          {years.map((year) => (
            <Button
              key={year}
              variant={value === year ? "default" : "ghost"}
              size="sm"
              className="w-full justify-center"
              onClick={() => {
                onChange(year)
                setYearInput(String(year))
                setOpen(false)
              }}
            >
              {year}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
