"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, Search, CheckCircle2 } from "lucide-react"
import { AlertCircle } from "lucide-react"

export interface HtsCodeOption {
  code: string
  description: string
}

interface HtsCodeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemDescription: string
  onSelect: (htsCode: string, description: string) => void
}

export function HtsCodeSelector({
  open,
  onOpenChange,
  itemDescription,
  onSelect,
}: HtsCodeSelectorProps) {
  console.log("🎯 HtsCodeSelector rendered, open:", open, "itemDescription:", itemDescription)
  
  const [htsCodes, setHtsCodes] = useState<HtsCodeOption[]>([])
  const [selectedCode, setSelectedCode] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch HTS codes when dialog opens
  const fetchHtsCodes = async () => {
    console.log("🔍 HTS Code Selector: Starting fetch for:", itemDescription)
    
    if (!itemDescription || itemDescription.trim().length === 0) {
      console.error("❌ HTS Code Selector: No description provided")
      setError("Item description is required")
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedCode("")
    setHtsCodes([])

    try {
      console.log("📡 HTS Code Selector: Making API request to /api/lookup-hts-codes")
      console.log("📡 HTS Code Selector: Request body:", { description: itemDescription })
      
      const response = await fetch("/api/lookup-hts-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: itemDescription }),
      })
      
      console.log("📡 HTS Code Selector: Response status:", response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = "Failed to lookup HTS codes"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error("API Error Response:", errorData)
        } catch (e) {
          const errorText = await response.text()
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
          console.error("API Error Text:", errorText)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("✅ HTS Code Selector: API Response Data:", data)
      console.log("✅ HTS Code Selector: Number of codes received:", data.htsCodes?.length || 0)
      
      if (data.htsCodes && data.htsCodes.length > 0) {
        console.log("✅ HTS Code Selector: Setting HTS codes:", data.htsCodes)
        setHtsCodes(data.htsCodes)
      } else {
        console.warn("⚠️ HTS Code Selector: No HTS codes in response")
        setError(`No HTS codes found for this item description. The USITC API may not have matching codes, or there may be an issue with the search query.`)
      }
    } catch (err) {
      console.error("❌ HTS Code Selector: Error fetching HTS codes:", err)
      console.error("❌ HTS Code Selector: Error details:", err instanceof Error ? err.stack : String(err))
      const errorMessage = err instanceof Error ? err.message : "Failed to lookup HTS codes"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Also fetch when dialog opens via useEffect (backup in case handleOpenChange doesn't fire)
  useEffect(() => {
    if (open && itemDescription && !isLoading && htsCodes.length === 0 && !error) {
      console.log("🔄 useEffect: Dialog is open, fetching HTS codes...")
      fetchHtsCodes()
    }
  }, [open, itemDescription])

  // Fetch codes when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    console.log("🪟 Dialog open change:", newOpen)
    console.log("🪟 Item description:", itemDescription)
    onOpenChange(newOpen)
    if (newOpen) {
      console.log("🪟 Dialog opened, calling fetchHtsCodes...")
      fetchHtsCodes()
    } else {
      console.log("🪟 Dialog closed, resetting state")
      // Reset state when closing
      setHtsCodes([])
      setSelectedCode("")
      setError(null)
    }
  }

  const handleSelect = () => {
    if (!selectedCode) {
      setError("Please select an HTS code")
      return
    }

    const selected = htsCodes.find((item) => item.code === selectedCode)
    if (selected) {
      onSelect(selected.code, selected.description)
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Lookup HTS Code
          </DialogTitle>
          <DialogDescription>
            Select an HTS code for: <span className="font-medium text-gray-900">{itemDescription}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-gray-600">Searching for HTS codes...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={fetchHtsCodes}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && htsCodes.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Found {htsCodes.length} HTS code{htsCodes.length !== 1 ? "s" : ""}. Please select the most appropriate one:
              </p>
              <RadioGroup value={selectedCode} onValueChange={setSelectedCode}>
                <div className="space-y-3">
                  {htsCodes.map((item, index) => (
                    <div
                      key={item.code}
                      className={`p-4 border rounded-lg transition-all cursor-pointer hover:bg-gray-50 ${
                        selectedCode === item.code
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => setSelectedCode(item.code)}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem
                          value={item.code}
                          id={`hts-${index}`}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`hts-${index}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-blue-600">
                                {item.code}
                              </span>
                              {selectedCode === item.code && (
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{item.description}</p>
                          </div>
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {!isLoading && !error && htsCodes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">No HTS codes found</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedCode || isLoading}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
          >
            Select HTS Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

