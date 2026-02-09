'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useMyRequests, useSubmitRequest, useCancelRequest } from '@/features/request/hooks';
import type { RequestWithDetails } from '@/types/request.types';
import { toRequestDisplayId } from '@/shared/utils/public-id';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <Edit className="h-4 w-4" />;
    case 'PENDING':
      return <Clock className="h-4 w-4" />;
    case 'APPROVED':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />;
    case 'RETURNED':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-muted text-muted-foreground';
    case 'PENDING':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'APPROVED':
      return 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20';
    case 'REJECTED':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'RETURNED':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'แบบร่าง';
    case 'PENDING':
      return 'รอดำเนินการ';
    case 'APPROVED':
      return 'อนุมัติแล้ว';
    case 'PAID':
      return 'จ่ายเงินแล้ว';
    case 'RETURNED':
      return 'ถูกส่งกลับ';
    case 'REJECTED':
      return 'ไม่อนุมัติ';
    default:
      return status;
  }
};

const getPendingStepLabel = (step?: number | null) => {
  switch (step) {
    case 1:
      return 'รอหัวหน้าตึก/หัวหน้างาน';
    case 2:
      return 'รอหัวหน้ากลุ่มงาน';
    case 3:
      return 'รอเจ้าหน้าที่ พ.ต.ส.';
    case 4:
      return 'รอหัวหน้ากลุ่มงานทรัพยากรบุคคล';
    case 5:
      return 'รอหัวหน้าการเงิน';
    case 6:
      return 'รอผู้อำนวยการ';
    default:
      return 'รอดำเนินการ';
  }
};

const statusOptions = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'DRAFT', label: 'แบบร่าง' },
  { value: 'PENDING', label: 'รอดำเนินการ' },
  { value: 'APPROVED', label: 'อนุมัติแล้ว' },
  { value: 'RETURNED', label: 'ถูกส่งกลับ' },
  { value: 'REJECTED', label: 'ไม่อนุมัติ' },
];

export default function MyRequestsPage() {
  const { data, isLoading } = useMyRequests();
  const submitRequest = useSubmitRequest();
  const cancelRequest = useCancelRequest();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const requests = useMemo(() => {
    return (data ?? []).map((request: RequestWithDetails) => ({
      id: String(request.request_id),
      displayId: toRequestDisplayId(request.request_id, request.created_at),
      amount: request.requested_amount,
      status: request.status,
      current_step: request.current_step,
      created_at: request.created_at,
    }));
  }, [data]);

  const filteredRequests = useMemo(() => {
    const needle = searchTerm.toLowerCase();
    return requests.filter((request) => {
      const matchesSearch =
        request.id.toLowerCase().includes(needle) ||
        request.displayId.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      draft: requests.filter((r) => r.status === 'DRAFT').length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
      approved: requests.filter((r) => r.status === 'APPROVED').length,
    }),
    [requests],
  );

  const handleSubmitRequest = (id: string | number) => {
    submitRequest.mutate(id, {
      onSuccess: () => {
        toast.success('ส่งคำขอสำเร็จ');
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        toast.error(message);
      },
    });
  };

  const handleCancelRequest = () => {
    if (!cancelTargetId) return;
    cancelRequest.mutate(cancelTargetId, {
      onSuccess: () => {
        toast.success('ยกเลิกคำขอสำเร็จ');
        setCancelTargetId(null);
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        toast.error(message);
      },
    });
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">คำขอของฉัน</h1>
          <p className="mt-1 text-muted-foreground">จัดการและติดตามคำขอเงิน พ.ต.ส. ของคุณ</p>
        </div>
        <Link href="/user/my-requests/new">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            สร้างคำขอใหม่
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ทั้งหมด</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">แบบร่าง</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p>
              </div>
              <Edit className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))]/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="ค้นหาเลขที่คำขอ หรือ เดือน…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label="ค้นหาเลขที่คำขอ หรือ เดือน"
              name="request_search"
              autoComplete="off"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" aria-label="กรองตามสถานะ">
              <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการคำขอ</CardTitle>
          <CardDescription>พบ {filteredRequests.length} รายการ</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-full rounded-md bg-muted/40" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่คำขอ</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ขั้นตอน</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Link
                        href={`/user/my-requests/${request.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {request.displayId}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {request.amount?.toLocaleString() || '-'} บาท
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${getStatusColor(request.status)}`}>
                        <span aria-hidden="true">{getStatusIcon(request.status)}</span>
                        {request.status === 'PENDING'
                          ? getPendingStepLabel(request.current_step)
                          : getStatusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.current_step ? (
                        <span className="text-sm text-muted-foreground">Step {request.current_step}/6</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.created_at &&
                        new Date(request.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/user/my-requests/${request.id}`}>
                          <Button variant="ghost" size="icon" title="ดูรายละเอียด" aria-label="ดูรายละเอียด">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {request.status === 'DRAFT' && (
                          <Link href={`/user/my-requests/${request.id}/edit`}>
                            <Button variant="ghost" size="icon" title="แก้ไข" aria-label="แก้ไขคำขอ">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {request.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="ส่งคำขอ"
                            onClick={() => handleSubmitRequest(request.id)}
                            disabled={submitRequest.isPending}
                            aria-label="ส่งคำขอ"
                          >
                            <Send className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        {(request.status === 'PENDING' || request.status === 'RETURNED') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="ยกเลิก"
                            onClick={() => setCancelTargetId(request.id)}
                            disabled={cancelRequest.isPending}
                            aria-label="ยกเลิกคำขอ"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          )}

          {!isLoading && filteredRequests.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">ไม่พบรายการคำขอ</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={cancelTargetId !== null} onOpenChange={(open) => (!open ? setCancelTargetId(null) : null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการยกเลิกคำขอ</AlertDialogTitle>
            <AlertDialogDescription>
              เมื่อยกเลิกแล้ว จะไม่สามารถส่งคำขอนี้ต่อได้ ต้องการยืนยันหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRequest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ยืนยันยกเลิก
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
