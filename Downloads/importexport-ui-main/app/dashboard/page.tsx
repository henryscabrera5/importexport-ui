"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Clock,
  DollarSign,
  CheckCircle,
  FileText,
  Calculator,
  Scan,
  Shield,
  Menu,
  X,
  ChevronRight,
  Package,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Globe,
  Zap,
  RefreshCw,
  MapPin,
  Ship,
  ChevronDown,
  Search,
  Upload,
  ArrowRight,
  Sparkles,
  Info,
  LogOut,
  User,
  File,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import {
  processMultipleDocuments,
  saveProcessedDocumentToSupabase,
  type DocumentType,
  type ProcessedDocument,
} from "@/lib/services/document-processor"

export default function DashboardPage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "shipments" | "compliance" | "analytics" | "accounting">(
    "overview",
  )
  const [htsUpdateVisible, setHtsUpdateVisible] = useState(false)
  const [htsOldRate, setHtsOldRate] = useState("1.2%")
  const [htsNewRate, setHtsNewRate] = useState("0.8%")
  const [trackingProgress, setTrackingProgress] = useState(0)
  const [currentLocation, setCurrentLocation] = useState("Shanghai Port")
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null)
  const [expandedNews, setExpandedNews] = useState<string | null>(null)
  const [expandedTariff, setExpandedTariff] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [shipmentSearch, setShipmentSearch] = useState("")
  const [newUpdatesCount, setNewUpdatesCount] = useState(3)
  const [animatedStats, setAnimatedStats] = useState({ speed: 0, cost: 0, accuracy: 0 })
  const [user, setUser] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [documentType, setDocumentType] = useState<DocumentType>("commercial_invoice")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([])

  // Fetch latest documents from Supabase on mount
  const fetchLatestDocuments = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return
      }

      const response = await fetch("/api/get-latest-documents", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.documents && data.documents.length > 0) {
          // Only display the most recent document (first one in the array)
          setProcessedDocuments([data.documents[0]])
        }
      }
    } catch (error) {
      console.error("Error fetching latest documents:", error)
    }
  }

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
        // Fetch latest documents after user is confirmed
        fetchLatestDocuments()
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login")
      } else {
        setUser(session.user)
        // Fetch latest documents when auth state changes
        fetchLatestDocuments()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    const locations = ["Shanghai Port", "Pacific Ocean", "Los Angeles Port", "Customs Clearance", "Final Delivery"]
    let locationIndex = 0

    const trackingInterval = setInterval(() => {
      setTrackingProgress((prev) => {
        const newProgress = prev + 1
        if (newProgress > 100) return 0
        return newProgress
      })

      if (trackingProgress % 25 === 0 && trackingProgress > 0) {
        locationIndex = (locationIndex + 1) % locations.length
        setCurrentLocation(locations[locationIndex])
      }
    }, 150)

    return () => clearInterval(trackingInterval)
  }, [trackingProgress])

  useEffect(() => {
    const timer = setTimeout(() => {
      setHtsUpdateVisible(true)
      setTimeout(() => {
        setHtsUpdateVisible(false)
      }, 5000)
    }, 3000)

    const interval = setInterval(() => {
      setHtsUpdateVisible(true)
      setTimeout(() => {
        setHtsUpdateVisible(false)
      }, 5000)
    }, 15000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedStats({
        speed: Math.floor(10 * progress),
        cost: Math.floor(70 * progress),
        accuracy: Math.floor(98 * progress),
      })

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, increment)

    return () => clearInterval(timer)
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setNewUpdatesCount(0)
    setTimeout(() => {
      setIsRefreshing(false)
      setNewUpdatesCount(Math.floor(Math.random() * 5) + 1)
    }, 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type.includes("spreadsheet") ||
        file.type.includes("excel") ||
        file.type === "text/csv" ||
        file.type.startsWith("image/"),
    )

    setUploadedFiles((prev) => [...prev, ...validFiles])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const validFiles = files.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.type.includes("spreadsheet") ||
          file.type.includes("excel") ||
          file.type === "text/csv" ||
          file.type.startsWith("image/"),
      )
      setUploadedFiles((prev) => [...prev, ...validFiles])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const handleProcessFiles = async () => {
    if (uploadedFiles.length === 0) return

    setIsProcessing(true)
    setProcessingError(null)

    try {
      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        throw new Error("User not authenticated")
      }

      // Process all files with Gemini
      const results = await processMultipleDocuments(uploadedFiles, documentType)

      // Save each processed document to Supabase
      // NOTE: This saves the extracted data to document_parsed_data table with parsed_json field
      for (let i = 0; i < results.length; i++) {
        try {
          await saveProcessedDocumentToSupabase(results[i], currentUser.id, uploadedFiles[i])
        } catch (saveError) {
          console.error(`Failed to save document ${i + 1} to Supabase:`, saveError)
          // Continue processing other documents even if one fails
        }
      }

      // Store only the most recent processed document to display
      // NOTE: Only the latest document is displayed, previous ones are replaced
      if (results.length > 0) {
        setProcessedDocuments([results[results.length - 1]]) // Get the last processed document (most recent)
      }

      // Clear uploaded files after successful processing
      setUploadedFiles([])

      // Refresh latest documents from Supabase to ensure we have the saved data
      await fetchLatestDocuments()
    } catch (error) {
      console.error("Error processing files:", error)
      setProcessingError(error instanceof Error ? error.message : "Failed to process documents")
    } finally {
      setIsProcessing(false)
    }
  }

  const shipments = [
    {
      id: "SH-2024-001",
      status: "In Transit",
      origin: "Shanghai, CN",
      dest: "Los Angeles, US",
      duty: "$3,240",
      hts: "8471.30.0100",
      eta: "Jan 28",
      carrier: "Maersk",
      container: "MSCU1234567",
      weight: "12,500 kg",
      value: "$45,000",
      documents: ["Commercial Invoice", "Bill of Lading", "Packing List"],
    },
    {
      id: "SH-2024-002",
      status: "Customs Clearance",
      origin: "Hamburg, DE",
      dest: "New York, US",
      duty: "$5,120",
      hts: "8479.89.9897",
      eta: "Jan 25",
      carrier: "MSC",
      container: "MSCU7654321",
      weight: "18,200 kg",
      value: "$78,000",
      documents: ["Commercial Invoice", "Bill of Lading", "Certificate of Origin"],
    },
    {
      id: "SH-2024-003",
      status: "Delivered",
      origin: "Tokyo, JP",
      dest: "Seattle, US",
      duty: "$1,850",
      hts: "6204.62.4020",
      eta: "Jan 22",
      carrier: "CMA CGM",
      container: "CMAU9876543",
      weight: "8,400 kg",
      value: "$32,000",
      documents: ["Commercial Invoice", "Bill of Lading", "Packing List", "ISF Filing"],
    },
  ]

  const filteredShipments = shipments.filter(
    (s) =>
      s.id.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.origin.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.dest.toLowerCase().includes(shipmentSearch.toLowerCase()),
  )

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image
                src="/images/swiftdocks-logo.png"
                alt="SwiftDocks"
                width={320}
                height={92}
                className="h-16 w-auto"
              />
              <span className="text-2xl font-bold text-[#2C3E50] hidden sm:block">SwiftDocks</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{user.email}</span>
              </div>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{user.email}</span>
              </div>
              <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Drag and Drop Upload Section */}
        <Card className="p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Upload Documents for AI Processing
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload invoices, packing lists, or product catalogs to automatically calculate duties
              </p>
            </div>
            {uploadedFiles.length > 0 && (
              <Button
                onClick={handleProcessFiles}
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-50"
              >
                <Scan className={`h-4 w-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
                {isProcessing ? "Processing..." : "Process Files"}
              </Button>
            )}
          </div>

          {/* Document Type Selector */}
          <div className="mb-4">
            <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <Select
              value={documentType}
              onValueChange={(value: DocumentType) => setDocumentType(value)}
              disabled={isProcessing}
            >
              <SelectTrigger id="document-type" className="w-full sm:w-64">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commercial_invoice">Commercial Invoice</SelectItem>
                <SelectItem value="packing_list">Packing List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Processing Error */}
          {processingError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Processing Error</p>
                <p className="text-sm text-red-700 mt-1">{processingError}</p>
              </div>
              <button
                onClick={() => setProcessingError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50 scale-[1.02]"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
              onChange={handleFileInput}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isDragging ? "bg-blue-100 scale-110" : "bg-gray-100"
                  }`}
                >
                  <Upload className={`h-8 w-8 ${isDragging ? "text-blue-600" : "text-gray-400"}`} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {isDragging ? "Drop files here" : "Drag & drop files here"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or{" "}
                    <span className="text-blue-600 hover:text-blue-700 underline">browse to upload</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supports PDF, Excel, CSV, and image files
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Uploaded Files ({uploadedFiles.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <File className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Extracted Data Display Table */}
        {/* NOTE: This table formatting section may be changed later - keep formatting logic isolated */}
        {processedDocuments.length > 0 && (
          <Card className="p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Extracted Document Information
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Review the extracted data from your processed documents
              </p>
            </div>

            {/* Display each processed document */}
            {processedDocuments.map((doc, docIndex) => {
              // Get all products from all documents to display in table
              const allProducts = doc.extractedData?.products || []

              // NOTE: Table structure and column formatting below may be changed later
              // Keep this section isolated for easy updates
              return (
                <div key={docIndex} className="mb-6 last:mb-0">
                  {/* Document Header Info */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      {doc.documentType === "commercial_invoice" && doc.extractedData.invoiceNumber && (
                        <div>
                          <span className="text-gray-500">Invoice #:</span>
                          <span className="ml-2 font-medium text-gray-900">{doc.extractedData.invoiceNumber}</span>
                        </div>
                      )}
                      {doc.documentType === "packing_list" && doc.extractedData.packingListNumber && (
                        <div>
                          <span className="text-gray-500">Packing List #:</span>
                          <span className="ml-2 font-medium text-gray-900">{doc.extractedData.packingListNumber}</span>
                        </div>
                      )}
                      {doc.extractedData.invoiceDate && (
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2 font-medium text-gray-900">{doc.extractedData.invoiceDate}</span>
                        </div>
                      )}
                      {doc.extractedData.shipmentDate && (
                        <div>
                          <span className="text-gray-500">Shipment Date:</span>
                          <span className="ml-2 font-medium text-gray-900">{doc.extractedData.shipmentDate}</span>
                        </div>
                      )}
                      {doc.extractedData.totals?.totalValue && (
                        <div>
                          <span className="text-gray-500">Total Value:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {doc.extractedData.totals.currency || "USD"} {doc.extractedData.totals.totalValue.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Confidence:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {(doc.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Shipper/Exporter Information */}
                    {doc.extractedData.seller && (
                      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Shipper/Exporter</h4>
                        <div className="text-sm space-y-1">
                          {doc.extractedData.seller.name && (
                            <div>
                              <span className="text-gray-500">Name: </span>
                              <span className="font-medium text-gray-900">{doc.extractedData.seller.name}</span>
                            </div>
                          )}
                          {doc.extractedData.seller.address && (
                            <div>
                              <span className="text-gray-500">Address: </span>
                              <span className="text-gray-900">{doc.extractedData.seller.address}</span>
                            </div>
                          )}
                          {doc.extractedData.seller.taxId && (
                            <div>
                              <span className="text-gray-500">Tax ID: </span>
                              <span className="text-gray-900">{doc.extractedData.seller.taxId}</span>
                            </div>
                          )}
                          {doc.extractedData.seller.contact && (
                            <div className="mt-2 space-y-1">
                              {doc.extractedData.seller.contact.phone && (
                                <div>
                                  <span className="text-gray-500">Phone: </span>
                                  <span className="text-gray-900">{doc.extractedData.seller.contact.phone}</span>
                                </div>
                              )}
                              {doc.extractedData.seller.contact.email && (
                                <div>
                                  <span className="text-gray-500">Email: </span>
                                  <span className="text-gray-900">{doc.extractedData.seller.contact.email}</span>
                                </div>
                              )}
                              {doc.extractedData.seller.contact.fax && (
                                <div>
                                  <span className="text-gray-500">Fax: </span>
                                  <span className="text-gray-900">{doc.extractedData.seller.contact.fax}</span>
                                </div>
                              )}
                              {doc.extractedData.seller.contact.contactPerson && (
                                <div>
                                  <span className="text-gray-500">Contact Person: </span>
                                  <span className="text-gray-900">{doc.extractedData.seller.contact.contactPerson}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Consignee Information */}
                    {doc.extractedData.buyer && (
                      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Consignee</h4>
                        <div className="text-sm space-y-1">
                          {doc.extractedData.buyer.name && (
                            <div>
                              <span className="text-gray-500">Name: </span>
                              <span className="font-medium text-gray-900">{doc.extractedData.buyer.name}</span>
                            </div>
                          )}
                          {doc.extractedData.buyer.address && (
                            <div>
                              <span className="text-gray-500">Address: </span>
                              <span className="text-gray-900">{doc.extractedData.buyer.address}</span>
                            </div>
                          )}
                          {doc.extractedData.buyer.taxId && (
                            <div>
                              <span className="text-gray-500">Tax ID: </span>
                              <span className="text-gray-900">{doc.extractedData.buyer.taxId}</span>
                            </div>
                          )}
                          {doc.extractedData.buyer.contact && (
                            <div className="mt-2 space-y-1">
                              {doc.extractedData.buyer.contact.phone && (
                                <div>
                                  <span className="text-gray-500">Phone: </span>
                                  <span className="text-gray-900">{doc.extractedData.buyer.contact.phone}</span>
                                </div>
                              )}
                              {doc.extractedData.buyer.contact.email && (
                                <div>
                                  <span className="text-gray-500">Email: </span>
                                  <span className="text-gray-900">{doc.extractedData.buyer.contact.email}</span>
                                </div>
                              )}
                              {doc.extractedData.buyer.contact.fax && (
                                <div>
                                  <span className="text-gray-500">Fax: </span>
                                  <span className="text-gray-900">{doc.extractedData.buyer.contact.fax}</span>
                                </div>
                              )}
                              {doc.extractedData.buyer.contact.contactPerson && (
                                <div>
                                  <span className="text-gray-500">Contact Person: </span>
                                  <span className="text-gray-900">{doc.extractedData.buyer.contact.contactPerson}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Signer Information */}
                    {doc.extractedData.signer && (
                      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Document Signer</h4>
                        <div className="text-sm space-y-1">
                          {doc.extractedData.signer.name && (
                            <div>
                              <span className="text-gray-500">Name: </span>
                              <span className="font-medium text-gray-900">{doc.extractedData.signer.name}</span>
                            </div>
                          )}
                          {doc.extractedData.signer.company && (
                            <div>
                              <span className="text-gray-500">Company: </span>
                              <span className="text-gray-900">{doc.extractedData.signer.company}</span>
                            </div>
                          )}
                          {doc.extractedData.signer.title && (
                            <div>
                              <span className="text-gray-500">Title: </span>
                              <span className="text-gray-900">{doc.extractedData.signer.title}</span>
                            </div>
                          )}
                          {doc.extractedData.signer.signature && (
                            <div>
                              <span className="text-gray-500">Signature: </span>
                              <span className="text-gray-900">{doc.extractedData.signer.signature}</span>
                            </div>
                          )}
                          {doc.extractedData.signer.date && (
                            <div>
                              <span className="text-gray-500">Date: </span>
                              <span className="text-gray-900">{doc.extractedData.signer.date}</span>
                            </div>
                          )}
                          {doc.extractedData.signer.contact && (
                            <div className="mt-2 space-y-1">
                              {doc.extractedData.signer.contact.phone && (
                                <div>
                                  <span className="text-gray-500">Phone: </span>
                                  <span className="text-gray-900">{doc.extractedData.signer.contact.phone}</span>
                                </div>
                              )}
                              {doc.extractedData.signer.contact.email && (
                                <div>
                                  <span className="text-gray-500">Email: </span>
                                  <span className="text-gray-900">{doc.extractedData.signer.contact.email}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Products/Items Table */}
                  {/* NOTE: Table column structure and formatting may be changed - keep isolated */}
                  {allProducts.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            {/* NOTE: Column headers - these may be reordered or changed later */}
                            <TableHead className="font-semibold">Description</TableHead>
                            <TableHead className="font-semibold">Quantity</TableHead>
                            <TableHead className="font-semibold">Unit</TableHead>
                            {allProducts.some((p) => p.unitPrice) && (
                              <TableHead className="font-semibold">Unit Price</TableHead>
                            )}
                            {allProducts.some((p) => p.totalPrice) && (
                              <TableHead className="font-semibold">Total Price</TableHead>
                            )}
                            {allProducts.some((p) => p.weight) && (
                              <TableHead className="font-semibold">Weight</TableHead>
                            )}
                            {allProducts.some((p) => p.countryOfOrigin) && (
                              <TableHead className="font-semibold">Origin</TableHead>
                            )}
                            {allProducts.some((p) => p.htsCode) && (
                              <TableHead className="font-semibold">HTS Code</TableHead>
                            )}
                            {allProducts.some((p) => p.packageCount || p.packageNumber) && (
                              <TableHead className="font-semibold">Packages</TableHead>
                            )}
                            {allProducts.some((p) => p.dimensions || p.length) && (
                              <TableHead className="font-semibold">Dimensions</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* NOTE: Row formatting and cell display logic may be changed later */}
                          {allProducts.map((product, productIndex) => (
                            <TableRow key={productIndex} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{product.description || "N/A"}</TableCell>
                              <TableCell>{product.quantity || "-"}</TableCell>
                              <TableCell className="text-gray-600">{product.unitOfMeasure || "-"}</TableCell>
                              {allProducts.some((p) => p.unitPrice) && (
                                <TableCell>
                                  {product.unitPrice
                                    ? `${product.currency || "USD"} ${product.unitPrice.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}`
                                    : "-"}
                                </TableCell>
                              )}
                              {allProducts.some((p) => p.totalPrice) && (
                                <TableCell>
                                  {product.totalPrice
                                    ? `${product.currency || "USD"} ${product.totalPrice.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}`
                                    : "-"}
                                </TableCell>
                              )}
                              {allProducts.some((p) => p.weight) && (
                                <TableCell>
                                  {product.weight
                                    ? `${product.weight} ${product.weightUnit || "kg"}`
                                    : "-"}
                                </TableCell>
                              )}
                              {allProducts.some((p) => p.countryOfOrigin) && (
                                <TableCell className="text-gray-600">{product.countryOfOrigin || "-"}</TableCell>
                              )}
                              {allProducts.some((p) => p.htsCode) && (
                                <TableCell className="font-mono text-sm">{product.htsCode || "-"}</TableCell>
                              )}
                              {allProducts.some((p) => p.packageCount || p.packageNumber) && (
                                <TableCell>
                                  {product.packageCount
                                    ? `${product.packageCount} ${product.packageNumber ? `(${product.packageNumber})` : ""}`
                                    : product.packageNumber
                                      ? product.packageNumber
                                      : "-"}
                                </TableCell>
                              )}
                              {allProducts.some((p) => p.dimensions || p.length) && (
                                <TableCell className="text-gray-600">
                                  {product.dimensions
                                    ? product.dimensions
                                    : product.length && product.width && product.height
                                      ? `${product.length}×${product.width}×${product.height} ${product.dimensionUnit || "cm"}`
                                      : "-"}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 border rounded-lg">
                      No products/items extracted from this document
                    </div>
                  )}

                  {/* Shipment Info Display */}
                  {/* NOTE: Shipment info formatting may be changed later */}
                  {doc.extractedData.shipmentInfo && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Shipment Information</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {doc.extractedData.shipmentInfo.originCountry && (
                          <div>
                            <span className="text-gray-500">Origin Country:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {doc.extractedData.shipmentInfo.originCountry}
                              {doc.extractedData.shipmentInfo.originCity && `, ${doc.extractedData.shipmentInfo.originCity}`}
                            </span>
                          </div>
                        )}
                        {doc.extractedData.shipmentInfo.destinationCountry && (
                          <div>
                            <span className="text-gray-500">Destination:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {doc.extractedData.shipmentInfo.destinationCountry}
                              {doc.extractedData.shipmentInfo.destinationCity &&
                                `, ${doc.extractedData.shipmentInfo.destinationCity}`}
                            </span>
                          </div>
                        )}
                        {doc.extractedData.shipmentInfo.carrier && (
                          <div>
                            <span className="text-gray-500">Carrier:</span>
                            <span className="ml-2 font-medium text-gray-900">{doc.extractedData.shipmentInfo.carrier}</span>
                          </div>
                        )}
                        {doc.extractedData.shipmentInfo.containerNumber && (
                          <div>
                            <span className="text-gray-500">Container:</span>
                            <span className="ml-2 font-medium text-gray-900">{doc.extractedData.shipmentInfo.containerNumber}</span>
                          </div>
                        )}
                        {doc.extractedData.shipmentInfo.vesselName && (
                          <div>
                            <span className="text-gray-500">Vessel:</span>
                            <span className="ml-2 font-medium text-gray-900">{doc.extractedData.shipmentInfo.vesselName}</span>
                          </div>
                        )}
                        {doc.extractedData.shipmentInfo.estimatedArrivalDate && (
                          <div>
                            <span className="text-gray-500">ETA:</span>
                            <span className="ml-2 font-medium text-gray-900">{doc.extractedData.shipmentInfo.estimatedArrivalDate}</span>
                          </div>
                        )}
                        {doc.extractedData.shipmentInfo.incoterms && (
                          <div>
                            <span className="text-gray-500">Incoterms:</span>
                            <span className="ml-2 font-medium text-gray-900">{doc.extractedData.shipmentInfo.incoterms}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </Card>
        )}

        <Card className="p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Live Dashboard</h3>
              {newUpdatesCount > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {newUpdatesCount} new
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
                  activeTab === "overview"
                    ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                    : "hover:bg-gray-100"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("shipments")}
                className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
                  activeTab === "shipments"
                    ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                    : "hover:bg-gray-100"
                }`}
              >
                Shipments
              </button>
              <button
                onClick={() => setActiveTab("compliance")}
                className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
                  activeTab === "compliance"
                    ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                    : "hover:bg-gray-100"
                }`}
              >
                Compliance
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
                  activeTab === "analytics"
                    ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                    : "hover:bg-gray-100"
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab("accounting")}
                className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
                  activeTab === "accounting"
                    ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                    : "hover:bg-gray-100"
                }`}
              >
                Accounting
              </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                  {/* Key Metrics */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
                      <DollarSign className="h-5 w-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-2xl font-bold text-blue-700">$48.2K</div>
                      <div className="text-xs text-blue-600">Total Duties Paid</div>
                      <div className="text-xs text-blue-500 mt-1">↓ 12% vs last quarter</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
                      <TrendingUp className="h-5 w-5 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-2xl font-bold text-green-700">$12.8K</div>
                      <div className="text-xs text-green-600">Total Savings</div>
                      <div className="text-xs text-green-500 mt-1">↑ 24% vs last quarter</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
                      <Calculator className="h-5 w-5 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-2xl font-bold text-teal-700">$2,008</div>
                      <div className="text-xs text-teal-600">Avg Cost/Import</div>
                      <div className="text-xs text-teal-500 mt-1">24 shipments</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
                      <Shield className="h-5 w-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-2xl font-bold text-purple-700">8.2%</div>
                      <div className="text-xs text-purple-600">Effective Duty Rate</div>
                      <div className="text-xs text-purple-500 mt-1">Industry avg: 9.8%</div>
                    </Card>
                  </div>

                  {/* Live Shipment Tracker */}
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Ship className="h-5 w-5 text-blue-600 animate-pulse" />
                        Track Live Shipment
                      </h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full animate-pulse">
                        Live
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-semibold text-gray-900">SH-2024-001</div>
                          <div className="text-xs text-gray-600">Electronics from Shanghai</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">ETA: Jan 28</span>
                          <div className="relative w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-teal-500 animate-pulse"
                              style={{ width: `${trackingProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 animate-bounce" />
                        Current Location: {currentLocation}
                      </div>
                    </div>
                  </Card>

                  {/* Project Tasks */}
                  <Card className="p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        Project Tasks & Workflow
                      </h3>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-teal-600 hover:scale-105 transition-transform"
                      >
                        + Add Task
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          task: "Review customs documentation",
                          assignee: "Sarah M.",
                          status: "completed",
                          progress: 100,
                        },
                        {
                          task: "Verify HTS classifications",
                          assignee: "John D.",
                          status: "in-progress",
                          progress: 65,
                        },
                        { task: "Submit ISF filing", assignee: "Mike R.", status: "pending", progress: 0 },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all hover:scale-[1.02] cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  item.status === "completed"
                                    ? "bg-green-500"
                                    : item.status === "in-progress"
                                      ? "bg-blue-500 animate-pulse"
                                      : "bg-gray-400"
                                }`}
                              />
                              <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {item.task}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">Assigned to: {item.assignee}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  item.status === "completed"
                                    ? "bg-green-500"
                                    : item.status === "in-progress"
                                      ? "bg-blue-500"
                                      : "bg-gray-400"
                                }`}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{item.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Shipments Tab */}
              {activeTab === "shipments" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">Shipments</h3>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search shipments..."
                          className="pl-10 border-gray-300 rounded-full"
                          value={shipmentSearch}
                          onChange={(e) => setShipmentSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4">
                      {filteredShipments.map((shipment) => (
                        <Card
                          key={shipment.id}
                          className="p-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                          onClick={() => setExpandedShipment(expandedShipment === shipment.id ? null : shipment.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-gray-900">{shipment.id}</span>
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    shipment.status === "In Transit"
                                      ? "bg-blue-100 text-blue-800"
                                      : shipment.status === "Customs Clearance"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {shipment.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Origin:</span>
                                  <span className="ml-2 text-gray-900">{shipment.origin}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Destination:</span>
                                  <span className="ml-2 text-gray-900">{shipment.dest}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Duty:</span>
                                  <span className="ml-2 font-semibold text-red-600">{shipment.duty}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">ETA:</span>
                                  <span className="ml-2 text-gray-900">{shipment.eta}</span>
                                </div>
                              </div>
                            </div>
                            <ChevronDown
                              className={`h-5 w-5 text-gray-400 transition-transform ${expandedShipment === shipment.id ? "rotate-180" : ""}`}
                            />
                          </div>
                          {expandedShipment === shipment.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200 animate-in fade-in">
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600 font-medium">Carrier:</p>
                                  <p className="text-gray-900">{shipment.carrier}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 font-medium">Container:</p>
                                  <p className="text-gray-900">{shipment.container}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 font-medium">HTS Code:</p>
                                  <p className="text-gray-900">{shipment.hts}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <p className="text-gray-600 font-medium mb-2">Documents:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {shipment.documents.map((doc, i) => (
                                      <span
                                        key={i}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                      >
                                        {doc}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Compliance Tab */}
              {activeTab === "compliance" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                  <Card className="p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">HTS Code Updates</h3>
                      {htsUpdateVisible && (
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full animate-bounce flex items-center gap-2">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Updating...
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">HTS Code: 8471.30.0100</span>
                          <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded">
                            Live Update
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500 line-through">Old Rate: {htsOldRate}</span>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <span className="font-bold text-green-600">New Rate: {htsNewRate}</span>
                          <TrendingUp className="h-4 w-5 text-green-500 rotate-180" />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 hover:shadow-xl transition-all">
                    <h3 className="font-semibold text-lg mb-4">Compliance Monitor</h3>
                    <div className="space-y-3">
                      {[
                        {
                          title: "All Shipments Compliant",
                          description: "24 active shipments meet all regulatory requirements",
                          type: "success",
                          icon: CheckCircle,
                        },
                        {
                          title: "Upcoming Regulation Change",
                          description: "New ISF filing requirements effective Feb 1st",
                          type: "alert",
                          icon: AlertCircle,
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`p-4 rounded-lg flex items-start gap-3 border ${
                            item.type === "alert" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                          }`}
                        >
                          <item.icon
                            className={`h-5 w-5 flex-shrink-0 mt-0.5 ${item.type === "alert" ? "text-red-600" : "text-green-600"}`}
                          />
                          <div className="flex-1">
                            <h4 className={`font-semibold mb-1 ${item.type === "alert" ? "text-red-900" : "text-green-900"}`}>
                              {item.title}
                            </h4>
                            <p className={`text-sm ${item.type === "alert" ? "text-red-700" : "text-green-700"}`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                  <Card className="p-6 hover:shadow-xl transition-all">
                    <h3 className="font-semibold text-lg mb-6">Performance Metrics</h3>
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <div className="text-5xl font-bold text-blue-600 mb-2">{animatedStats.speed}x</div>
                        <div className="text-sm font-medium text-gray-700">Processing Speed</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg">
                        <div className="text-5xl font-bold text-teal-600 mb-2">{animatedStats.cost}%</div>
                        <div className="text-sm font-medium text-gray-700">Cost Reduction</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="text-5xl font-bold text-purple-600 mb-2">{animatedStats.accuracy}%</div>
                        <div className="text-sm font-medium text-gray-700">Accuracy Rate</div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Accounting Tab */}
              {activeTab === "accounting" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                  <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Accounting Integration
                      </h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Synced
                      </span>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-green-200">
                      <div className="text-xs text-gray-500 mb-3">Connected Platforms</div>
                      <div className="grid grid-cols-3 gap-3">
                        {["QuickBooks", "Xero", "Sage"].map((platform, i) => (
                          <div key={i} className="p-3 rounded-lg border-2 border-green-300 bg-green-50">
                            <span className="font-semibold text-sm text-gray-900">{platform}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

