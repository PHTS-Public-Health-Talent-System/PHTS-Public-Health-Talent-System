"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

// TODO: add command palette experience when search UX is upgraded: Command*

export interface Person {
  id: string
  name: string
  position?: string
  department?: string
  profession?: string
}

interface PersonPickerProps {
  persons: Person[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function PersonPicker({
  persons,
  value,
  onChange,
  placeholder = "เลือกบุคลากร",
  disabled = false,
}: PersonPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedPerson = persons.find((p) => p.id === value)

  // Filter persons based on search
  const filteredPersons = React.useMemo(() => {
    if (!search) return persons
    const searchLower = search.toLowerCase()
    return persons.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.department && p.department.toLowerCase().includes(searchLower)) ||
        (p.position && p.position.toLowerCase().includes(searchLower)) ||
        (p.profession && p.profession.toLowerCase().includes(searchLower))
    )
  }, [persons, search])

  // Group by department
  const groupedPersons = React.useMemo(() => {
    const groups: Record<string, Person[]> = {}
    filteredPersons.forEach((p) => {
      const dept = p.department || "อื่นๆ"
      if (!groups[dept]) groups[dept] = []
      groups[dept].push(p)
    })
    return groups
  }, [filteredPersons])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-secondary border-border hover:bg-secondary/80"
          disabled={disabled}
        >
          {selectedPerson ? (
            <div className="flex flex-col items-start text-left">
              <span className="font-medium truncate max-w-[250px]">{selectedPerson.name}</span>
              {selectedPerson.department && (
                <span className="text-xs text-muted-foreground">{selectedPerson.department}</span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-card border-border" align="start">
        <div className="flex items-center border-b border-border px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="ค้นหาชื่อ, หน่วยงาน, ตำแหน่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setSearch("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {filteredPersons.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              ไม่พบบุคลากร
            </div>
          ) : (
            <div className="p-1">
              {Object.entries(groupedPersons).map(([dept, deptPersons]) => (
                <div key={dept} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground sticky top-0 bg-card">
                    {dept} ({deptPersons.length})
                  </div>
                  {deptPersons.map((person) => (
                    <div
                      key={person.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-2 cursor-pointer rounded-md hover:bg-secondary/50",
                        value === person.id && "bg-primary/10"
                      )}
                      onClick={() => {
                        onChange(person.id)
                        setOpen(false)
                        setSearch("")
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{person.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {person.position}
                        </p>
                      </div>
                      {person.profession && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {person.profession}
                        </Badge>
                      )}
                      {value === person.id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          แสดง {filteredPersons.length} จาก {persons.length} คน
        </div>
      </PopoverContent>
    </Popover>
  )
}
