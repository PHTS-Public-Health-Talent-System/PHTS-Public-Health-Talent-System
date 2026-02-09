"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Server,
  Database,
  HardDrive,
  RefreshCw,
  Power,
  Download,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  MemoryStick,
  Calendar,
} from "lucide-react"

// TODO: add icons when system telemetry expands: Clock, Wifi

const systemServices = [
  { name: "API Server", status: "online", uptime: "45 วัน 12 ชม.", latency: "45ms", version: "2.1.0" },
  { name: "PostgreSQL", status: "online", uptime: "45 วัน 12 ชม.", latency: "12ms", version: "15.4" },
  { name: "Redis Cache", status: "online", uptime: "45 วัน 12 ชม.", latency: "3ms", version: "7.2" },
  { name: "Queue Worker", status: "online", uptime: "45 วัน 12 ชม.", latency: "N/A", version: "2.1.0" },
  { name: "Cron Jobs", status: "online", uptime: "45 วัน 12 ชม.", latency: "N/A", version: "2.1.0" },
]

const backupHistory = [
  { id: 1, type: "Full Backup", status: "success", size: "2.4 GB", timestamp: "02/02/2568 03:00" },
  { id: 2, type: "Incremental", status: "success", size: "156 MB", timestamp: "01/02/2568 03:00" },
  { id: 3, type: "Incremental", status: "success", size: "142 MB", timestamp: "31/01/2568 03:00" },
  { id: 4, type: "Full Backup", status: "success", size: "2.3 GB", timestamp: "26/01/2568 03:00" },
]

const syncHistory = [
  { id: 1, type: "HRMS Full Sync", status: "success", records: 1234, timestamp: "02/02/2568 12:00" },
  { id: 2, type: "HRMS Incremental", status: "success", records: 15, timestamp: "02/02/2568 06:00" },
  { id: 3, type: "HRMS Incremental", status: "success", records: 8, timestamp: "01/02/2568 18:00" },
]

export default function SystemPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false)
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false)
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)

  const handleMaintenanceToggle = () => {
    if (!maintenanceMode) {
      setIsMaintenanceDialogOpen(true)
    } else {
      setMaintenanceMode(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ตั้งค่าระบบ</h1>
          <p className="text-muted-foreground">
            จัดการและตรวจสอบสถานะระบบ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsSyncDialogOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync HRMS
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsBackupDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Backup Now
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPU Usage</p>
                <p className="text-2xl font-bold text-foreground">23%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-[hsl(var(--success))]" />
              </div>
            </div>
            <Progress value={23} className="mt-3 h-1" />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Memory</p>
                <p className="text-2xl font-bold text-foreground">4.2 GB</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <MemoryStick className="h-5 w-5 text-[hsl(var(--success))]" />
              </div>
            </div>
            <Progress value={52} className="mt-3 h-1" />
            <p className="text-xs text-muted-foreground mt-1">52% of 8 GB</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage</p>
                <p className="text-2xl font-bold text-foreground">45 GB</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[hsl(var(--warning))]/10 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
            </div>
            <Progress value={45} className="mt-3 h-1" />
            <p className="text-xs text-muted-foreground mt-1">45% of 100 GB</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]">45d 12h</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-[hsl(var(--success))]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Services Status */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="h-5 w-5" />
                สถานะบริการ
              </CardTitle>
              <Badge variant="outline" className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                All Systems Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemServices.map((service) => (
              <div key={service.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    service.status === "online" 
                      ? "bg-[hsl(var(--success))] animate-pulse" 
                      : "bg-destructive"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    <p className="text-xs text-muted-foreground">v{service.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{service.latency}</span>
                  <span>{service.uptime}</span>
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Maintenance Mode */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Power className="h-5 w-5" />
              Maintenance Mode
            </CardTitle>
            <CardDescription>
              เปิดโหมดปรับปรุงระบบจะทำให้ผู้ใช้ไม่สามารถเข้าใช้งานได้
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label className="text-base">เปิด Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  ผู้ใช้จะเห็นหน้าแจ้งปรับปรุงระบบแทน
                </p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={handleMaintenanceToggle} />
            </div>

            {maintenanceMode && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Maintenance Mode Active</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  ระบบกำลังอยู่ในโหมดปรับปรุง ผู้ใช้ทั่วไปไม่สามารถเข้าใช้งานได้
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Last Maintenance</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                15 ม.ค. 2568 22:00 - 06:00 (8 ชม.)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Backup History */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                ประวัติ Backup
              </CardTitle>
              <Button variant="ghost" size="sm">
                ดูทั้งหมด
              </Button>
            </div>
            <CardDescription>
              Backup อัตโนมัติทุกวัน 03:00 น.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {backupHistory.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    backup.status === "success" ? "bg-[hsl(var(--success))]" : "bg-destructive"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{backup.type}</p>
                    <p className="text-xs text-muted-foreground">{backup.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{backup.size}</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sync History */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                ประวัติ Sync HRMS
              </CardTitle>
              <Button variant="ghost" size="sm">
                ดูทั้งหมด
              </Button>
            </div>
            <CardDescription>
              Sync อัตโนมัติทุก 6 ชม.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {syncHistory.map((sync) => (
              <div key={sync.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    sync.status === "success" ? "bg-[hsl(var(--success))]" : "bg-destructive"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{sync.type}</p>
                    <p className="text-xs text-muted-foreground">{sync.timestamp}</p>
                  </div>
                </div>
                <Badge variant="outline">{sync.records} records</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Dialog */}
      <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">เปิด Maintenance Mode?</DialogTitle>
            <DialogDescription>
              การเปิด Maintenance Mode จะทำให้ผู้ใช้ทุกคนไม่สามารถเข้าใช้งานระบบได้
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 p-4">
              <p className="text-sm text-[hsl(var(--warning))]">
                คุณแน่ใจหรือไม่ว่าต้องการเปิด Maintenance Mode? กรุณาตรวจสอบว่าไม่มีการทำงานสำคัญที่กำลังดำเนินการอยู่
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setMaintenanceMode(true)
                setIsMaintenanceDialogOpen(false)
              }}
            >
              <Power className="mr-2 h-4 w-4" />
              เปิด Maintenance Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้าง Backup ใหม่</DialogTitle>
            <DialogDescription>
              สร้าง backup ฐานข้อมูลทันที
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-foreground font-medium">Full Backup</p>
              <p className="text-xs text-muted-foreground">
                Backup ข้อมูลทั้งหมดในฐานข้อมูล (ประมาณ 2-3 GB)
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              ใช้เวลาประมาณ 5-10 นาที ระบบจะยังคงทำงานได้ปกติระหว่าง backup
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBackupDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={() => setIsBackupDialogOpen(false)}>
              <Download className="mr-2 h-4 w-4" />
              เริ่ม Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync ข้อมูลจาก HRMS</DialogTitle>
            <DialogDescription>
              ดึงข้อมูลล่าสุดจากระบบ HRMS
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-foreground font-medium">Full Sync</p>
                <p className="text-xs text-muted-foreground">
                  Sync ข้อมูลทั้งหมด (ใช้เวลานาน)
                </p>
              </div>
              <div className="rounded-lg border border-primary p-4 bg-primary/5">
                <p className="text-sm text-foreground font-medium">Incremental Sync (แนะนำ)</p>
                <p className="text-xs text-muted-foreground">
                  Sync เฉพาะข้อมูลที่เปลี่ยนแปลง
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={() => setIsSyncDialogOpen(false)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              เริ่ม Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
