"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Scan,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  RefreshCw,
  FileText,
  Camera,
} from "lucide-react"

// TODO: add icon when manual upload flow is implemented: Upload

interface OCRField {
  field: string
  label: string
  ocrValue: string
  systemValue: string
  status: "match" | "mismatch" | "pending"
  confidence: number
}

interface OCRResult {
  documentType: string
  status: "verified" | "mismatch" | "pending" | "error"
  fields: OCRField[]
  overallConfidence: number
  scannedAt?: string
}

interface DocumentToVerify {
  id: string
  name: string
  type: "license" | "certificate" | "approval" | "education" | "other"
  typeName: string
  fileUrl?: string
  ocrResult?: OCRResult
}

interface OCRDocumentVerificationProps {
  documents: DocumentToVerify[]
  personData: {
    name: string
    licenseNumber: string
    licenseExpiry: string
    licenseIssueDate: string
    position: string
    education: string
    citizenId: string
  }
  onVerificationComplete?: (results: OCRResult[]) => void
}

const mockOCRResults: Record<string, OCRResult> = {
  license: {
    documentType: "ใบอนุญาตประกอบวิชาชีพ",
    status: "verified",
    overallConfidence: 96,
    scannedAt: "28 ม.ค. 2568 10:30",
    fields: [
      { field: "licenseNumber", label: "เลขที่ใบอนุญาต", ocrValue: "พว.123456", systemValue: "พว.123456", status: "match", confidence: 99 },
      { field: "name", label: "ชื่อ-นามสกุล", ocrValue: "นางสาว กชพร บุญเลิศ", systemValue: "นางสาว กชพร บุญเลิศ", status: "match", confidence: 98 },
      { field: "issueDate", label: "วันที่ออก", ocrValue: "30 มี.ค. 2565", systemValue: "30 มี.ค. 2565", status: "match", confidence: 95 },
      { field: "expiryDate", label: "วันหมดอายุ", ocrValue: "29 มี.ค. 2570", systemValue: "29 มี.ค. 2570", status: "match", confidence: 95 },
    ],
  },
  certificate: {
    documentType: "วุฒิบัตรเฉพาะทาง",
    status: "mismatch",
    overallConfidence: 87,
    scannedAt: "28 ม.ค. 2568 10:32",
    fields: [
      { field: "name", label: "ชื่อ-นามสกุล", ocrValue: "นางสาว กชพร บุญเลิศ", systemValue: "นางสาว กชพร บุญเลิศ", status: "match", confidence: 98 },
      { field: "specialization", label: "สาขาวิชา", ocrValue: "การพยาบาลผู้ป่วยวิกฤติ", systemValue: "การพยาบาลผู้ป่วยวิกฤต", status: "mismatch", confidence: 85 },
      { field: "institution", label: "สถาบัน", ocrValue: "มหาวิทยาลัยมหิดล", systemValue: "มหาวิทยาลัยมหิดล", status: "match", confidence: 92 },
      { field: "graduateDate", label: "วันที่สำเร็จการศึกษา", ocrValue: "15 พ.ค. 2563", systemValue: "15 พ.ค. 2563", status: "match", confidence: 90 },
    ],
  },
}

