'use client'

import { Card } from '@/components/ui/card'
import type { PayrollRow } from '../model/detail.types'
import type { PayrollIssueFilter, PayrollSortBy } from '../model/detail.view-model'
import { PayrollPayoutTable } from './PayrollPayoutTable'
import { PayrollPayoutTableToolbar } from './PayrollPayoutTableToolbar'

type PayrollPayoutTableSectionProps = {
  activeProfessionLabel: string
  filteredPersonsCount: number
  sortedPersons: PayrollRow[]
  availableGroups: string[]
  availableDepartments: string[]
  canEditPayout: boolean
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
  onOpenAllowanceDetail: (person: PayrollRow) => void
  onOpenChecks: (person: PayrollRow) => void
  onEditRow: (person: PayrollRow) => void
}

export function PayrollPayoutTableSection({
  activeProfessionLabel,
  filteredPersonsCount,
  sortedPersons,
  availableGroups,
  availableDepartments,
  canEditPayout,
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
  onOpenAllowanceDetail,
  onOpenChecks,
  onEditRow,
}: PayrollPayoutTableSectionProps) {
  return (
    <Card className="mx-6 border-border shadow-sm md:mx-8">
      <PayrollPayoutTableToolbar
        activeProfessionLabel={activeProfessionLabel}
        filteredPersonsCount={filteredPersonsCount}
        availableGroups={availableGroups}
        availableDepartments={availableDepartments}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        rateFilter={rateFilter}
        onRateFilterChange={onRateFilterChange}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={onDepartmentFilterChange}
        issueFilter={issueFilter}
        onIssueFilterChange={onIssueFilterChange}
        sortBy={sortBy}
        onSortByChange={onSortByChange}
      />

      <PayrollPayoutTable
        sortedPersons={sortedPersons}
        canEditPayout={canEditPayout}
        onOpenAllowanceDetail={onOpenAllowanceDetail}
        onOpenChecks={onOpenChecks}
        onEditRow={onEditRow}
      />

      <div className="flex items-center justify-between border-t bg-muted/5 px-4 py-3 text-xs text-muted-foreground">
        <span>แสดง {sortedPersons.length} รายการ</span>
      </div>
    </Card>
  )
}
