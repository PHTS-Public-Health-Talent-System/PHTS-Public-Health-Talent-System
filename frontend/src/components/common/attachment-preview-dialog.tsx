"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ExternalLink } from "lucide-react"
import Image from "next/image"

interface AttachmentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  previewUrl: string
  previewName: string
}

const isPdfFile = (url: string, name: string) => {
  const lowerUrl = url.toLowerCase()
  const lowerName = name.toLowerCase()
  return (
    lowerUrl.endsWith(".pdf") ||
    lowerName.endsWith(".pdf") ||
    lowerUrl.startsWith("data:application/pdf")
  )
}

const isImageFile = (url: string, name: string) => {
  const lowerUrl = url.toLowerCase()
  const lowerName = name.toLowerCase()
  return (
    lowerUrl.startsWith("data:image") ||
    [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((ext) =>
      lowerUrl.endsWith(ext) || lowerName.endsWith(ext),
    )
  )
}

export function AttachmentPreviewDialog({
  open,
  onOpenChange,
  previewUrl,
  previewName,
}: AttachmentPreviewDialogProps) {
  if (!previewUrl) return null

  const isPdf = isPdfFile(previewUrl, previewName)
  const isImage = isImageFile(previewUrl, previewName)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-base font-semibold">
            {previewName || "ตัวอย่างไฟล์"}
          </DialogTitle>
        </DialogHeader>
        <Separator className="mt-4" />
        <div className="px-6 py-4">
          {isPdf && (
            <div className="h-[70vh] w-full overflow-hidden rounded-lg border bg-muted/20">
              <iframe
                title={previewName}
                src={previewUrl}
                className="h-full w-full"
              />
            </div>
          )}

          {isImage && (
            <div className="flex items-center justify-center rounded-lg border bg-muted/20 p-4">
              <Image
                src={previewUrl}
                alt={previewName}
                width={1200}
                height={900}
                className="max-h-[70vh] w-auto object-contain"
                unoptimized
              />
            </div>
          )}

          {!isPdf && !isImage && (
            <div className="flex h-[40vh] items-center justify-center rounded-lg border bg-muted/20">
              <p className="text-sm text-muted-foreground">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
            </div>
          )}
        </div>
        <Separator />
        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <Button asChild variant="outline" size="sm">
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              เปิดในแท็บใหม่
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
