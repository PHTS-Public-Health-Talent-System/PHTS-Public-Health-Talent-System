"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface StatItem {
  title: string
  value: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  trend?: string
  trendUp?: boolean
}

interface StatCardsProps {
  stats: StatItem[]
  columns?: 2 | 3 | 4
}

export function StatCards({ stats, columns = 4 }: StatCardsProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Link key={index} href={stat.href}>
            <Card className="transition-all hover:shadow-md hover:border-primary/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  {stat.trend && (
                    <div className={cn(
                      "flex items-center text-xs font-medium",
                      stat.trendUp ? "text-emerald-600" : "text-muted-foreground"
                    )}>
                      {stat.trendUp ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {stat.trend}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  {stat.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
