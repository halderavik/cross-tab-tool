"use client"

import { BarChart3, ExternalLink } from "lucide-react"
import Link from "next/link"

const recentFiles = [
  {
    name: "Customer Survey 2024",
    date: "2023-12-15",
    href: "/analyze/123",
  },
  {
    name: "Employee Feedback Survey",
    date: "2023-11-30",
    href: "/analyze/456",
  },
  {
    name: "Market Research.sav",
    date: "2023-11-15",
    href: "/analyze/789",
  },
]

export function RecentFiles() {
  return (
    <div className="space-y-4">
      {recentFiles.map((file) => (
        <Link
          key={file.name}
          href={file.href}
          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{file.date}</p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </Link>
      ))}
    </div>
  )
}
