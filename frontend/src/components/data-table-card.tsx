"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface DataTableCardProps {
  title: string
  viewAllHref?: string
  viewAllLabel?: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function DataTableCard({ 
  title, 
  viewAllHref, 
  viewAllLabel = "ดูทั้งหมด",
  children,
  action
}: DataTableCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {action}
          {viewAllHref && (
            <Link href={viewAllHref}>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                {viewAllLabel}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
