"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useData } from "@/lib/data-context"

// Temporarily hardcoded for testing
const BACKEND_URL = "http://localhost:8000"

export function FileUploader() {
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const { toast } = useToast()
  const { setDataFile, setDataLoaded, setVariables } = useData()

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file type
    const fileExtension = file.name.toLowerCase().split('.').pop() || ''
    if (!['sav', 'csv'].includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a valid SPSS (.sav) or CSV (.csv) file",
      })
      return
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 50MB",
      })
      return
    }

    setIsUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', fileExtension)

      console.log('Uploading to:', `${BACKEND_URL}/api/upload`)
      
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Server error: ${response.status}`)
      }

      const data = await response.json()
      console.log('Upload successful:', data)
      
      // Update the data context with the uploaded file info
      if (data && typeof data === 'object' && 'variables' in data) {
        setDataFile(data)
        setDataLoaded(true)
        setVariables(Array.isArray(data.variables) ? data.variables : [])
      }

      toast({
        title: "File uploaded successfully",
        description: "Your file is ready for analysis",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload. Please try again.",
      })
    } finally {
      setIsUploading(false)
      setProgress(100)
    }
  }, [toast, setDataFile, setDataLoaded, setVariables])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.sav'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
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
      <p className="text-xs text-muted-foreground">Supports SPSS (.sav) and CSV (.csv) files up to 50MB</p>
      {isUploading && (
        <div className="w-full mt-4 max-w-xs">
          <Progress value={progress} className="h-1" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {progress}% uploaded
          </p>
        </div>
      )}
    </div>
  )
}
