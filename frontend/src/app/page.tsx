import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/file-uploader";
import { RecentFiles } from "@/components/recent-files";
import { Features } from "@/components/features";
import { HeroSection } from "@/components/hero-section";
import Link from "next/link";
import { TestConnection } from "@/components/test-connection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Hero Section */}
      <section className="relative bg-background py-20 w-full">
        <div className="w-full px-0">
          <HeroSection />
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full max-w-5xl mx-auto py-12">
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Upload Section - Takes up most of the width */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Data File</CardTitle>
                <CardDescription>Drag and drop your SPSS (.sav) or CSV file or click to browse</CardDescription>
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

          {/* Recent Files Section - Fixed width on large screens */}
          <div className="w-full lg:w-[350px] flex-shrink-0">
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
        <div className="mt-16 w-full">
          <Features />
        </div>

        <div className="mt-16 w-full">
          <TestConnection />
        </div>
      </section>
    </div>
  )
} 