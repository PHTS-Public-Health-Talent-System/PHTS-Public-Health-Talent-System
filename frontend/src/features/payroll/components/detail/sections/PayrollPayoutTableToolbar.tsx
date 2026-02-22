'use client'

import { List, Search } from 'lucide-react'
import { CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { PayrollIssueFilter, PayrollSortBy } from '../model/detail.view-model'
import { PAYROLL_ISSUE_FILTER_OPTIONS, PAYROLL_SORT_OPTIONS } from '../model/detail.constants'

type PayrollPayoutTableToolbarProps = {
  activeProfessionLabel: string
  filteredPersonsCount: number
  availableGroups: string[]
  availableDepartments: string[]
  searchQuery: string
  onSearchChange: (value: string) => void
  rateFilter: string
  onRateFilterChange: (value: string) => void
  departmentFilter: string
  onDepartmentFilterChange: (value: string) => void
  issueFilter: PayrollIssueFilter
  onIssueFilterChange: (value: PayrollIssueFilter) => void
  sortBy: PayrollSortBy
  onSortByChange: (value: PayrollSortBy) => void
}

export function PayrollPayoutTableToolbar({
  activeProfessionLabel,
  filteredPersonsCount,
  availableGroups,
  availableDepartments,
  searchQuery,
  onSearchChange,
  rateFilter,
  onRateFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  issueFilter,
  onIssueFilterChange,
  sortBy,
  onSortByChange,
}: PayrollPayoutTableToolbarProps) {
  return (
    <CardHeader className="border-b bg-muted/5 px-6 py-4">
      <div className="space-y-3">
        <CardTitle className="flex min-w-0 items-center gap-2 text-lg">
          <List className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="shrink-0">รายชื่อผู้รับเงิน</span>
          {activeProfessionLabel ? <span className="truncate">- {activeProfessionLabel}</span> : null}
          <span className="ml-2 whitespace-nowrap text-sm font-normal text-muted-foreground">
            (ทั้งหมด {filteredPersonsCount} รายการ)
          </span>
        </CardTitle>
        <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-7">
          <div className="relative w-full sm:col-span-2 lg:col-span-2 xl:col-span-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ, เลขบัตร, ตำแหน่ง, หน่วยงาน..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 bg-background pl-9"
            />
          </div>
          <Select value={rateFilter} onValueChange={onRateFilterChange}>
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="ทุกกลุ่มอัตรา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกกลุ่มอัตรา</SelectItem>
              {availableGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  กลุ่มที่ {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={onDepartmentFilterChange}>
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="ทุกหน่วยงาน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหน่วยงาน</SelectItem>
              {availableDepartments.map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={issueFilter} onValueChange={(v) => onIssueFilterChange(v as PayrollIssueFilter)}>
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="ทุกสถานะตรวจ" />
            </SelectTrigger>
            <SelectContent>
              {PAYROLL_ISSUE_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => onSortByChange(v as PayrollSortBy)}>
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="เรียงลำดับ" />
            </SelectTrigger>
            <SelectContent>
              {PAYROLL_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
  )
}
