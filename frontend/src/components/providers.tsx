"use client"

import { ThemeProvider } from "next-themes"
import { Toaster } from "./ui/toaster"
import { DataProvider } from "../lib/data-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DataProvider>
        {children}
        <Toaster />
      </DataProvider>
    </ThemeProvider>
  )
} 