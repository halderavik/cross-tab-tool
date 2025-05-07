"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useData } from "@/contexts/data-context"
import { useRouter } from "next/navigation"

// Temporarily hardcoded for testing
const BACKEND_URL = "http://localhost:8000"

interface VariableData {
  name: string;
  label?: string;
  type?: string;
  value_labels?: Record<string | number, string>;
  missing_values?: (string | number)[];
}

export function FileUploader() {
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const { toast } = useToast()
  const { setDataFile, setDataLoaded, setVariables, setSampleData } = useData()
  const router = useRouter()

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
      console.log('=== DEBUG: File Upload Response ===')
      console.log('Raw response:', data)
      console.log('Sample data:', data.sample_data ? data.sample_data.slice(0, 2) : 'No sample data')
      console.log('Variables:', data.variables)
      console.log('Columns:', data.columns)
      console.log('================================')
      
      // Update the data context with the uploaded file info
      if (data && typeof data === 'object') {
        setDataFile({
          file: acceptedFiles[0],
          filePath: data.filepath || null,
          name: acceptedFiles[0]?.name || 'Untitled',
          id: data.file_id || null
        })
        setDataLoaded(true)
        
        // Map variables if they exist and are in the correct format
        let mappedVariables = []
        
        // Log the structure of data.variables
        console.log('=== DEBUG: Variables Data ===')
        if (data.variables) {
          console.log('Variables exists:', {
            type: typeof data.variables,
            isArray: Array.isArray(data.variables),
            keys: Object.keys(data.variables),
            hasData: data.variables && Object.keys(data.variables).length > 0
          })
        } else {
          console.log('No variables data found')
        }
        
        if (data.variables && typeof data.variables === 'object') {
          try {
            if (Array.isArray(data.variables)) {
              console.log('Processing array of column names')
              // Convert array of column names to proper variable objects
              mappedVariables = data.variables
                .filter((name: string) => typeof name === 'string' && name.length > 0)
                .map((name: string, idx: number) => ({
                  id: idx,
                  name: name,
                  label: name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
                  type: "numeric", // Default type since we don't have metadata
                  value_labels: {},
                  missing_values: [],
                }))
            } else {
              // Handle object format (keeping existing code)
              console.log('Processing object format variables')
              mappedVariables = Object.entries(data.variables)
                .filter(([name, meta]) => name && meta)
                .map(([name, meta], idx) => {
                  const m = meta as any
                  return {
                    id: idx,
                    name: name,
                    label: (m.label as string) || name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
                    type: (m.type as string) || "numeric",
                    value_labels: m.value_labels || {},
                    missing_values: m.missing_values || [],
                  }
                })
            }
            
            console.log('Mapped variables result:', {
              count: mappedVariables.length,
              firstVariable: mappedVariables[0],
              sampleVariables: mappedVariables.slice(0, 5) // Log first 5 variables
            })
            
            if (mappedVariables.length > 0) {
              console.log(`Successfully mapped ${mappedVariables.length} variables`)
              setVariables(mappedVariables)
            } else {
              console.warn('No variables were mapped')
              setVariables([])
            }
          } catch (error) {
            console.error('Error mapping variables:', error)
            console.error('Original variables data:', data.variables)
            setVariables([])
          }
        } else {
          console.warn('Invalid or missing variables data in response')
          setVariables([])
        }
        
        // Handle sample data
        if (data.sample_data) {
          console.log('Processing sample data:', {
            rowCount: data.sample_data.length,
            columns: data.columns || Object.keys(data.sample_data[0] || {})
          })
          
          const sampleColumns = Array.isArray(data.columns) 
            ? data.columns 
            : Object.keys(data.sample_data[0] || {})
          
          setSampleData({
            columns: sampleColumns,
            data: data.sample_data
          })
        } else {
          console.warn('No sample data in response')
          setSampleData({ columns: [], data: [] })
        }
        
        router.push("/analyze")
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
  }, [toast, setDataFile, setDataLoaded, setVariables, setSampleData, router])

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
      {...(getRootProps({}) as any)}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
        isDragActive ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25",
        "hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
      )}
    >
      <input {...(getInputProps({}) as any)} />
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
