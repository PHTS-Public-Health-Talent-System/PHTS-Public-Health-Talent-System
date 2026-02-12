'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  HelpCircle,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle2,
  Send,
  RotateCcw,
  Paperclip,
  X,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCloseSupportTicket,
  useCreateSupportTicket,
  useCreateSupportTicketMessage,
  useDeleteSupportTicket,
  useMySupportTickets,
  useReopenSupportTicket,
  useSupportTicketMessages,
} from '@/features/support/hooks';
import { buildAttachmentUrl } from '@/app/(user)/user/request-detail-attachments';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'in_progress':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'closed':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open':
      return <Clock className="h-4 w-4" />;
    case 'in_progress':
      return <MessageCircle className="h-4 w-4" />;
    case 'closed':
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

const normalizeStatus = (status: string) => {
  switch (status) {
    case 'OPEN':
    case 'REOPENED':
      return 'open';
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'RESOLVED':
    case 'CLOSED':
      return 'closed';
    default:
      return 'open';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'OPEN':
    case 'REOPENED':
      return 'รอดำเนินการ';
    case 'IN_PROGRESS':
      return 'กำลังดำเนินการ';
    case 'RESOLVED':
      return 'แก้ไขแล้ว';
    case 'CLOSED':
      return 'ปิดแล้ว';
    default:
      return status;
  }
};

const getCategoryLabel = (category?: string | null) => {
  switch ((category ?? '').toLowerCase()) {
    case 'bug':
    case 'issue':
      return 'ปัญหาการใช้งาน';
    case 'question':
      return 'สอบถามข้อมูล';
    case 'suggestion':
      return 'ข้อเสนอแนะ';
    case 'other':
      return 'อื่นๆ';
    default:
      return category || 'อื่นๆ';
  }
};

