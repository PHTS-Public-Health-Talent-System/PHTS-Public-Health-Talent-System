"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface QuickAction {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface QuickActionsProps {
  title?: string
  actions: QuickAction[]
  columns?: 2 | 3 | 4
}

export function QuickActions({ title = "การดำเนินการด่วน", actions, columns = 4 }: QuickActionsProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${gridCols[columns]}`}>
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={index} href={action.href}>
                <Button 
                  className="w-full justify-start bg-transparent" 
                  variant="outline"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
