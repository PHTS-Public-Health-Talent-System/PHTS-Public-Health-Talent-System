'use client';

import { use } from 'react';
import { PayrollDetailContent } from '@/components/payroll/PayrollDetailContent';

export default function HeadHRPayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <PayrollDetailContent
      periodId={id}
      selectedProfession="all"
      basePath={`/head-hr/payroll/${id}`}
      showTable={false}
      showSummary={false}
      showSelector
    />
  );
}
