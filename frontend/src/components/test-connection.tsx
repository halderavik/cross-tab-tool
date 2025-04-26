"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export function TestConnection() {
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")

  const testConnection = async () => {
    try {
      setStatus("Testing connection...")
      setError("")
      
      console.log(`Testing connection to: ${BACKEND_URL}/api/test-connection`)
      const response = await fetch(`${BACKEND_URL}/api/test-connection`)
      const data = await response.json()
      
      if (response.ok) {
        setStatus(`Success: ${data.message}`)
      } else {
        setError(`Error: ${data.detail || "Unknown error"}`)
      }
    } catch (err) {
      setError(`Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Test API Connection</h2>
      <Button onClick={testConnection} className="mb-4">
        Test Connection
      </Button>
      {status && <p className="text-green-600">{status}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
} 