export function OCRDocumentVerification({ documents, personData, onVerificationComplete }: OCRDocumentVerificationProps) {
  void onVerificationComplete
  const [scanning, setScanning] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [ocrResults, setOcrResults] = useState<Record<string, OCRResult>>(mockOCRResults)
  const [selectedDoc, setSelectedDoc] = useState<DocumentToVerify | null>(null)
  void selectedDoc

  const simulateScan = async (docId: string, docType: string) => {
    setScanning(docId)
    setScanProgress(0)

    // Simulate scanning progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setScanProgress(i)
    }

    // Mock result based on document type
    const result: OCRResult = mockOCRResults[docType] || {
      documentType: "เอกสารอื่นๆ",
      status: "verified",
      overallConfidence: 90,
      scannedAt: new Date().toLocaleString("th-TH"),
      fields: [
        { field: "name", label: "ชื่อ-นามสกุล", ocrValue: personData.name, systemValue: personData.name, status: "match", confidence: 95 },
      ],
    }

    setOcrResults((prev) => ({ ...prev, [docType]: result }))
    setScanning(null)
    setScanProgress(0)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            ตรวจสอบแล้ว
          </Badge>
        )
      case "mismatch":
        return (
          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <AlertTriangle className="mr-1 h-3 w-3" />
            พบข้อมูลไม่ตรงกัน
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="mr-1 h-3 w-3" />
            ไม่สามารถอ่านได้
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-secondary text-muted-foreground border-border">
            รอตรวจสอบ
          </Badge>
        )
    }
  }

  const getFieldStatusIcon = (status: string) => {
    switch (status) {
      case "match":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case "mismatch":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const verifiedCount = Object.values(ocrResults).filter((r) => r.status === "verified").length
  const totalDocs = documents.length

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            ตรวจสอบเอกสารด้วย OCR
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              ตรวจสอบแล้ว {verifiedCount}/{totalDocs} เอกสาร
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                documents.forEach((doc) => {
                  if (!ocrResults[doc.type]) {
                    simulateScan(doc.id, doc.type)
                  }
                })
              }}
            >
              <Scan className="mr-2 h-4 w-4" />
              สแกนทั้งหมด
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document List */}
        {documents.map((doc) => {
          const result = ocrResults[doc.type]
          const isScanning = scanning === doc.id

          return (
            <div
              key={doc.id}
              className={`p-4 rounded-lg border transition-colors ${
                result?.status === "mismatch"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : result?.status === "verified"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border bg-secondary/30"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    result?.status === "verified" ? "bg-emerald-500/10" :
                    result?.status === "mismatch" ? "bg-amber-500/10" : "bg-secondary"
                  }`}>
                    <FileCheck className={`h-5 w-5 ${
                      result?.status === "verified" ? "text-emerald-400" :
                      result?.status === "mismatch" ? "text-amber-400" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">{doc.typeName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result && getStatusBadge(result.status)}
                  {!isScanning && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => simulateScan(doc.id, doc.type)}
                      >
                        {result ? (
                          <>
                            <RefreshCw className="mr-1 h-3 w-3" />
                            สแกนใหม่
                          </>
                        ) : (
                          <>
                            <Scan className="mr-1 h-3 w-3" />
                            สแกน OCR
                          </>
                        )}
                      </Button>
                      {result && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedDoc(doc)}>
                              <Eye className="mr-1 h-3 w-3" />
                              ดูผลลัพธ์
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-card border-border">
                            <DialogHeader>
                              <DialogTitle>ผลการตรวจสอบ OCR - {doc.name}</DialogTitle>
                              <DialogDescription>
                                สแกนเมื่อ {result.scannedAt}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Confidence Score */}
                              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">ความแม่นยำโดยรวม</span>
                                  <span className={`font-bold ${
                                    result.overallConfidence >= 90 ? "text-emerald-400" :
                                    result.overallConfidence >= 70 ? "text-amber-400" : "text-red-400"
                                  }`}>
                                    {result.overallConfidence}%
                                  </span>
                                </div>
                                <Progress value={result.overallConfidence} className="h-2" />
                              </div>

                              {/* Field Comparison */}
                              <div className="space-y-3">
                                <p className="text-sm font-medium">การเปรียบเทียบข้อมูล</p>
                                {result.fields.map((field, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded-lg border ${
                                      field.status === "match"
                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                        : field.status === "mismatch"
                                          ? "border-amber-500/30 bg-amber-500/5"
                                          : "border-border bg-secondary/30"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium flex items-center gap-2">
                                        {getFieldStatusIcon(field.status)}
                                        {field.label}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {field.confidence}%
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">ข้อมูลจาก OCR</p>
                                        <p className={field.status === "mismatch" ? "text-amber-400" : ""}>{field.ocrValue}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">ข้อมูลในระบบ</p>
                                        <p>{field.systemValue}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Mismatch Warning */}
                              {result.status === "mismatch" && (
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-amber-400">พบข้อมูลไม่ตรงกัน</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      กรุณาตรวจสอบเอกสารต้นฉบับอีกครั้ง หรือติดต่อผู้ยื่นคำขอเพื่อยืนยันข้อมูล
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button variant="outline">
                                <Camera className="mr-2 h-4 w-4" />
                                ดูเอกสารต้นฉบับ
                              </Button>
                              {result.status === "mismatch" && (
                                <Button variant="outline" className="text-amber-400 hover:text-amber-300">
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  รายงานปัญหา
                                </Button>
                              )}
                              <Button>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                ยืนยันข้อมูลถูกต้อง
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Scanning Progress */}
              {isScanning && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังสแกนเอกสาร...
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                </div>
              )}

              {/* Quick Result Summary */}
              {result && !isScanning && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    ความแม่นยำ: <span className={`font-medium ${
                      result.overallConfidence >= 90 ? "text-emerald-400" : "text-amber-400"
                    }`}>{result.overallConfidence}%</span>
                  </span>
                  <span className="text-muted-foreground">
                    ตรงกัน: {result.fields.filter(f => f.status === "match").length}/{result.fields.length} รายการ
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {/* Overall Summary */}
        {Object.keys(ocrResults).length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">สรุปผลการตรวจสอบ OCR</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ตรวจสอบแล้ว {verifiedCount} เอกสาร, 
                  พบข้อมูลไม่ตรงกัน {Object.values(ocrResults).filter(r => r.status === "mismatch").length} เอกสาร
                </p>
              </div>
              <div className="flex items-center gap-2">
                {Object.values(ocrResults).some(r => r.status === "mismatch") ? (
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    ต้องตรวจสอบเพิ่มเติม
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    ข้อมูลถูกต้องทั้งหมด
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
