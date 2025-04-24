"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl max-w-3xl">
        AI-Powered Cross-Tab platform
      </h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl">
        Upload your SPSS files and perform advanced cross-tabulations with AI assistance. Our
        intelligent agent helps you analyze your data quickly and accurately.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild size="lg">
          <Link href="/analyze">Start Analyzing</Link>
        </Button>
        <Button variant="outline" size="lg">
          Learn More
        </Button>
      </div>
    </div>
  )
}
