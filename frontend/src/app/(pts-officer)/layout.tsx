import React from "react"
import { AppSidebar } from "@/components/app-sidebar"

export const dynamic = 'force-dynamic'

export default function PTSOfficerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
