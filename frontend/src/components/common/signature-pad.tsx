"use client"

import React, { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from "@/components/ui/button"
import { Eraser } from "lucide-react"

interface SignaturePadProps {
  onSave: (signatureData: string) => void
  clearLabel?: string
  placeholder?: string
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, clearLabel = "Clear", placeholder }) => {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const clear = () => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
    onSave("")
  }

  const handleEnd = () => {
    setIsEmpty(false)
    // Auto-save on end stroke if desired, or relying on manual save not needed if we track changes?
    // For this implementation, we can just save it or require a button.
    // Let's optimize to auto-update parent state on every stroke end for smoother wizard experience
    if (sigCanvas.current) {
        onSave(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="border rounded-md relative bg-white h-[200px] w-full">
         {isEmpty && placeholder && (
             <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 pointer-events-none select-none">
                 {placeholder}
             </div>
         )}
         <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ className: 'w-full h-full rounded-md' }}
            onEnd={handleEnd}
         />
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground hover:text-destructive">
            <Eraser className="h-4 w-4 mr-2" /> {clearLabel}
        </Button>
      </div>
    </div>
  )
}

export default SignaturePad
