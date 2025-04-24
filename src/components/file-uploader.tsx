"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export function FileUploader() {
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const { toast } = useToast()

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.name.endsWith('.sav')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a valid SPSS (.sav) file",
      })
      return
    }

    setIsUploading(true)
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          toast({
            title: "File uploaded successfully",
            description: "Your file is ready for analysis",
          })
          return 100
        }
        return prev + 10
      })
    }, 500)
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-spss-sav': ['.sav'],
    },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
        isDragActive ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25",
        "hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
      )}
    >
      <input {...getInputProps()} />
      <Upload className="h-10 w-10 text-muted-foreground mb-4" />
      <p className="mb-2 text-sm font-medium">Drag & drop your file here or click to browse</p>
      <p className="text-xs text-muted-foreground">Supports SPSS (.sav), CSV, and Excel files</p>
      {isUploading && (
        <div className="w-full mt-4 max-w-xs">
          <Progress value={progress} className="h-1" />
        </div>
      )}
    </div>
  )
}