export function SupportPage() {
  const { data: ticketData = [] } = useMySupportTickets();
  const createTicket = useCreateSupportTicket();
  const createMessage = useCreateSupportTicketMessage();
  const reopenTicket = useReopenSupportTicket();
  const closeTicket = useCloseSupportTicket();
  const deleteTicket = useDeleteSupportTicket();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState({ subject: '', category: '', message: '' });
  const [newTicketFiles, setNewTicketFiles] = useState<File[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const messageTooShort = newTicket.message.trim().length > 0 && newTicket.message.trim().length < 10;

  const tickets = useMemo(
    () =>
      ticketData.map((ticket) => {
        const normalized = normalizeStatus(ticket.status);
        return {
          id: String(ticket.id),
          subject: ticket.subject,
          category: getCategoryLabel(
            (ticket as { metadata?: { category?: string } }).metadata?.category,
          ),
          status: normalized,
          statusLabel: getStatusLabel(ticket.status),
          createdAt: ticket.created_at,
          lastUpdated: ticket.updated_at ?? ticket.created_at,
        };
      }),
    [ticketData],
  );

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  );

  const { data: ticketMessages = [] } = useSupportTicketMessages(
    selectedTicketId ?? undefined,
  );

  const messages = useMemo(
    () =>
      ticketMessages.map((msg) => ({
        sender: msg.sender_role === 'USER' ? 'user' : 'support',
        message: msg.message,
        timestamp: msg.created_at,
        attachments: msg.attachments ?? [],
      })),
    [ticketMessages],
  );

  const handleCreateTicket = () => {
    if (newTicket.message.trim().length < 10) {
      toast.error('กรุณากรอกรายละเอียดอย่างน้อย 10 ตัวอักษร');
      return;
    }
    const formData = new FormData();
    formData.append('subject', newTicket.subject.trim());
    formData.append('description', newTicket.message.trim());
    formData.append('page_url', window.location.href);
    formData.append('user_agent', window.navigator.userAgent);
    formData.append('metadata', JSON.stringify({ category: newTicket.category }));
    newTicketFiles.forEach((file) => formData.append('attachments', file));

    createTicket.mutate(
      formData,
      {
        onSuccess: () => {
          toast.success('สร้าง Ticket เรียบร้อย');
          setIsDialogOpen(false);
          setNewTicket({ subject: '', category: '', message: '' });
          setNewTicketFiles([]);
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
          toast.error(message);
        },
      },
    );
  };

  const handleSendMessage = () => {
    if (!selectedTicketId || !replyMessage.trim()) return;
    const formData = new FormData();
    formData.append('message', replyMessage.trim());
    replyFiles.forEach((file) => formData.append('attachments', file));
    createMessage.mutate(
      { ticketId: selectedTicketId, payload: formData },
      {
        onSuccess: () => {
          setReplyMessage('');
          setReplyFiles([]);
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
          toast.error(message);
        },
      },
    );
  };

  const handleReopen = () => {
    if (!selectedTicketId) return;
    reopenTicket.mutate(selectedTicketId, {
      onSuccess: () => {
        toast.success('เปิด Ticket อีกครั้งแล้ว');
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        toast.error(message);
      },
    });
  };

  const handleCloseTicket = () => {
    if (!selectedTicketId) return;
    closeTicket.mutate(selectedTicketId, {
      onSuccess: () => toast.success('ปิด Ticket เรียบร้อย'),
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        toast.error(message);
      },
    });
  };

  const handleDeleteTicket = () => {
    if (!selectedTicketId) return;
    deleteTicket.mutate(selectedTicketId, {
      onSuccess: () => {
        toast.success('ลบ Ticket เรียบร้อย');
        setSelectedTicketId(null);
        setReplyMessage('');
        setReplyFiles([]);
        setIsDeleteDialogOpen(false);
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        toast.error(message);
      },
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">แจ้งปัญหา / สอบถาม</h1>
          <p className="mt-1 text-muted-foreground">
            ส่ง Ticket แจ้งปัญหาหรือสอบถามข้อมูลเพิ่มเติม
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              สร้าง Ticket ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>สร้าง Ticket ใหม่</DialogTitle>
              <DialogDescription>กรอกรายละเอียดปัญหาหรือคำถามของคุณ</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">หัวข้อ *</Label>
                <Input
                  id="subject"
                  placeholder="กรอกหัวข้อปัญหา"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">ประเภท *</Label>
                <Select
                  value={newTicket.category}
                  onValueChange={(value) => setNewTicket((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">ปัญหาการใช้งาน</SelectItem>
                    <SelectItem value="question">สอบถามข้อมูล</SelectItem>
                    <SelectItem value="suggestion">ข้อเสนอแนะ</SelectItem>
                    <SelectItem value="other">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">รายละเอียด *</Label>
                <Textarea
                  id="message"
                  placeholder="อธิบายรายละเอียดปัญหาหรือคำถาม..."
                  rows={5}
                  value={newTicket.message}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, message: e.target.value }))}
                />
                {messageTooShort && (
                  <p className="text-xs text-destructive">
                    กรุณากรอกรายละเอียดอย่างน้อย 10 ตัวอักษร
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-attachments">แนบไฟล์ / รูปภาพ</Label>
                <Input
                  id="ticket-attachments"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setNewTicketFiles(files);
                  }}
                />
                {newTicketFiles.length > 0 && (
                  <div className="space-y-1 rounded-md border border-border p-2 text-xs text-muted-foreground">
                    {newTicketFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setNewTicketFiles((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={
                  createTicket.isPending ||
                  !newTicket.subject.trim() ||
                  !newTicket.category.trim() ||
                  newTicket.message.trim().length < 10
                }
              >
                <Send className="mr-2 h-4 w-4" />
                ส่ง Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket ทั้งหมด</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-warning">
                  {tickets.filter((t) => t.status === 'open').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">แก้ไขแล้ว</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {tickets.filter((t) => t.status === 'closed').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>รายการ Ticket</CardTitle>
            <CardDescription>คลิกที่ Ticket เพื่อดูรายละเอียด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/50 ${selectedTicket?.id === ticket.id ? 'border-primary bg-accent/50' : 'border-border'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{ticket.id}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`gap-1 flex-shrink-0 ${getStatusColor(ticket.status)}`}
                    >
                      {getStatusIcon(ticket.status)}
                      {ticket.statusLabel}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>สร้าง: {new Date(ticket.createdAt).toLocaleDateString('th-TH')}</span>
                    <span>อัปเดต: {new Date(ticket.lastUpdated).toLocaleDateString('th-TH')}</span>
                  </div>
                </button>
              ))}
              {tickets.length === 0 && (
                <div className="py-8 text-center">
                  <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">ยังไม่มี Ticket</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>รายละเอียด Ticket</CardTitle>
            <CardDescription>
              {selectedTicket ? selectedTicket.id : 'เลือก Ticket เพื่อดูรายละเอียด'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTicket ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{selectedTicket.category}</Badge>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.statusLabel}
                    </Badge>
                    {selectedTicket.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCloseTicket}
                        disabled={closeTicket.isPending}
                      >
                        <CheckCheck className="mr-1.5 h-4 w-4" />
                        ปิด Ticket
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={deleteTicket.isPending}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      ลบ
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{selectedTicket.subject}</h4>
                </div>
                <div className="space-y-4 border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">ข้อความ</h4>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-3 ${msg.sender === 'user' ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'}`}
                    >
                      <p className="text-sm text-foreground">{msg.message}</p>
                      {msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1 rounded border border-border/60 bg-background/60 p-2">
                          {msg.attachments.map((att) => (
                            <a
                              key={att.attachment_id}
                              href={buildAttachmentUrl(att.file_path)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              {att.file_name}
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {msg.sender === 'user' ? 'คุณ' : 'เจ้าหน้าที่'} -{' '}
                        {new Date(msg.timestamp).toLocaleString('th-TH')}
                      </p>
                    </div>
                  ))}
                </div>
                {selectedTicket.status === 'closed' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleReopen}
                    disabled={reopenTicket.isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    เปิด Ticket อีกครั้ง
                  </Button>
                )}
                {selectedTicket.status !== 'closed' && (
                  <div className="space-y-2 border-t border-border pt-4">
                    <Textarea
                      placeholder="พิมพ์ข้อความตอบกลับ..."
                      rows={3}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    />
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        setReplyFiles(files);
                      }}
                    />
                    {replyFiles.length > 0 && (
                      <div className="space-y-1 rounded-md border border-border p-2 text-xs text-muted-foreground">
                        {replyFiles.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setReplyFiles((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="text-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleSendMessage}
                      disabled={!replyMessage.trim() || createMessage.isPending}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      ส่งข้อความ
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">เลือก Ticket จากรายการด้านซ้าย</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              การลบจะนำ Ticket, ข้อความ และไฟล์แนบออกทั้งหมด และไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteTicket}
            >
              ยืนยันลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
