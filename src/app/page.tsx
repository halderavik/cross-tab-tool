import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploader } from "@/components/file-uploader"
import { RecentFiles } from "@/components/recent-files"
import { Features } from "@/components/features"
import { HeroSection } from "@/components/hero-section"
import Link from "next/link"

export const metadata: Metadata = {
  title: "SPSS Analyzer - AI-Powered Data Analysis",
  description: "Upload SPSS files and perform advanced cross-tabulations with AI assistance",
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-background py-20">
        <div className="container">
          <HeroSection />
        </div>
      </section>

      {/* Main Content */}
      <section className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section - Takes up 2/3 of the width */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Your SPSS File</CardTitle>
                <CardDescription>Drag and drop your .sav file or click to browse</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader />
                <div className="mt-4 text-center">
                  <Button asChild size="lg">
                    <Link href="/analyze">Start Analysis</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Files Section - Takes up 1/3 of the width */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Files</CardTitle>
                <CardDescription>Your recently analyzed files</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentFiles />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <Features />
        </div>
      </section>
    </div>
  )
}
