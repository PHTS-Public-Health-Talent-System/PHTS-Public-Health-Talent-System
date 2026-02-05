"use client"

import { FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AttachmentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  previewUrl: string
  previewName: string
}

const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name)
const isPdf = (name: string) => /\.pdf$/i.test(name)

export function AttachmentPreviewDialog({
  open,
  onOpenChange,
  previewUrl,
  previewName,
}: AttachmentPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{previewName}</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[70vh] flex justify-center bg-slate-100 rounded-lg p-4">
          {isImage(previewName) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={previewName} className="max-w-full h-auto object-contain" />
          )}
          {isPdf(previewName) && (
            <iframe src={previewUrl} className="w-full h-[70vh]" title={previewName} />
          )}
          {!isImage(previewName) && !isPdf(previewName) && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <FileText className="h-12 w-12 mb-2" />
              <p>ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
