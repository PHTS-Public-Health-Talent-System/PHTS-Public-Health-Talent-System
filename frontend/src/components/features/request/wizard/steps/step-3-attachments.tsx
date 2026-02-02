"use client"
import { CloudUpload, FileText, X, AlertCircle, Lightbulb, Download, Eye, ExternalLink } from "lucide-react"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { Attachment, RequestFormData } from "@/types/request.types"

interface Step3Props {
  data: RequestFormData
  onUpload: (type: keyof RequestFormData['files'], file: File) => void
  onRemove: (type: keyof RequestFormData['files']) => void
}

type FileType = keyof RequestFormData['files']

interface UploadZoneProps {
  type: FileType
  title: string
  desc: string
  file: File | null
  existing?: Attachment
  onUpload: (type: FileType, file: File) => void
  onRemove: (type: FileType) => void
  className?: string
}

function UploadZone({ type, title, desc, file, existing, onUpload, onRemove, className }: UploadZoneProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(type, e.target.files[0])
    }
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
  const existingUrl = existing ? `${apiBase}/${existing.file_path}` : ""

  // Create preview URL for newly uploaded file
  const filePreviewUrl = file ? URL.createObjectURL(file) : ""
  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name)
  const isPdf = (name: string) => /\.pdf$/i.test(name)

  // Determine which URL and file info to use
  const currentUrl = file ? filePreviewUrl : existingUrl
  const currentFileName = file ? file.name : existing?.file_name ?? ""
  const canPreview = currentFileName && (isImage(currentFileName) || isPdf(currentFileName))

  return (
    <div className={cn("space-y-6 flex flex-col", className)}>
      <div className="min-h-[3rem]">
        <Label className="font-semibold text-sm block leading-tight">{title}</Label>
        <p className="text-xs text-muted-foreground leading-tight mt-1 line-clamp-2 min-h-[2.5em]">{desc}</p>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Existing file (on server) */}
        {existing && !file && (
          <Card className="border-muted/50 bg-muted/30 h-full">
            <CardContent className="p-3 h-full">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1.5 bg-white rounded-md border shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="grid gap-0.5 min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{existing.file_name}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                {canPreview && (
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => setPreviewOpen(true)}>
                    <Eye className="h-3 w-3 mr-1" /> ดูตัวอย่าง
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs flex-1" asChild>
                  <a href={existingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" /> เปิดแท็บใหม่
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs flex-1" asChild>
                  <a href={existingUrl} download={existing.file_name}>
                    <Download className="h-3 w-3 mr-1" /> ดาวน์โหลด
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty upload zone */}
        {!file && !existing && (
          <div className="border border-dashed border-slate-300 rounded-lg p-0 hover:bg-slate-50 transition-colors text-center cursor-pointer relative group h-full flex flex-col items-center justify-center gap-2 bg-white min-h-[5.5rem]">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center justify-center h-full w-full py-4">
               <div className="p-2 bg-primary/5 rounded-full group-hover:scale-110 transition-transform mb-2">
                 <CloudUpload className="h-5 w-5 text-primary" />
               </div>
               <div className="text-sm font-medium text-slate-700">
                 คลิกเพื่อเลือกไฟล์
               </div>
               <div className="text-[10px] text-muted-foreground">
                 PDF, JPG, PNG (&lt;5MB)
               </div>
            </div>
          </div>
        )}

        {/* Newly uploaded file (local) */}
        {file && (
          <Card className="border-primary/20 bg-primary/5 h-full">
            <CardContent className="p-3 h-full">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1.5 bg-white rounded-md border shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="grid gap-0.5 min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onRemove(type)} className="h-8 w-8 text-slate-400 hover:text-destructive shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-1 mt-2">
                {canPreview && (
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => setPreviewOpen(true)}>
                    <Eye className="h-3 w-3 mr-1" /> ดูตัวอย่าง
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs flex-1" asChild>
                  <a href={filePreviewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" /> เปิดแท็บใหม่
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{currentFileName}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {isImage(currentFileName) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUrl} alt={currentFileName} className="w-full h-auto" />
            )}
            {isPdf(currentFileName) && (
              <iframe src={currentUrl} className="w-full h-[70vh]" title={currentFileName} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function Step3Attachments({ data, onUpload, onRemove }: Step3Props) {
  const getExisting = (type: FileType) =>
    data.attachments?.find((att) => att.file_type === type)
  const existingLicense = getExisting("LICENSE")

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-primary">แนบเอกสารประกอบ</h3>
        <p className="text-sm text-muted-foreground">
          กรุณาแนบเอกสารเพื่อใช้ในการตรวจสอบสิทธิและคำนวณเงิน
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-100 text-blue-800">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <AlertDescription>
           <strong>คำแนะนำ:</strong> กรุณาใช้ไฟล์ภาพหรือ PDF ที่ชัดเจน เพื่อความแม่นยำในการตรวจสอบข้อมูล
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UploadZone
          type="LICENSE"
          title="1. ใบประกอบวิชาชีพ"
          desc="เพื่อตรวจสอบวันหมดอายุ"
          file={data.files.LICENSE}
          existing={existingLicense}
          onUpload={onUpload}
          onRemove={onRemove}
          className="h-full"
        />
        <UploadZone
          type="ORDER"
          title="2. คำสั่งมอบหมายงาน"
          desc="คำสั่งแต่งตั้งในเดือนปัจจุบัน"
          file={data.files.ORDER}
          existing={getExisting("ORDER")}
          onUpload={onUpload}
          onRemove={onRemove}
          className="h-full"
        />
        <UploadZone
          type="OTHER"
          title="3. เอกสารอื่นๆ (ถ้ามี)"
          desc="เช่น วุฒิบัตร/ใบอบรม"
          file={data.files.OTHER}
          existing={getExisting("OTHER")}
          onUpload={onUpload}
          onRemove={onRemove}
          className="h-full"
        />
      </div>
      {(!data.files.LICENSE && !existingLicense || !data.files.ORDER && !getExisting("ORDER")) && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800 mt-4">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertDescription>
            กรุณาแนบเอกสารข้อ 1 (ใบประกอบวิชาชีพ) และข้อ 2 (คำสั่งมอบหมายงาน) ให้ครบถ้วน
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
