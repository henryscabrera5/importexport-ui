"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Edit,
  Save,
  FileDown,
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
import { fetchDutiesForHtsCodes } from "@/lib/services/hts-duty-calculator"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable?: {
      finalY: number
    }
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "document_processing" | "orders" | "accounting" | "clients" | "brokers" | "settings">(
    "home",
  )
  const [ordersSubTab, setOrdersSubTab] = useState<"overview" | "shipments" | "compliance" | "analytics" | "accounting">(
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
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [pdfTemplateOpen, setPdfTemplateOpen] = useState(false)
  const [selectedPdfTemplate, setSelectedPdfTemplate] = useState<"commercial_invoice" | "certificate_of_origin" | "transport_docs" | "customs_broker">("commercial_invoice")
  const [pendingDocForPdf, setPendingDocForPdf] = useState<{ doc: ProcessedDocument; docIndex: number } | null>(null)
  const [loadingDutyCalculations, setLoadingDutyCalculations] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fetchingRef = useRef(false) // Prevent multiple simultaneous calls
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Orders tab state
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([])
  const [loadingAvailableDocuments, setLoadingAvailableDocuments] = useState(false)
  const [createOrderDialogOpen, setCreateOrderDialogOpen] = useState(false)
  const [newOrderNumber, setNewOrderNumber] = useState("")
  const [newOrderName, setNewOrderName] = useState("")
  const [selectedDocumentParsedDataId, setSelectedDocumentParsedDataId] = useState<string | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [editedOrderData, setEditedOrderData] = useState<Record<string, any>>({})
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [pendingOrderForPdf, setPendingOrderForPdf] = useState<{ order: any } | null>(null)
  const [totalDuties, setTotalDuties] = useState<{ amount: number; currency: string } | null>(null)
  const [loadingTotalDuties, setLoadingTotalDuties] = useState(false)
  const [dutiesBreakdownOpen, setDutiesBreakdownOpen] = useState(false)
  const [orderDutiesBreakdown, setOrderDutiesBreakdown] = useState<Array<{ orderNumber: string; orderName?: string; amount: number; currency: string }>>([])
  const [clients, setClients] = useState<Array<{ 
    name: string
    address?: string
    taxId?: string
    contact?: {
      phone?: string
      email?: string
      fax?: string
      contactPerson?: string
    }
    orders: Array<{ id: string; orderNumber: string; orderName?: string; status: string; orderDate?: string }>
  }>>([])

  // Home dashboard KPI state
  const [homeKPIs, setHomeKPIs] = useState<{
    totalOrders: number
    openOrders: number
    closedOrders: number
    ordersThisMonth: number
    totalDutiesCost: number
    dutiesCurrency: string
    averageOrderValue: number
    totalShipmentValue: number
    dutiesThisMonth: number
    documentsProcessed: number
    processingSuccessRate: number
    documentsThisMonth: number
    pendingProcessing: number
    activeClients: number
    newClientsThisMonth: number
    ordersByStatus: Record<string, number>
    topOriginCountries: Array<{ country: string; count: number }>
    topDestinationCountries: Array<{ country: string; count: number }>
    recentOrders: any[]
    recentDocuments: ProcessedDocument[]
    upcomingDeliveries: any[]
  }>({
    totalOrders: 0,
    openOrders: 0,
    closedOrders: 0,
    ordersThisMonth: 0,
    totalDutiesCost: 0,
    dutiesCurrency: "USD",
    averageOrderValue: 0,
    totalShipmentValue: 0,
    dutiesThisMonth: 0,
    documentsProcessed: 0,
    processingSuccessRate: 0,
    documentsThisMonth: 0,
    pendingProcessing: 0,
    activeClients: 0,
    newClientsThisMonth: 0,
    ordersByStatus: {},
    topOriginCountries: [],
    topDestinationCountries: [],
    recentOrders: [],
    recentDocuments: [],
    upcomingDeliveries: [],
  })
  const [loadingKPIs, setLoadingKPIs] = useState(false)

  // Fix hydration mismatch by only rendering client-side content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch duty information for products with HTS codes
  const fetchDutiesForProducts = async (documents: ProcessedDocument[]) => {
    try {
      // Check if documents already have duty calculations from API
      // If they do, don't overwrite them - just return as-is
      const hasDutyCalculations = documents.some((doc: any) => {
        const hasTotalDuties = doc.extractedData?.totalDuties
        const hasDutyCalculationsArray = doc.extractedData?.dutyCalculations && Array.isArray(doc.extractedData.dutyCalculations) && doc.extractedData.dutyCalculations.length > 0
        // Check if ANY product has a dutyCalculation object with calculatedDuty (not just the property existing)
        const hasProductDutyCalculations = (doc.extractedData?.products || []).some((p: any) => {
          return p.dutyCalculation && 
                 (p.dutyCalculation.calculatedDuty !== undefined || 
                  p.dutyCalculation.isDutyFree !== undefined ||
                  p.dutyCalculation.dutyRate)
        })
        return hasTotalDuties || hasDutyCalculationsArray || hasProductDutyCalculations
      })

      if (hasDutyCalculations) {
        // Documents already have duty calculations from API, don't overwrite
        console.log("[fetchDutiesForProducts] Documents already have duty calculations, skipping")
        return documents
      }

      // Collect all unique HTS codes
      // Priority: Use HTS codes from document_parsed_data.hts_codes (stored extracted codes)
      // Fallback: Extract from products if stored codes not available
      const htsCodes: string[] = []
      documents.forEach((doc: any) => {
        // First, try to use stored HTS codes from document_parsed_data.hts_codes column
        if (doc.storedHtsCodes && Array.isArray(doc.storedHtsCodes) && doc.storedHtsCodes.length > 0) {
          doc.storedHtsCodes.forEach((code: string) => {
            if (code && code.trim() && !htsCodes.includes(code.trim())) {
              htsCodes.push(code.trim())
            }
          })
        }
        
        // Also collect HTS codes from products (for matching duties to products)
        const products = doc.extractedData?.products || []
        products.forEach((product: any) => {
          const htsCode = product.htsCode || product.hts_code
          if (htsCode && htsCode.trim() && !htsCodes.includes(htsCode.trim())) {
            htsCodes.push(htsCode.trim())
          }
        })
      })

      if (htsCodes.length === 0) {
        return documents
      }

      // Fetch duty information for all HTS codes
      // Uses exact codes from document_parsed_data.hts_codes for initial search
      // Searches in hts_codes table using hts_number column
      const dutyMap = await fetchDutiesForHtsCodes(htsCodes)

      // Update documents with duty information
      // IMPORTANT: Preserve existing dutyCalculation objects and totalDuties/dutyCalculations from API
      const updatedDocuments = documents.map((doc) => {
        const updatedProducts = (doc.extractedData?.products || []).map((product) => {
          // CRITICAL: If product already has dutyCalculation with calculated values, preserve it completely
          if ((product as any).dutyCalculation && (
            (product as any).dutyCalculation.calculatedDuty !== undefined ||
            (product as any).dutyCalculation.isDutyFree !== undefined ||
            (product as any).dutyCalculation.dutyRate
          )) {
            // Product already has calculated duty, return as-is without modification
            return product
          }
          
          const htsCode = product.htsCode || (product as any).hts_code
          if (htsCode && dutyMap.has(htsCode.trim())) {
            const dutyInfo = dutyMap.get(htsCode.trim())!
            return {
              ...product,
              // Only add dutyInfo if dutyCalculation doesn't already exist (from API)
              dutyInfo: {
                htsCode: htsCode.trim(),
                htsNumber: dutyInfo.hts_number,
                generalRate: dutyInfo.general_rate_of_duty,
                specialRate: dutyInfo.special_rate_of_duty,
                column2Rate: dutyInfo.column_2_rate_of_duty,
                selectedRate: dutyInfo.selected_rate,
                selectedRateType: dutyInfo.selected_rate_type,
                additionalDuties: dutyInfo.additional_duties,
                unitOfQuantity: dutyInfo.unit_of_quantity,
              },
            }
          }
          return product
        })

        return {
          ...doc,
          extractedData: {
            ...doc.extractedData,
            products: updatedProducts,
            // CRITICAL: Preserve totalDuties and dutyCalculations from API if they exist
            totalDuties: doc.extractedData?.totalDuties,
            dutyCalculations: doc.extractedData?.dutyCalculations,
          },
        }
      })

      return updatedDocuments
    } catch (error) {
      console.error("Error fetching duties for products:", error)
      return documents
    }
  }

  // Edit mode functions
  const handleStartEdit = (docIndex: number, doc: ProcessedDocument) => {
    const docId = (doc as any).documentId || `doc-${docIndex}`
    setEditingDocumentId(docId)
    // Create a deep copy of the extracted data for editing
    setEditedData({
      [docId]: JSON.parse(JSON.stringify(doc.extractedData)),
    })
  }

  const handleCancelEdit = () => {
    setEditingDocumentId(null)
    setEditedData({})
  }

  // Order edit functions
  const handleStartEditOrder = (order: any) => {
    setEditingOrderId(order.id)
    // Create a deep copy of the parsed_json for editing
    setEditedOrderData({
      [order.id]: JSON.parse(JSON.stringify(order.parsed_json || {}))
    })
  }

  const handleCancelEditOrder = () => {
    setEditingOrderId(null)
    setEditedOrderData({})
  }

  const handleSaveEditOrder = async (order: any) => {
    setIsSavingOrder(true)
    try {
      const editedData = editedOrderData[order.id]
      if (!editedData) {
        return
      }

      // Ensure the structure matches what's expected (with extractedData wrapper if needed)
      let parsedJsonToSave = editedData
      // If editedData doesn't have extractedData but has invoiceNumber, seller, etc., wrap it
      if (editedData.invoiceNumber || editedData.seller || editedData.buyer) {
        if (!editedData.extractedData) {
          parsedJsonToSave = {
            ...editedData,
            extractedData: editedData
          }
        }
      }

      // Update the order's parsed_json in the database
      const { error } = await supabase
        .from("orders")
        .update({ parsed_json: parsedJsonToSave })
        .eq("id", order.id)

      if (error) throw error

      // Update local state
      setOrders(orders.map(o => 
        o.id === order.id 
          ? { ...o, parsed_json: parsedJsonToSave }
          : o
      ))

      setEditingOrderId(null)
      setEditedOrderData({})
    } catch (error) {
      console.error("Error saving order:", error)
      alert("Failed to save order changes")
    } finally {
      setIsSavingOrder(false)
    }
  }

  const handleCloseOrder = async (order: any) => {
    if (!confirm("Are you sure you want to close this order?")) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("You must be logged in to close an order")
        return
      }

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: "completed",
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to close order")
      }

      const { order: updatedOrder } = responseData

      // Update local state
      setOrders(orders.map(o => 
        o.id === order.id 
          ? { ...o, status: updatedOrder.status }
          : o
      ))

      // If the order was expanded, collapse it
      if (expandedOrderId === order.id) {
        setExpandedOrderId(null)
      }
    } catch (error: any) {
      console.error("Error closing order:", error)
      alert(error.message || "Failed to close order")
    }
  }

  const handleReopenOrder = async (order: any) => {
    if (!confirm("Are you sure you want to reopen this order?")) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("You must be logged in to reopen an order")
        return
      }

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: "active",
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        const errorMessage = responseData.details 
          ? `${responseData.error}: ${responseData.details}`
          : responseData.error || "Failed to reopen order"
        console.error("API Error Response:", responseData)
        throw new Error(errorMessage)
      }

      const { order: updatedOrder } = responseData

      // Update local state
      setOrders(orders.map(o => 
        o.id === order.id 
          ? { ...o, status: updatedOrder.status }
          : o
      ))
    } catch (error: any) {
      console.error("Error reopening order:", error)
      alert(error.message || "Failed to reopen order")
    }
  }

  // Helper function to check if an order is open
  const isOrderOpen = (order: any) => {
    return order.status === "draft" || order.status === "pending" || order.status === "active"
  }

  // Calculate total duties across all orders
  const calculateTotalDuties = useCallback(() => {
    if (!orders || orders.length === 0) {
      setTotalDuties(null)
      return
    }

    let totalAmount = 0
    let currency = "USD" // Default currency

    orders.forEach((order: any) => {
      const parsedJson = order.parsed_json || {}
      const extractedData = parsedJson.extractedData || parsedJson || {}

      // Check for totalDuties at the document level
      if (extractedData.totalDuties && extractedData.totalDuties.amount) {
        totalAmount += extractedData.totalDuties.amount
        if (extractedData.totalDuties.currency) {
          currency = extractedData.totalDuties.currency
        }
      } else {
        // Fallback: calculate from individual products
        const products = extractedData.products || []
        products.forEach((product: any) => {
          if (product.dutyCalculation && product.dutyCalculation.calculatedDuty) {
            totalAmount += product.dutyCalculation.calculatedDuty
            if (product.dutyCalculation.currency) {
              currency = product.dutyCalculation.currency
            }
          }
        })

        // Also check dutyCalculations array
        if (extractedData.dutyCalculations && Array.isArray(extractedData.dutyCalculations)) {
          extractedData.dutyCalculations.forEach((duty: any) => {
            if (duty.calculatedDuty && !duty.isDutyFree) {
              totalAmount += duty.calculatedDuty
              if (duty.currency) {
                currency = duty.currency
              }
            }
          })
        }
      }
    })

    setTotalDuties({ amount: totalAmount, currency })
  }, [orders])

  // Calculate duties breakdown per order
  const calculateOrderDutiesBreakdown = useCallback(() => {
    if (!orders || orders.length === 0) {
      setOrderDutiesBreakdown([])
      return
    }

    const breakdown: Array<{ orderNumber: string; orderName?: string; amount: number; currency: string }> = []

    orders.forEach((order: any) => {
      const parsedJson = order.parsed_json || {}
      const extractedData = parsedJson.extractedData || parsedJson || {}
      let orderAmount = 0
      let currency = "USD" // Default currency

      // Check for totalDuties at the document level
      if (extractedData.totalDuties && extractedData.totalDuties.amount) {
        orderAmount = extractedData.totalDuties.amount
        if (extractedData.totalDuties.currency) {
          currency = extractedData.totalDuties.currency
        }
      } else {
        // Fallback: calculate from individual products
        const products = extractedData.products || []
        products.forEach((product: any) => {
          if (product.dutyCalculation && product.dutyCalculation.calculatedDuty) {
            orderAmount += product.dutyCalculation.calculatedDuty
            if (product.dutyCalculation.currency) {
              currency = product.dutyCalculation.currency
            }
          }
        })

        // Also check dutyCalculations array
        if (extractedData.dutyCalculations && Array.isArray(extractedData.dutyCalculations)) {
          extractedData.dutyCalculations.forEach((duty: any) => {
            if (duty.calculatedDuty && !duty.isDutyFree) {
              orderAmount += duty.calculatedDuty
              if (duty.currency) {
                currency = duty.currency
              }
            }
          })
        }
      }

      if (orderAmount > 0 || extractedData.totalDuties?.amount === 0) {
        breakdown.push({
          orderNumber: order.order_number,
          orderName: order.order_name,
          amount: orderAmount,
          currency,
        })
      }
    })

    // Sort by amount descending
    breakdown.sort((a, b) => b.amount - a.amount)
    setOrderDutiesBreakdown(breakdown)
  }, [orders])

  const handleOpenDutiesBreakdown = () => {
    calculateOrderDutiesBreakdown()
    setDutiesBreakdownOpen(true)
  }

  // Extract and group clients from orders
  const extractClientsFromOrders = useCallback(() => {
    if (!orders || orders.length === 0) {
      setClients([])
      return
    }

    const clientsMap = new Map<string, {
      name: string
      address?: string
      taxId?: string
      contact?: {
        phone?: string
        email?: string
        fax?: string
        contactPerson?: string
      }
      orders: Array<{ id: string; orderNumber: string; orderName?: string; status: string; orderDate?: string }>
    }>()

    orders.forEach((order: any) => {
      const parsedJson = order.parsed_json || {}
      const extractedData = parsedJson.extractedData || parsedJson || {}
      const buyer = extractedData.buyer

      if (buyer && buyer.name) {
        const clientKey = buyer.name.toLowerCase().trim()
        
        if (!clientsMap.has(clientKey)) {
          clientsMap.set(clientKey, {
            name: buyer.name,
            address: buyer.address,
            taxId: buyer.taxId,
            contact: buyer.contact,
            orders: [],
          })
        }

        const client = clientsMap.get(clientKey)!
        client.orders.push({
          id: order.id,
          orderNumber: order.order_number,
          orderName: order.order_name,
          status: order.status,
          orderDate: order.order_date,
        })
      }
    })

    // Convert map to array and sort by client name
    const clientsArray = Array.from(clientsMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )

    setClients(clientsArray)
  }, [orders])

  // Calculate all KPIs for home dashboard
  const calculateHomeKPIs = useCallback(() => {
    if (!orders || orders.length === 0) {
      setHomeKPIs({
        totalOrders: 0,
        openOrders: 0,
        closedOrders: 0,
        ordersThisMonth: 0,
        totalDutiesCost: 0,
        dutiesCurrency: "USD",
        averageOrderValue: 0,
        totalShipmentValue: 0,
        dutiesThisMonth: 0,
        documentsProcessed: processedDocuments.length,
        processingSuccessRate: processedDocuments.length > 0 ? 100 : 0,
        documentsThisMonth: 0,
        pendingProcessing: 0,
        activeClients: clients.length,
        newClientsThisMonth: 0,
        ordersByStatus: {},
        topOriginCountries: [],
        topDestinationCountries: [],
        recentOrders: [],
        recentDocuments: processedDocuments.slice(0, 5),
        upcomingDeliveries: [],
      })
      return
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Order metrics
    const totalOrders = orders.length
    const openOrders = orders.filter((o: any) => isOrderOpen(o)).length
    const closedOrders = orders.filter((o: any) => o.status === "completed" || o.status === "cancelled").length
    const ordersThisMonth = orders.filter((o: any) => {
      const orderDate = o.order_date ? new Date(o.order_date) : new Date(o.created_at)
      return orderDate >= startOfMonth
    }).length

    // Financial metrics
    let totalDutiesCost = 0
    let dutiesCurrency = "USD"
    let totalShipmentValue = 0
    let dutiesThisMonth = 0
    let orderValues: number[] = []

    orders.forEach((order: any) => {
      const parsedJson = order.parsed_json || {}
      const extractedData = parsedJson.extractedData || parsedJson || {}
      
      // Calculate duties
      let orderDuties = 0
      if (extractedData.totalDuties && extractedData.totalDuties.amount) {
        orderDuties = extractedData.totalDuties.amount
        if (extractedData.totalDuties.currency) {
          dutiesCurrency = extractedData.totalDuties.currency
        }
      } else {
        const products = extractedData.products || []
        products.forEach((product: any) => {
          if (product.dutyCalculation && product.dutyCalculation.calculatedDuty) {
            orderDuties += product.dutyCalculation.calculatedDuty
            if (product.dutyCalculation.currency) {
              dutiesCurrency = product.dutyCalculation.currency
            }
          }
        })
        if (extractedData.dutyCalculations && Array.isArray(extractedData.dutyCalculations)) {
          extractedData.dutyCalculations.forEach((duty: any) => {
            if (duty.calculatedDuty && !duty.isDutyFree) {
              orderDuties += duty.calculatedDuty
              if (duty.currency) {
                dutiesCurrency = duty.currency
              }
            }
          })
        }
      }
      totalDutiesCost += orderDuties

      // Check if order is from this month for duties calculation
      const orderDate = order.order_date ? new Date(order.order_date) : new Date(order.created_at)
      if (orderDate >= startOfMonth) {
        dutiesThisMonth += orderDuties
      }

      // Calculate shipment value
      const invoiceTotal = extractedData.invoiceTotal || extractedData.totalAmount || extractedData.totalValue
      if (invoiceTotal && typeof invoiceTotal === 'number') {
        totalShipmentValue += invoiceTotal
        orderValues.push(invoiceTotal)
      } else {
        // Fallback: sum product values
        const products = extractedData.products || []
        let orderValue = 0
        products.forEach((product: any) => {
          const productValue = product.totalPrice || product.total_price || (product.unitPrice || product.unit_price || 0) * (product.quantity || 0)
          if (productValue && typeof productValue === 'number') {
            orderValue += productValue
          }
        })
        if (orderValue > 0) {
          totalShipmentValue += orderValue
          orderValues.push(orderValue)
        }
      }
    })

    const averageOrderValue = orderValues.length > 0 ? totalShipmentValue / orderValues.length : 0

    // Document processing metrics
    const documentsProcessed = processedDocuments.length
    const documentsThisMonth = processedDocuments.filter((doc: any) => {
      const docDate = doc.created_at ? new Date(doc.created_at) : new Date()
      return docDate >= startOfMonth
    }).length
    const processingSuccessRate = documentsProcessed > 0 ? 100 : 0 // Assuming all processed documents are successful
    const pendingProcessing = 0 // Could be enhanced to check document status

    // Client metrics
    const activeClients = clients.length
    const newClientsThisMonth = clients.filter((client) => {
      const clientOrders = client.orders || []
      if (clientOrders.length === 0) return false
      const firstOrderDate = clientOrders[0].orderDate ? new Date(clientOrders[0].orderDate) : null
      return firstOrderDate && firstOrderDate >= startOfMonth
    }).length

    // Orders by status
    const ordersByStatus: Record<string, number> = {}
    orders.forEach((order: any) => {
      const status = order.status || "unknown"
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1
    })

    // Top origin and destination countries
    const originCounts = new Map<string, number>()
    const destCounts = new Map<string, number>()

    orders.forEach((order: any) => {
      const parsedJson = order.parsed_json || {}
      const extractedData = parsedJson.extractedData || parsedJson || {}
      const shipmentInfo = extractedData.shipmentInfo || {}

      const origin = shipmentInfo.originCountry || shipmentInfo.origin_country || extractedData.originCountry
      const destination = shipmentInfo.destinationCountry || shipmentInfo.destination_country || extractedData.destinationCountry

      if (origin) {
        originCounts.set(origin, (originCounts.get(origin) || 0) + 1)
      }
      if (destination) {
        destCounts.set(destination, (destCounts.get(destination) || 0) + 1)
      }
    })

    const topOriginCountries = Array.from(originCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const topDestinationCountries = Array.from(destCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Recent orders (last 5)
    const recentOrders = [...orders]
      .sort((a, b) => {
        const dateA = a.order_date ? new Date(a.order_date) : new Date(a.created_at)
        const dateB = b.order_date ? new Date(b.order_date) : new Date(b.created_at)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 5)

    // Recent documents (last 5)
    const recentDocuments = [...processedDocuments]
      .sort((a: any, b: any) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date()
        const dateB = b.created_at ? new Date(b.created_at) : new Date()
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 5)

    // Upcoming deliveries (orders with expected_delivery_date in the future)
    const upcomingDeliveries = orders
      .filter((order: any) => {
        if (!order.expected_delivery_date) return false
        const deliveryDate = new Date(order.expected_delivery_date)
        return deliveryDate >= now
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.expected_delivery_date)
        const dateB = new Date(b.expected_delivery_date)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(0, 5)

    setHomeKPIs({
      totalOrders,
      openOrders,
      closedOrders,
      ordersThisMonth,
      totalDutiesCost,
      dutiesCurrency,
      averageOrderValue,
      totalShipmentValue,
      dutiesThisMonth,
      documentsProcessed,
      processingSuccessRate,
      documentsThisMonth,
      pendingProcessing,
      activeClients,
      newClientsThisMonth,
      ordersByStatus,
      topOriginCountries,
      topDestinationCountries,
      recentOrders,
      recentDocuments,
      upcomingDeliveries,
    })
  }, [orders, processedDocuments, clients, isOrderOpen])

  const openOrderPdfTemplateSelector = (order: any) => {
    setPendingOrderForPdf({ order })
    setPdfTemplateOpen(true)
  }

  const generateOrderPDF = async (order: any, template: string = selectedPdfTemplate) => {
    setGeneratingPdf(true)
    setPdfTemplateOpen(false)
    try {
      // Convert order data to ProcessedDocument format for PDF generation
      const parsedJson = order.parsed_json || {}
      const extractedData = parsedJson.extractedData || parsedJson
      
      const docForPdf: any = {
        documentId: order.id,
        documentType: parsedJson.documentType || "commercial_invoice",
        extractedData: extractedData,
        confidence: 1.0, // Orders are already processed
        file_name: order.documents?.[0]?.file_name || `Order-${order.order_number}.pdf`,
        file_type: "application/pdf",
        file_size: 0,
      }

      await generatePDF(docForPdf as ProcessedDocument, 0, template)
    } catch (error) {
      console.error("Error generating order PDF:", error)
      alert("Failed to generate PDF")
    } finally {
      setGeneratingPdf(false)
      setPendingOrderForPdf(null)
    }
  }

  const handleSaveEdit = async (docIndex: number, doc: ProcessedDocument) => {
    const docId = (doc as any).documentId || `doc-${docIndex}`
    const editedExtractedData = editedData[docId]

    if (!editedExtractedData) {
      return
    }

    setIsSaving(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      // Get the parsed_data_id from the document
      // We need to fetch it from the API or store it in the document object
      const response = await fetch("/api/get-latest-documents", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch document data")
      }

      const data = await response.json()
      const document = data.documents?.[docIndex]
      
      if (!document || !document.documentId) {
        throw new Error("Document not found")
      }

      // Update the parsed_json in document_parsed_data table
      // First, we need to get the parsed_data_id
      const { data: parsedDataRows, error: fetchError } = await supabase
        .from("document_parsed_data")
        .select("id")
        .eq("document_id", document.documentId)
        .limit(1)
        .single()

      if (fetchError || !parsedDataRows) {
        throw new Error("Failed to find parsed data record")
      }

      // Update the parsed_json field
      const { error: updateError } = await supabase
        .from("document_parsed_data")
        .update({
          parsed_json: {
            documentType: doc.documentType,
            extractedData: editedExtractedData,
          },
        })
        .eq("id", parsedDataRows.id)

      if (updateError) {
        throw new Error(`Failed to save changes: ${updateError.message}`)
      }

      // Update local state
      const updatedDocuments = [...processedDocuments]
      updatedDocuments[docIndex] = {
        ...doc,
        extractedData: editedExtractedData,
      }
      setProcessedDocuments(updatedDocuments)

      // Exit edit mode
      setEditingDocumentId(null)
      setEditedData({})

      // Refresh to get updated data
      await fetchLatestDocuments()
    } catch (error) {
      console.error("Error saving edited data:", error)
      alert(error instanceof Error ? error.message : "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  // Open PDF template selector
  const openPdfTemplateSelector = (doc: ProcessedDocument, docIndex: number) => {
    setPendingDocForPdf({ doc, docIndex })
    setPdfTemplateOpen(true)
  }

  // Generate PDF from document data with selected template
  const generatePDF = async (doc: ProcessedDocument, docIndex: number, template: string = selectedPdfTemplate) => {
    setGeneratingPdf(true)
    setPdfTemplateOpen(false)
    try {
      const docId = (doc as any).documentId || `doc-${docIndex}`
      const dataToUse = editedData[docId] || doc.extractedData
      
      const pdf = new jsPDF()
      
      // Generate PDF based on selected template
      if (template === "commercial_invoice") {
        await generateCommercialInvoicePDF(pdf, dataToUse, doc.documentType)
      } else if (template === "certificate_of_origin") {
        await generateCertificateOfOriginPDF(pdf, dataToUse, doc.documentType)
      } else if (template === "transport_docs") {
        await generateTransportDocsPDF(pdf, dataToUse, doc.documentType)
      } else if (template === "customs_broker") {
        await generateCustomsBrokerPDF(pdf, dataToUse, doc.documentType)
      }
      
      // Generate PDF blob URL for preview
      const pdfBlob = pdf.output("blob")
      const url = URL.createObjectURL(pdfBlob)
      setPdfPreviewUrl(url)
      setPdfPreviewOpen(true)
      setPendingDocForPdf(null)
    } catch (error) {
      console.error("Error generating PDF:", error)
      console.error("Error details:", error instanceof Error ? error.stack : error)
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}. Please check the console for details.`)
    } finally {
      setGeneratingPdf(false)
    }
  }

  // Generate Commercial Invoice/Packing List PDF (current format)
  const generateCommercialInvoicePDF = async (pdf: jsPDF, dataToUse: any, documentType: DocumentType) => {
    let yPosition = 20

    // Title
    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.text(
      documentType === "commercial_invoice" ? "COMMERCIAL INVOICE" : "PACKING LIST",
      105,
      yPosition,
      { align: "center" }
    )
    yPosition += 10

      // Document Header Information
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Invoice Number: ${dataToUse.invoiceNumber || ""}`, 20, yPosition)
      yPosition += 7
      pdf.text(`Packing List Number: ${dataToUse.packingListNumber || ""}`, 20, yPosition)
      yPosition += 7
      pdf.text(`Invoice Date: ${dataToUse.invoiceDate || ""}`, 20, yPosition)
      yPosition += 7
      pdf.text(`Shipment Date: ${dataToUse.shipmentDate || ""}`, 20, yPosition)
      yPosition += 7
      pdf.text(`Currency: ${dataToUse.currency || ""}`, 20, yPosition)
      yPosition += 7
      yPosition += 5

      // Seller/Exporter Information
      pdf.setFont("helvetica", "bold")
      pdf.text("Shipper/Exporter:", 20, yPosition)
      yPosition += 7
      pdf.setFont("helvetica", "normal")
      pdf.text(`Name: ${dataToUse.seller?.name || ""}`, 25, yPosition)
      yPosition += 7
      if (dataToUse.seller?.address) {
        const addressLines = pdf.splitTextToSize(dataToUse.seller.address, 80)
        pdf.text(addressLines, 25, yPosition)
        yPosition += addressLines.length * 7
      } else {
        pdf.text(`Address: ${""}`, 25, yPosition)
        yPosition += 7
      }
      pdf.text(`Tax ID: ${dataToUse.seller?.taxId || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Phone: ${dataToUse.seller?.contact?.phone || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Email: ${dataToUse.seller?.contact?.email || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Fax: ${dataToUse.seller?.contact?.fax || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Contact Person: ${dataToUse.seller?.contact?.contactPerson || ""}`, 25, yPosition)
      yPosition += 7
      yPosition += 5

      // Buyer/Consignee Information
      pdf.setFont("helvetica", "bold")
      pdf.text("Consignee:", 20, yPosition)
      yPosition += 7
      pdf.setFont("helvetica", "normal")
      pdf.text(`Name: ${dataToUse.buyer?.name || ""}`, 25, yPosition)
      yPosition += 7
      if (dataToUse.buyer?.address) {
        const addressLines = pdf.splitTextToSize(dataToUse.buyer.address, 80)
        pdf.text(addressLines, 25, yPosition)
        yPosition += addressLines.length * 7
      } else {
        pdf.text(`Address: ${""}`, 25, yPosition)
        yPosition += 7
      }
      pdf.text(`Tax ID: ${dataToUse.buyer?.taxId || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Phone: ${dataToUse.buyer?.contact?.phone || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Email: ${dataToUse.buyer?.contact?.email || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Fax: ${dataToUse.buyer?.contact?.fax || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Contact Person: ${dataToUse.buyer?.contact?.contactPerson || ""}`, 25, yPosition)
      yPosition += 7
      yPosition += 5

      // Signer Information
      pdf.setFont("helvetica", "bold")
      pdf.text("Document Signer:", 20, yPosition)
      yPosition += 7
      pdf.setFont("helvetica", "normal")
      pdf.text(`Name: ${dataToUse.signer?.name || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Company: ${dataToUse.signer?.company || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Title: ${dataToUse.signer?.title || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Signature: ${dataToUse.signer?.signature || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Date: ${dataToUse.signer?.date || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Phone: ${dataToUse.signer?.contact?.phone || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Email: ${dataToUse.signer?.contact?.email || ""}`, 25, yPosition)
      yPosition += 7
      yPosition += 5

      // Products Table - Always show section
      pdf.setFont("helvetica", "bold")
      pdf.text("Products/Items:", 20, yPosition)
      yPosition += 10

      if (dataToUse.products && dataToUse.products.length > 0) {
        // Prepare table data - include all possible fields
        const tableData = dataToUse.products.map((product: any) => {
          const row: any[] = []
          row.push(product.description || "")
          row.push(product.quantity?.toString() || "")
          row.push(product.unitOfMeasure || "")
          row.push(product.unitPrice ? `${product.currency || "USD"} ${product.unitPrice.toFixed(2)}` : "")
          row.push(product.totalPrice ? `${product.currency || "USD"} ${product.totalPrice.toFixed(2)}` : "")
          row.push(product.weight ? `${product.weight} ${product.weightUnit || "kg"}` : "")
          row.push(product.countryOfOrigin || "")
          row.push(product.htsCode || "")
          row.push(product.packageNumber || "")
          row.push(product.packageCount?.toString() || "")
          row.push(product.dimensions || (product.length && product.width && product.height ? `${product.length}×${product.width}×${product.height} ${product.dimensionUnit || "cm"}` : ""))
          return row
        })

        // Table headers - include all fields
        const headers = [
          "Description",
          "Qty",
          "Unit",
          "Unit Price",
          "Total Price",
          "Weight",
          "Origin",
          "HTS Code",
          "Package Number",
          "Package Count",
          "Dimensions",
        ]

        // Generate table using autoTable function directly
        // autoTable function signature: autoTable(doc, options)
        autoTable(pdf, {
          startY: yPosition,
          head: [headers],
          body: tableData,
          theme: "striped",
          headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 50 }, // Description
            1: { cellWidth: 12 }, // Quantity
            2: { cellWidth: 12 }, // Unit
            3: { cellWidth: 20 }, // Unit Price
            4: { cellWidth: 20 }, // Total Price
            5: { cellWidth: 18 }, // Weight
            6: { cellWidth: 15 }, // Origin
            7: { cellWidth: 20 }, // HTS Code
            8: { cellWidth: 20 }, // Package Number
            9: { cellWidth: 15 }, // Package Count
            10: { cellWidth: 25 }, // Dimensions
          },
        })

        // Get the final Y position after the table
        yPosition = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 10 : yPosition + 50
      } else {
        // Show empty products message
        pdf.setFont("helvetica", "normal")
        pdf.text("No products/items listed", 25, yPosition)
        yPosition += 10
      }

      // Shipment Information
      pdf.setFont("helvetica", "bold")
      pdf.text("Shipment Information:", 20, yPosition)
      yPosition += 7
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `Origin Country: ${dataToUse.shipmentInfo?.originCountry || ""}`,
        25,
        yPosition
      )
      yPosition += 7
      pdf.text(
        `Origin City: ${dataToUse.shipmentInfo?.originCity || ""}`,
        25,
        yPosition
      )
      yPosition += 7
      pdf.text(
        `Destination Country: ${dataToUse.shipmentInfo?.destinationCountry || ""}`,
        25,
        yPosition
      )
      yPosition += 7
      pdf.text(
        `Destination City: ${dataToUse.shipmentInfo?.destinationCity || ""}`,
        25,
        yPosition
      )
      yPosition += 7
      pdf.text(`Carrier: ${dataToUse.shipmentInfo?.carrier || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Container Number: ${dataToUse.shipmentInfo?.containerNumber || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Vessel Name: ${dataToUse.shipmentInfo?.vesselName || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Estimated Arrival Date: ${dataToUse.shipmentInfo?.estimatedArrivalDate || ""}`, 25, yPosition)
      yPosition += 7
      pdf.text(`Incoterms: ${dataToUse.shipmentInfo?.incoterm || dataToUse.shipmentInfo?.incoterms || ""}`, 25, yPosition)
      yPosition += 7
      yPosition += 5

      // Totals
      yPosition += 5
      pdf.setFont("helvetica", "bold")
      pdf.text("Totals:", 20, yPosition)
      yPosition += 7
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `Total Value: ${dataToUse.totals?.currency || "USD"} ${dataToUse.totals?.totalValue?.toFixed(2) || "0.00"}`,
        25,
        yPosition
      )
      yPosition += 7
      pdf.text(
        `Total Weight: ${dataToUse.totals?.totalWeight || ""} ${dataToUse.totals?.weightUnit || "kg"}`,
        25,
        yPosition
      )
      yPosition += 7
      pdf.text(
        `Total Packages: ${dataToUse.totals?.totalPackages || ""}`,
        25,
        yPosition
      )
      yPosition += 7
      pdf.text(
        `Total Quantity: ${dataToUse.totals?.totalQuantity || ""}`,
        25,
        yPosition
      )

  }

  // Generate Certificate of Origin PDF
  const generateCertificateOfOriginPDF = async (pdf: jsPDF, dataToUse: any, documentType: DocumentType) => {
    let yPosition = 20

    // Title
    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.text("CERTIFICATE OF ORIGIN", 105, yPosition, { align: "center" })
    yPosition += 15

    // Plain format - simple list of all information
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // Document Information
    pdf.setFont("helvetica", "bold")
    pdf.text("Document Information:", 20, yPosition)
    yPosition += 7
    pdf.setFont("helvetica", "normal")
    pdf.text(`Invoice Number: ${dataToUse.invoiceNumber || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Packing List Number: ${dataToUse.packingListNumber || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Invoice Date: ${dataToUse.invoiceDate || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Shipment Date: ${dataToUse.shipmentDate || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Currency: ${dataToUse.currency || ""}`, 20, yPosition)
    yPosition += 10

    // Exporter Information
    pdf.setFont("helvetica", "bold")
    pdf.text("Exporter:", 20, yPosition)
    yPosition += 7
    pdf.setFont("helvetica", "normal")
    pdf.text(`Name: ${dataToUse.seller?.name || ""}`, 20, yPosition)
    yPosition += 6
    if (dataToUse.seller?.address) {
      const addressLines = pdf.splitTextToSize(dataToUse.seller.address, 170)
      pdf.text(addressLines, 20, yPosition)
      yPosition += addressLines.length * 6
    } else {
      pdf.text(`Address: ${""}`, 20, yPosition)
      yPosition += 6
    }
    pdf.text(`Tax ID: ${dataToUse.seller?.taxId || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Phone: ${dataToUse.seller?.contact?.phone || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Email: ${dataToUse.seller?.contact?.email || ""}`, 20, yPosition)
    yPosition += 10

    // Consignee Information
    pdf.setFont("helvetica", "bold")
    pdf.text("Consignee:", 20, yPosition)
    yPosition += 7
    pdf.setFont("helvetica", "normal")
    pdf.text(`Name: ${dataToUse.buyer?.name || ""}`, 20, yPosition)
    yPosition += 6
    if (dataToUse.buyer?.address) {
      const addressLines = pdf.splitTextToSize(dataToUse.buyer.address, 170)
      pdf.text(addressLines, 20, yPosition)
      yPosition += addressLines.length * 6
    } else {
      pdf.text(`Address: ${""}`, 20, yPosition)
      yPosition += 6
    }
    pdf.text(`Tax ID: ${dataToUse.buyer?.taxId || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Phone: ${dataToUse.buyer?.contact?.phone || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Email: ${dataToUse.buyer?.contact?.email || ""}`, 20, yPosition)
    yPosition += 10

    // Products
    pdf.setFont("helvetica", "bold")
    pdf.text("Goods:", 20, yPosition)
    yPosition += 7
    pdf.setFont("helvetica", "normal")
    
    if (dataToUse.products && dataToUse.products.length > 0) {
      dataToUse.products.forEach((product: any, index: number) => {
        pdf.text(`${index + 1}. ${product.description || ""}`, 25, yPosition)
        yPosition += 6
        pdf.text(`   Quantity: ${product.quantity || ""} ${product.unitOfMeasure || ""}`, 25, yPosition)
        yPosition += 6
        pdf.text(`   Origin: ${product.countryOfOrigin || ""}`, 25, yPosition)
        yPosition += 6
        pdf.text(`   HTS Code: ${product.htsCode || ""}`, 25, yPosition)
        yPosition += 8
      })
    } else {
      pdf.text("No products listed", 25, yPosition)
      yPosition += 6
    }

    // Shipment Information
    yPosition += 5
    pdf.setFont("helvetica", "bold")
    pdf.text("Shipment Details:", 20, yPosition)
    yPosition += 7
    pdf.setFont("helvetica", "normal")
    pdf.text(`Origin: ${dataToUse.shipmentInfo?.originCountry || ""}${dataToUse.shipmentInfo?.originCity ? `, ${dataToUse.shipmentInfo.originCity}` : ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Destination: ${dataToUse.shipmentInfo?.destinationCountry || ""}${dataToUse.shipmentInfo?.destinationCity ? `, ${dataToUse.shipmentInfo.destinationCity}` : ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Incoterms: ${dataToUse.shipmentInfo?.incoterm || dataToUse.shipmentInfo?.incoterms || ""}`, 20, yPosition)
    yPosition += 6
  }

  // Generate Transport Documents PDF
  const generateTransportDocsPDF = async (pdf: jsPDF, dataToUse: any, documentType: DocumentType) => {
    let yPosition = 20

    // Title
    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.text("TRANSPORT DOCUMENTS", 105, yPosition, { align: "center" })
    yPosition += 15

    // Plain format
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // Shipment Information
    pdf.setFont("helvetica", "bold")
    pdf.text("Shipment Information:", 20, yPosition)
    yPosition += 7
    pdf.setFont("helvetica", "normal")
    pdf.text(`Origin Country: ${dataToUse.shipmentInfo?.originCountry || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Origin City: ${dataToUse.shipmentInfo?.originCity || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Destination Country: ${dataToUse.shipmentInfo?.destinationCountry || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Destination City: ${dataToUse.shipmentInfo?.destinationCity || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Carrier: ${dataToUse.shipmentInfo?.carrier || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Container Number: ${dataToUse.shipmentInfo?.containerNumber || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Vessel Name: ${dataToUse.shipmentInfo?.vesselName || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Estimated Arrival Date: ${dataToUse.shipmentInfo?.estimatedArrivalDate || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Incoterms: ${dataToUse.shipmentInfo?.incoterm || dataToUse.shipmentInfo?.incoterms || ""}`, 20, yPosition)
    yPosition += 10

    // Shipper
    pdf.setFont("helvetica", "bold")
    pdf.text("Shipper:", 20, yPosition)
    yPosition += 7
    pdf.setFont("helvetica", "normal")
    pdf.text(`Name: ${dataToUse.seller?.name || ""}`, 20, yPosition)
    yPosition += 6
    if (dataToUse.seller?.address) {
      const addressLines = pdf.splitTextToSize(dataToUse.seller.address, 170)
      pdf.text(addressLines, 20, yPosition)
      yPosition += addressLines.length * 6
    }
    pdf.text(`Phone: ${dataToUse.seller?.contact?.phone || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Email: ${dataToUse.seller?.contact?.email || ""}`, 20, yPosition)
    yPosition += 10

    // Consignee
    pdf.setFont("helvetica", "bold")
    pdf.text("Consignee:", 20, yPosition)
    yPosition += 7
    pdf.setFont("helvetica", "normal")
    pdf.text(`Name: ${dataToUse.buyer?.name || ""}`, 20, yPosition)
    yPosition += 6
    if (dataToUse.buyer?.address) {
      const addressLines = pdf.splitTextToSize(dataToUse.buyer.address, 170)
      pdf.text(addressLines, 20, yPosition)
      yPosition += addressLines.length * 6
    }
    pdf.text(`Phone: ${dataToUse.buyer?.contact?.phone || ""}`, 20, yPosition)
    yPosition += 6
    pdf.text(`Email: ${dataToUse.buyer?.contact?.email || ""}`, 20, yPosition)
    yPosition += 10

    // Goods Summary
    pdf.setFont("helvetica", "bold")
    pdf.text("Goods Summary:", 20, yPosition)
    yPosition += 7
    pdf.setFont("helvetica", "normal")
    if (dataToUse.products && dataToUse.products.length > 0) {
      pdf.text(`Total Items: ${dataToUse.products.length}`, 20, yPosition)
      yPosition += 6
      pdf.text(`Total Weight: ${dataToUse.totals?.totalWeight || ""} ${dataToUse.totals?.weightUnit || "kg"}`, 20, yPosition)
      yPosition += 6
      pdf.text(`Total Packages: ${dataToUse.totals?.totalPackages || ""}`, 20, yPosition)
    } else {
      pdf.text("No goods information available", 20, yPosition)
    }
  }

  // Generate Customs/Broker Data Sheet PDF
  const generateCustomsBrokerPDF = async (pdf: jsPDF, dataToUse: any, documentType: DocumentType) => {
    let yPosition = 20

    // Title
    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.text("CUSTOMS/BROKER DATA SHEET", 105, yPosition, { align: "center" })
    yPosition += 15

    // Plain format - data-focused
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")

    // All data in simple key-value format
    const dataFields = [
      ["Invoice Number", dataToUse.invoiceNumber || ""],
      ["Packing List Number", dataToUse.packingListNumber || ""],
      ["Invoice Date", dataToUse.invoiceDate || ""],
      ["Shipment Date", dataToUse.shipmentDate || ""],
      ["Currency", dataToUse.currency || ""],
      ["", ""],
      ["Shipper Name", dataToUse.seller?.name || ""],
      ["Shipper Address", dataToUse.seller?.address || ""],
      ["Shipper Tax ID", dataToUse.seller?.taxId || ""],
      ["Shipper Phone", dataToUse.seller?.contact?.phone || ""],
      ["Shipper Email", dataToUse.seller?.contact?.email || ""],
      ["", ""],
      ["Consignee Name", dataToUse.buyer?.name || ""],
      ["Consignee Address", dataToUse.buyer?.address || ""],
      ["Consignee Tax ID", dataToUse.buyer?.taxId || ""],
      ["Consignee Phone", dataToUse.buyer?.contact?.phone || ""],
      ["Consignee Email", dataToUse.buyer?.contact?.email || ""],
      ["", ""],
      ["Origin Country", dataToUse.shipmentInfo?.originCountry || ""],
      ["Origin City", dataToUse.shipmentInfo?.originCity || ""],
      ["Destination Country", dataToUse.shipmentInfo?.destinationCountry || ""],
      ["Destination City", dataToUse.shipmentInfo?.destinationCity || ""],
      ["Carrier", dataToUse.shipmentInfo?.carrier || ""],
      ["Container Number", dataToUse.shipmentInfo?.containerNumber || ""],
      ["Vessel Name", dataToUse.shipmentInfo?.vesselName || ""],
      ["ETA", dataToUse.shipmentInfo?.estimatedArrivalDate || ""],
      ["Incoterms", dataToUse.shipmentInfo?.incoterm || dataToUse.shipmentInfo?.incoterms || ""],
      ["", ""],
      ["Total Value", dataToUse.totals?.totalValue ? `${dataToUse.totals.currency || "USD"} ${dataToUse.totals.totalValue.toFixed(2)}` : ""],
      ["Total Weight", dataToUse.totals?.totalWeight ? `${dataToUse.totals.totalWeight} ${dataToUse.totals.weightUnit || "kg"}` : ""],
      ["Total Packages", dataToUse.totals?.totalPackages?.toString() || ""],
      ["Total Quantity", dataToUse.totals?.totalQuantity?.toString() || ""],
    ]

    dataFields.forEach(([label, value]) => {
      if (label === "" && value === "") {
        yPosition += 5
      } else {
        pdf.text(`${label}: ${value}`, 20, yPosition)
        yPosition += 6
      }
    })

    // Products table
    if (dataToUse.products && dataToUse.products.length > 0) {
      yPosition += 5
      pdf.setFont("helvetica", "bold")
      pdf.text("Products:", 20, yPosition)
      yPosition += 7
      pdf.setFont("helvetica", "normal")

      const tableData = dataToUse.products.map((product: any) => [
        product.description || "",
        product.quantity?.toString() || "",
        product.htsCode || "",
        product.countryOfOrigin || "",
        product.weight ? `${product.weight} ${product.weightUnit || "kg"}` : "",
      ])

      autoTable(pdf, {
        startY: yPosition,
        head: [["Description", "Qty", "HTS Code", "Origin", "Weight"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [100, 100, 100], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 7, cellPadding: 1.5 },
      })
    }
  }

  // Download PDF
  const downloadPDF = () => {
    if (pdfPreviewUrl) {
      const link = document.createElement("a")
      link.href = pdfPreviewUrl
      link.download = `document-${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Fetch latest documents from Supabase on mount
  const fetchLatestDocuments = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      console.log("⏸️ [fetchLatestDocuments] Already fetching, skipping duplicate call")
      return
    }

    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }

    fetchingRef.current = true
    console.log("🔄 [fetchLatestDocuments] Starting fetch...")

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        fetchingRef.current = false
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
          const documents = [data.documents[0]]
          
          // DEBUG: Log full document structure
          console.log("=== [fetchLatestDocuments] DEBUG: Document Analysis ===")
          documents.forEach((doc: any, idx: number) => {
            console.log(`[Document ${idx}]`, {
              hasTotalDuties: !!doc.extractedData?.totalDuties,
              totalDutiesAmount: doc.extractedData?.totalDuties?.amount,
              totalDutiesCurrency: doc.extractedData?.totalDuties?.currency,
              hasDutyCalculationsArray: !!doc.extractedData?.dutyCalculations,
              dutyCalculationsLength: doc.extractedData?.dutyCalculations?.length || 0,
              productsCount: doc.extractedData?.products?.length || 0,
            })
            
            // Log each product's duty calculation status
            doc.extractedData?.products?.forEach((p: any, pIdx: number) => {
              console.log(`  [Product ${pIdx}] ${p.description || 'Unknown'}`, {
                htsCode: p.htsCode,
                hasDutyCalculation: !!p.dutyCalculation,
                calculatedDuty: p.dutyCalculation?.calculatedDuty,
                isDutyFree: p.dutyCalculation?.isDutyFree,
                dutyRate: p.dutyCalculation?.dutyRate,
                dutyRateType: p.dutyCalculation?.dutyRateType,
                currency: p.dutyCalculation?.currency,
              })
            })
            
            // Log dutyCalculations array details
            if (doc.extractedData?.dutyCalculations) {
              doc.extractedData.dutyCalculations.forEach((d: any, dIdx: number) => {
                console.log(`  [Duty Calculation ${dIdx}]`, {
                  htsCode: d.htsCode,
                  calculatedDuty: d.calculatedDuty,
                  isDutyFree: d.isDutyFree,
                  dutyRate: d.dutyRate,
                  currency: d.currency,
                })
              })
            }
          })
          
          // Check if documents have COMPLETE duty calculations (with calculated values)
          const hasCompleteDutyCalculations = documents.some((doc: any) => {
            // Check for totalDuties with actual amount (even if 0)
            const hasTotalDuties = doc.extractedData?.totalDuties && 
                                   (doc.extractedData.totalDuties.amount !== undefined && doc.extractedData.totalDuties.amount !== null)
            
            // Check for dutyCalculations array with calculated values
            const hasDutyCalculationsArray = doc.extractedData?.dutyCalculations && 
                                             Array.isArray(doc.extractedData.dutyCalculations) && 
                                             doc.extractedData.dutyCalculations.length > 0 &&
                                             doc.extractedData.dutyCalculations.some((d: any) => 
                                               d.calculatedDuty !== undefined || d.isDutyFree !== undefined
                                             )
            
            // Check if ANY product has a dutyCalculation object with calculatedDuty value (not just the property existing)
            const hasProductDutyCalculations = (doc.extractedData?.products || []).some((p: any) => {
              return p.dutyCalculation && 
                     (p.dutyCalculation.calculatedDuty !== undefined || 
                      p.dutyCalculation.isDutyFree !== undefined)
            })
            
            return hasTotalDuties || hasDutyCalculationsArray || hasProductDutyCalculations
          })
          
          if (hasCompleteDutyCalculations) {
            // Documents have complete duty calculations, use them directly
            console.log("✅ [fetchLatestDocuments] Documents have complete duty calculations, using directly")
            console.log("📊 [fetchLatestDocuments] Total Duties:", documents[0]?.extractedData?.totalDuties)
            setProcessedDocuments(documents)
            setLoadingDutyCalculations(false)
          } else {
            // No complete calculations - check if there are HTS codes that need calculation
            const hasHtsCodes = documents.some((doc: any) => 
              (doc.extractedData?.products || []).some((p: any) => p.htsCode)
            )
            
            if (hasHtsCodes) {
              // HTS codes exist but calculations not complete - API should calculate them
              // Don't show loading state here because API calculates synchronously before returning
              // If we're seeing this, it means API didn't calculate (maybe incoterm includes duties)
              console.warn("⚠️ [fetchLatestDocuments] HTS codes found but no complete calculations")
              console.log("🔍 [fetchLatestDocuments] This might mean:")
              console.log("   - API didn't calculate (incoterm includes duties/taxes)")
              console.log("   - API calculation failed")
              console.log("   - Calculations are still in progress")
            }
            
            setProcessedDocuments(documents)
            setLoadingDutyCalculations(false)
          }
          console.log("=== [fetchLatestDocuments] DEBUG: End Analysis ===\n")
        } else {
          setLoadingDutyCalculations(false)
        }
      } else {
        setLoadingDutyCalculations(false)
      }
    } catch (error) {
      console.error("Error fetching latest documents:", error)
      setLoadingDutyCalculations(false)
    } finally {
      fetchingRef.current = false
      console.log("✅ [fetchLatestDocuments] Fetch completed")
    }
  }, [])

  // Fetch orders for the Orders tab
  const fetchOrders = useCallback(async () => {
    if (!user) return

    setLoadingOrders(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setLoadingOrders(false)
        return
      }

      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else {
        console.error("Failed to fetch orders")
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoadingOrders(false)
    }
  }, [user])

  // Fetch available processed documents for order assignment
  const fetchAvailableDocuments = useCallback(async () => {
    if (!user) return

    setLoadingAvailableDocuments(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setLoadingAvailableDocuments(false)
        return
      }

      const response = await fetch("/api/documents/processed", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableDocuments(data.documents || [])
      } else {
        console.error("Failed to fetch available documents")
      }
    } catch (error) {
      console.error("Error fetching available documents:", error)
    } finally {
      setLoadingAvailableDocuments(false)
    }
  }, [user])

  // Create a new order
  const handleCreateOrder = async () => {
    if (!newOrderNumber.trim()) {
      alert("Please enter an order number")
      return
    }

    if (!selectedDocumentParsedDataId) {
      alert("Please select a document to assign to this order")
      return
    }

    setCreatingOrder(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        alert("Please log in to create an order")
        setCreatingOrder(false)
        return
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_number: newOrderNumber.trim(),
          order_name: newOrderName.trim() || null,
          document_parsed_data_id: selectedDocumentParsedDataId,
          document_id: selectedDocumentId,
          status: "draft",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrders([data.order, ...orders])
        setCreateOrderDialogOpen(false)
        setNewOrderNumber("")
        setNewOrderName("")
        setSelectedDocumentParsedDataId(null)
        setSelectedDocumentId(null)
        alert("Order created successfully!")
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to create order" }))
        const errorMessage = errorData.error || errorData.details || "Failed to create order"
        console.error("Order creation error:", errorData)
        alert(`${errorMessage}${errorData.details ? `\n\nDetails: ${errorData.details}` : ""}`)
      }
    } catch (error: any) {
      console.error("Error creating order:", error)
      alert("Failed to create order: " + error.message)
    } finally {
      setCreatingOrder(false)
    }
  }

  // Fetch orders and available documents when Orders tab is active
  useEffect(() => {
    if (activeTab === "orders" && user) {
      fetchOrders()
      fetchAvailableDocuments()
    }
  }, [activeTab, user, fetchOrders, fetchAvailableDocuments])

  // Calculate total duties when orders change or accounting tab is active
  useEffect(() => {
    if (activeTab === "accounting" && orders.length > 0) {
      calculateTotalDuties()
      calculateOrderDutiesBreakdown()
    } else if (activeTab === "accounting" && orders.length === 0) {
      // Fetch orders if accounting tab is active but no orders loaded
      if (user) {
        fetchOrders()
      }
    }
  }, [activeTab, orders, calculateTotalDuties, calculateOrderDutiesBreakdown, user, fetchOrders])

  // Extract clients when orders change or clients tab is active
  useEffect(() => {
    if (activeTab === "clients" && orders.length > 0) {
      extractClientsFromOrders()
    } else if (activeTab === "clients" && orders.length === 0) {
      // Fetch orders if clients tab is active but no orders loaded
      if (user) {
        fetchOrders()
      }
    }
  }, [activeTab, orders, extractClientsFromOrders, user, fetchOrders])

  // Calculate home KPIs when home tab is active or when data changes
  useEffect(() => {
    if (activeTab === "home") {
      if (orders.length === 0 && user) {
        // Fetch orders if home tab is active but no orders loaded
        fetchOrders()
      } else {
        calculateHomeKPIs()
      }
    }
  }, [activeTab, orders, processedDocuments, clients, user, fetchOrders, calculateHomeKPIs])

  useEffect(() => {
    let mounted = true

    // Check if user is authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
        // Fetch latest documents after user is confirmed (with small delay to prevent race conditions)
        setTimeout(() => {
          if (mounted) fetchLatestDocuments()
        }, 100)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session) {
        router.push("/login")
      } else {
        setUser(session.user)
        // Only fetch if this is a sign-in event (not initial load)
        if (_event === "SIGNED_IN") {
          setTimeout(() => {
            if (mounted) fetchLatestDocuments()
          }, 100)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchLatestDocuments, router])

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
      // Only set random count on client side to avoid hydration mismatch
      if (mounted) {
      setNewUpdatesCount(Math.floor(Math.random() * 5) + 1)
      }
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
        const latestDocument = results[results.length - 1] // Get the last processed document (most recent)
        
        // Check if document already has duty calculations from processing
        const hasDutyCalculations = latestDocument.extractedData?.totalDuties || 
                                    (latestDocument.extractedData?.dutyCalculations && Array.isArray(latestDocument.extractedData.dutyCalculations) && latestDocument.extractedData.dutyCalculations.length > 0) ||
                                    (latestDocument.extractedData?.products || []).some((p: any) => {
                                      return p.dutyCalculation && 
                                             (p.dutyCalculation.calculatedDuty !== undefined || 
                                              p.dutyCalculation.isDutyFree !== undefined ||
                                              p.dutyCalculation.dutyRate)
                                    })
        
        if (hasDutyCalculations) {
          // Document already has duty calculations from processing, use directly
          console.log("[handleFileUpload] Document already has duty calculations, using directly")
          setProcessedDocuments([latestDocument])
        } else {
          // No duty calculations yet - set document first, then refresh to get calculated duties from API
          console.log("[handleFileUpload] No duty calculations found, setting document and refreshing")
          setProcessedDocuments([latestDocument])
        }
      }

      // Clear uploaded files after successful processing
      setUploadedFiles([])

      // Refresh latest documents from Supabase to ensure we have the saved data with calculated duties
      // The API will calculate duties if they don't exist, and we'll get them on the next render
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
    <div className="min-h-screen bg-white flex w-full max-w-full overflow-x-hidden">
      {/* Left Sidebar Navigation */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/" prefetch={false} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/images/swiftdocks-logo.png"
                alt="SwiftDocks"
              width={200}
              height={60}
              className="h-12 w-auto"
            />
            </Link>
            </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab("home")}
            className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
              activeTab === "home"
                ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Home
            </button>
          <button
            onClick={() => setActiveTab("document_processing")}
            className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
              activeTab === "document_processing"
                ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Document Processing
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
              activeTab === "orders"
                ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("accounting")}
            className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
              activeTab === "accounting"
                ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Accounting
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
              activeTab === "clients"
                ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Clients
          </button>
          <button
            onClick={() => setActiveTab("brokers")}
            className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
              activeTab === "brokers"
                ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Brokers
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full p-3 rounded-lg font-medium text-left transition-all hover:scale-105 ${
              activeTab === "settings"
                ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Settings
          </button>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg mb-3">
                <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700 truncate">{user.email}</span>
              </div>
              <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === "home" && "Home"}
                {activeTab === "document_processing" && "Document Processing"}
                {activeTab === "orders" && "Orders"}
                {activeTab === "accounting" && "Accounting"}
                {activeTab === "clients" && "Clients"}
                {activeTab === "brokers" && "Brokers"}
                {activeTab === "settings" && "Settings"}
              </h1>
            </div>
        </div>
      </nav>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full">
          {activeTab === "home" && (
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
                  <p className="text-sm text-gray-500 mt-1">Business metrics and recent activity</p>
                </div>
                <Button
                  onClick={() => {
                    if (orders.length === 0 && user) {
                      fetchOrders()
                    }
                    calculateHomeKPIs()
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Order Metrics */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Order Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                        <p className="text-xl font-semibold text-gray-900">{homeKPIs.totalOrders}</p>
                      </div>
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Open Orders</p>
                        <p className="text-xl font-semibold text-gray-900">{homeKPIs.openOrders}</p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Closed Orders</p>
                        <p className="text-xl font-semibold text-gray-900">{homeKPIs.closedOrders}</p>
                      </div>
                      <XCircle className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Orders This Month</p>
                        <p className="text-xl font-semibold text-gray-900">{homeKPIs.ordersThisMonth}</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Financial Metrics */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Financial Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Duties Cost</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {homeKPIs.dutiesCurrency} {homeKPIs.totalDutiesCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Average Order Value</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {homeKPIs.dutiesCurrency} {homeKPIs.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <BarChart3 className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Shipment Value</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {homeKPIs.dutiesCurrency} {homeKPIs.totalShipmentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Ship className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duties This Month</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {homeKPIs.dutiesCurrency} {homeKPIs.dutiesThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Calculator className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Document Processing Metrics */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Document Processing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Documents Processed</p>
                        <p className="text-xl font-semibold text-gray-900">{homeKPIs.documentsProcessed}</p>
                      </div>
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                        <p className="text-xl font-semibold text-gray-900">{homeKPIs.processingSuccessRate.toFixed(1)}%</p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Documents This Month</p>
                        <p className="text-xl font-semibold text-gray-900">{homeKPIs.documentsThisMonth}</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Pending Processing</p>
                        <p className="text-xl font-semibold text-gray-900">{homeKPIs.pendingProcessing}</p>
                      </div>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Client Metrics */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Client Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Active Clients</p>
                        <p className="text-xl font-semibold text-gray-900">{homeKPIs.activeClients}</p>
                      </div>
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                  <Card className="p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">New Clients This Month</p>
                        <p className="text-xl font-semibold text-gray-900">{homeKPIs.newClientsThisMonth}</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Two Column Layout for Additional Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders by Status */}
                <Card className="p-5 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    Orders by Status
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(homeKPIs.ordersByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 capitalize">{status}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-gray-400"
                              style={{ width: `${(count / homeKPIs.totalOrders) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                    {Object.keys(homeKPIs.ordersByStatus).length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-4">No orders yet</p>
                    )}
                  </div>
                </Card>

                {/* Top Countries */}
                <Card className="p-5 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    Top Countries
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Top Origin Countries</p>
                      <div className="space-y-2">
                        {homeKPIs.topOriginCountries.length > 0 ? (
                          homeKPIs.topOriginCountries.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{item.country}</span>
                              <span className="font-medium text-gray-900">{item.count} orders</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">No data available</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Top Destination Countries</p>
                      <div className="space-y-2">
                        {homeKPIs.topDestinationCountries.length > 0 ? (
                          homeKPIs.topDestinationCountries.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{item.country}</span>
                              <span className="font-medium text-gray-900">{item.count} orders</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">No data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <Card className="p-5 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    Recent Orders
                  </h3>
                  <div className="space-y-2">
                    {homeKPIs.recentOrders.length > 0 ? (
                      homeKPIs.recentOrders.map((order: any) => (
                        <div
                          key={order.id}
                          className="p-2.5 border border-gray-100 rounded hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setActiveTab("orders")
                            setExpandedOrderId(order.id)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-xs text-gray-900">{order.order_number}</p>
                              {order.order_name && (
                                <p className="text-xs text-gray-500 mt-0.5">{order.order_name}</p>
                              )}
                            </div>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              order.status === "completed" ? "bg-gray-100 text-gray-700" :
                              order.status === "active" ? "bg-gray-100 text-gray-700" :
                              order.status === "pending" ? "bg-gray-100 text-gray-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-4">No recent orders</p>
                    )}
                  </div>
                </Card>

                {/* Recent Documents */}
                <Card className="p-5 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Recent Documents
                  </h3>
                  <div className="space-y-2">
                    {homeKPIs.recentDocuments.length > 0 ? (
                      homeKPIs.recentDocuments.map((doc: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 border border-gray-100 rounded hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setActiveTab("document_processing")}
                        >
                          <p className="font-medium text-xs text-gray-900">
                            {doc.file_name || doc.documentType || "Document"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {doc.documentType || "Unknown type"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-4">No recent documents</p>
                    )}
                  </div>
                </Card>

                {/* Upcoming Deliveries */}
                <Card className="p-5 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <Ship className="h-4 w-4 text-gray-400" />
                    Upcoming Deliveries
                  </h3>
                  <div className="space-y-2">
                    {homeKPIs.upcomingDeliveries.length > 0 ? (
                      homeKPIs.upcomingDeliveries.map((order: any) => (
                        <div
                          key={order.id}
                          className="p-2.5 border border-gray-100 rounded hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setActiveTab("orders")
                            setExpandedOrderId(order.id)
                          }}
                        >
                          <div>
                            <p className="font-medium text-xs text-gray-900">{order.order_number}</p>
                            {order.expected_delivery_date && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {mounted ? new Date(order.expected_delivery_date).toLocaleDateString() : order.expected_delivery_date}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-4">No upcoming deliveries</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "document_processing" && (
            <div className="p-6 space-y-6">
              {/* All Current Dashboard Content */}
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
              const docId = (doc as any).documentId || `doc-${docIndex}`
              const isEditing = editingDocumentId === docId
              const currentEditedData = editedData[docId] || doc.extractedData

              // NOTE: Table structure and column formatting below may be changed later
              // Keep this section isolated for easy updates
              return (
                <div key={docIndex} className="mb-6 last:mb-0">
                  {/* Document Header Info */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {/* Edit/Save/Cancel Buttons */}
                    <div className="flex justify-end mb-4 gap-2">
                      {!isEditing ? (
                        <>
                          <Button
                            onClick={() => openPdfTemplateSelector(doc, docIndex)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={generatingPdf}
                          >
                            <FileDown className="h-4 w-4" />
                            {generatingPdf ? "Generating..." : "Generate PDF"}
                          </Button>
                          <Button
                            onClick={() => handleStartEdit(docIndex, doc)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleCancelEdit()}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSaveEdit(docIndex, doc)}
                            size="sm"
                            className="gap-2"
                            disabled={isSaving}
                          >
                            <Save className="h-4 w-4" />
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      {doc.documentType === "commercial_invoice" && (currentEditedData.invoiceNumber || isEditing) && (
                        <div>
                          <span className="text-gray-500">Invoice #:</span>
                          {isEditing ? (
                            <Input
                              value={currentEditedData.invoiceNumber || ""}
                              onChange={(e) => {
                                setEditedData({
                                  ...editedData,
                                  [docId]: { ...currentEditedData, invoiceNumber: e.target.value },
                                })
                              }}
                              className="mt-1"
                              placeholder="Invoice number"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">{currentEditedData.invoiceNumber}</span>
                          )}
                        </div>
                      )}
                      {doc.documentType === "packing_list" && (currentEditedData.packingListNumber || isEditing) && (
                        <div>
                          <span className="text-gray-500">Packing List #:</span>
                          {isEditing ? (
                            <Input
                              value={currentEditedData.packingListNumber || ""}
                              onChange={(e) => {
                                setEditedData({
                                  ...editedData,
                                  [docId]: { ...currentEditedData, packingListNumber: e.target.value },
                                })
                              }}
                              className="mt-1"
                              placeholder="Packing list number"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">{currentEditedData.packingListNumber}</span>
                          )}
                        </div>
                      )}
                      {(currentEditedData.invoiceDate || isEditing) && (
                        <div>
                          <span className="text-gray-500">Date:</span>
                          {isEditing ? (
                            <Input
                              value={currentEditedData.invoiceDate || ""}
                              onChange={(e) => {
                                setEditedData({
                                  ...editedData,
                                  [docId]: { ...currentEditedData, invoiceDate: e.target.value },
                                })
                              }}
                              className="mt-1"
                              placeholder="Invoice date"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">{currentEditedData.invoiceDate}</span>
                          )}
                        </div>
                      )}
                      {(currentEditedData.shipmentDate || isEditing) && (
                        <div>
                          <span className="text-gray-500">Shipment Date:</span>
                          {isEditing ? (
                            <Input
                              value={currentEditedData.shipmentDate || ""}
                              onChange={(e) => {
                                setEditedData({
                                  ...editedData,
                                  [docId]: { ...currentEditedData, shipmentDate: e.target.value },
                                })
                              }}
                              className="mt-1"
                              placeholder="Shipment date"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">{currentEditedData.shipmentDate}</span>
                          )}
                        </div>
                      )}
                      {(currentEditedData.totals?.totalValue || isEditing) && (
                        <div>
                          <span className="text-gray-500">Total Value:</span>
                          {isEditing ? (
                            <div className="flex gap-2 mt-1">
                              <Input
                                value={currentEditedData.totals?.currency || "USD"}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      totals: { ...currentEditedData.totals, currency: e.target.value },
                                    },
                                  })
                                }}
                                className="w-20"
                                placeholder="USD"
                              />
                              <Input
                                type="number"
                                value={currentEditedData.totals?.totalValue || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      totals: { ...currentEditedData.totals, totalValue: parseFloat(e.target.value) || 0 },
                                    },
                                  })
                                }}
                                className="flex-1"
                                placeholder="0.00"
                              />
                            </div>
                          ) : (
                          <span className="ml-2 font-medium text-gray-900">
                              {currentEditedData.totals?.currency || "USD"} {currentEditedData.totals?.totalValue?.toLocaleString()}
                          </span>
                          )}
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
                    {(currentEditedData.seller || isEditing) && (
                      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Shipper/Exporter</h4>
                        <div className="text-sm space-y-2">
                            <div>
                              <span className="text-gray-500">Name: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.seller?.name || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      seller: { ...currentEditedData.seller, name: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Company name"
                              />
                            ) : (
                              <span className="font-medium text-gray-900">{currentEditedData.seller?.name}</span>
                            )}
                          </div>
                            <div>
                              <span className="text-gray-500">Address: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.seller?.address || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      seller: { ...currentEditedData.seller, address: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Complete address"
                              />
                            ) : (
                              <span className="text-gray-900">{currentEditedData.seller?.address}</span>
                            )}
                          </div>
                            <div>
                              <span className="text-gray-500">Tax ID: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.seller?.taxId || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      seller: { ...currentEditedData.seller, taxId: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Tax ID"
                              />
                            ) : (
                              <span className="text-gray-900">{currentEditedData.seller?.taxId}</span>
                            )}
                          </div>
                          {(currentEditedData.seller?.contact || isEditing) && (
                            <div className="mt-2 space-y-2">
                                <div>
                                  <span className="text-gray-500">Phone: </span>
                                {isEditing ? (
                                  <Input
                                    value={currentEditedData.seller?.contact?.phone || ""}
                                    onChange={(e) => {
                                      setEditedData({
                                        ...editedData,
                                        [docId]: {
                                          ...currentEditedData,
                                          seller: {
                                            ...currentEditedData.seller,
                                            contact: { ...currentEditedData.seller?.contact, phone: e.target.value },
                                          },
                                        },
                                      })
                                    }}
                                    className="mt-1"
                                    placeholder="Phone number"
                                  />
                                ) : (
                                  <span className="text-gray-900">{currentEditedData.seller?.contact?.phone}</span>
                                )}
                              </div>
                                <div>
                                  <span className="text-gray-500">Email: </span>
                                {isEditing ? (
                                  <Input
                                    type="email"
                                    value={currentEditedData.seller?.contact?.email || ""}
                                    onChange={(e) => {
                                      setEditedData({
                                        ...editedData,
                                        [docId]: {
                                          ...currentEditedData,
                                          seller: {
                                            ...currentEditedData.seller,
                                            contact: { ...currentEditedData.seller?.contact, email: e.target.value },
                                          },
                                        },
                                      })
                                    }}
                                    className="mt-1"
                                    placeholder="Email address"
                                  />
                                ) : (
                                  <span className="text-gray-900">{currentEditedData.seller?.contact?.email}</span>
                                )}
                              </div>
                                <div>
                                  <span className="text-gray-500">Fax: </span>
                                {isEditing ? (
                                  <Input
                                    value={currentEditedData.seller?.contact?.fax || ""}
                                    onChange={(e) => {
                                      setEditedData({
                                        ...editedData,
                                        [docId]: {
                                          ...currentEditedData,
                                          seller: {
                                            ...currentEditedData.seller,
                                            contact: { ...currentEditedData.seller?.contact, fax: e.target.value },
                                          },
                                        },
                                      })
                                    }}
                                    className="mt-1"
                                    placeholder="Fax number"
                                  />
                                ) : (
                                  <span className="text-gray-900">{currentEditedData.seller?.contact?.fax}</span>
                                )}
                              </div>
                                <div>
                                  <span className="text-gray-500">Contact Person: </span>
                                {isEditing ? (
                                  <Input
                                    value={currentEditedData.seller?.contact?.contactPerson || ""}
                                    onChange={(e) => {
                                      setEditedData({
                                        ...editedData,
                                        [docId]: {
                                          ...currentEditedData,
                                          seller: {
                                            ...currentEditedData.seller,
                                            contact: { ...currentEditedData.seller?.contact, contactPerson: e.target.value },
                                          },
                                        },
                                      })
                                    }}
                                    className="mt-1"
                                    placeholder="Contact person name"
                                  />
                                ) : (
                                  <span className="text-gray-900">{currentEditedData.seller?.contact?.contactPerson}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Consignee Information */}
                    {(currentEditedData.buyer || isEditing) && (
                      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Consignee</h4>
                        <div className="text-sm space-y-2">
                            <div>
                              <span className="text-gray-500">Name: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.buyer?.name || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      buyer: { ...currentEditedData.buyer, name: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Company name"
                              />
                            ) : (
                              <span className="font-medium text-gray-900">{currentEditedData.buyer?.name}</span>
                            )}
                          </div>
                            <div>
                              <span className="text-gray-500">Address: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.buyer?.address || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      buyer: { ...currentEditedData.buyer, address: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Complete address"
                              />
                            ) : (
                              <span className="text-gray-900">{currentEditedData.buyer?.address}</span>
                            )}
                          </div>
                            <div>
                              <span className="text-gray-500">Tax ID: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.buyer?.taxId || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      buyer: { ...currentEditedData.buyer, taxId: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Tax ID"
                              />
                            ) : (
                              <span className="text-gray-900">{currentEditedData.buyer?.taxId}</span>
                            )}
                          </div>
                          {(currentEditedData.buyer?.contact || isEditing) && (
                            <div className="mt-2 space-y-2">
                                <div>
                                  <span className="text-gray-500">Phone: </span>
                                {isEditing ? (
                                  <Input
                                    value={currentEditedData.buyer?.contact?.phone || ""}
                                    onChange={(e) => {
                                      setEditedData({
                                        ...editedData,
                                        [docId]: {
                                          ...currentEditedData,
                                          buyer: {
                                            ...currentEditedData.buyer,
                                            contact: { ...currentEditedData.buyer?.contact, phone: e.target.value },
                                          },
                                        },
                                      })
                                    }}
                                    className="mt-1"
                                    placeholder="Phone number"
                                  />
                                ) : (
                                  <span className="text-gray-900">{currentEditedData.buyer?.contact?.phone}</span>
                                )}
                              </div>
                                <div>
                                  <span className="text-gray-500">Email: </span>
                                {isEditing ? (
                                  <Input
                                    type="email"
                                    value={currentEditedData.buyer?.contact?.email || ""}
                                    onChange={(e) => {
                                      setEditedData({
                                        ...editedData,
                                        [docId]: {
                                          ...currentEditedData,
                                          buyer: {
                                            ...currentEditedData.buyer,
                                            contact: { ...currentEditedData.buyer?.contact, email: e.target.value },
                                          },
                                        },
                                      })
                                    }}
                                    className="mt-1"
                                    placeholder="Email address"
                                  />
                                ) : (
                                  <span className="text-gray-900">{currentEditedData.buyer?.contact?.email}</span>
                                )}
                              </div>
                                <div>
                                  <span className="text-gray-500">Fax: </span>
                                {isEditing ? (
                                  <Input
                                    value={currentEditedData.buyer?.contact?.fax || ""}
                                    onChange={(e) => {
                                      setEditedData({
                                        ...editedData,
                                        [docId]: {
                                          ...currentEditedData,
                                          buyer: {
                                            ...currentEditedData.buyer,
                                            contact: { ...currentEditedData.buyer?.contact, fax: e.target.value },
                                          },
                                        },
                                      })
                                    }}
                                    className="mt-1"
                                    placeholder="Fax number"
                                  />
                                ) : (
                                  <span className="text-gray-900">{currentEditedData.buyer?.contact?.fax}</span>
                                )}
                              </div>
                                <div>
                                  <span className="text-gray-500">Contact Person: </span>
                                {isEditing ? (
                                  <Input
                                    value={currentEditedData.buyer?.contact?.contactPerson || ""}
                                    onChange={(e) => {
                                      setEditedData({
                                        ...editedData,
                                        [docId]: {
                                          ...currentEditedData,
                                          buyer: {
                                            ...currentEditedData.buyer,
                                            contact: { ...currentEditedData.buyer?.contact, contactPerson: e.target.value },
                                          },
                                        },
                                      })
                                    }}
                                    className="mt-1"
                                    placeholder="Contact person name"
                                  />
                                ) : (
                                  <span className="text-gray-900">{currentEditedData.buyer?.contact?.contactPerson}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Signer Information */}
                    {(currentEditedData.signer || isEditing) && (
                      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Document Signer</h4>
                        <div className="text-sm space-y-2">
                            <div>
                              <span className="text-gray-500">Name: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.signer?.name || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      signer: { ...currentEditedData.signer, name: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Signer name"
                              />
                            ) : (
                              <span className="font-medium text-gray-900">{currentEditedData.signer?.name}</span>
                            )}
                          </div>
                            <div>
                              <span className="text-gray-500">Company: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.signer?.company || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      signer: { ...currentEditedData.signer, company: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Company name"
                              />
                            ) : (
                              <span className="text-gray-900">{currentEditedData.signer?.company}</span>
                            )}
                          </div>
                            <div>
                              <span className="text-gray-500">Title: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.signer?.title || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      signer: { ...currentEditedData.signer, title: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Job title"
                              />
                            ) : (
                              <span className="text-gray-900">{currentEditedData.signer?.title}</span>
                            )}
                          </div>
                            <div>
                              <span className="text-gray-500">Signature: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.signer?.signature || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      signer: { ...currentEditedData.signer, signature: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Signature info"
                              />
                            ) : (
                              <span className="text-gray-900">{currentEditedData.signer?.signature}</span>
                            )}
                          </div>
                            <div>
                              <span className="text-gray-500">Date: </span>
                            {isEditing ? (
                              <Input
                                value={currentEditedData.signer?.date || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      signer: { ...currentEditedData.signer, date: e.target.value },
                                    },
                                  })
                                }}
                                className="mt-1"
                                placeholder="Signature date"
                              />
                            ) : (
                              <span className="text-gray-900">{currentEditedData.signer?.date}</span>
                            )}
                          </div>
                          {(currentEditedData.signer?.contact || isEditing) && (
                            <div className="mt-2 space-y-2">
                                <div>
                                  <span className="text-gray-500">Phone: </span>
                                {isEditing ? (
                                  <Input
                                    value={currentEditedData.signer?.contact?.phone || ""}
                                    onChange={(e) => {
                                      setEditedData({
                                        ...editedData,
                                        [docId]: {
                                          ...currentEditedData,
                                          signer: {
                                            ...currentEditedData.signer,
                                            contact: { ...currentEditedData.signer?.contact, phone: e.target.value },
                                          },
                                        },
                                      })
                                    }}
                                    className="mt-1"
                                    placeholder="Phone number"
                                  />
                                ) : (
                                  <span className="text-gray-900">{currentEditedData.signer?.contact?.phone}</span>
                                )}
                              </div>
                                <div>
                                  <span className="text-gray-500">Email: </span>
                                {isEditing ? (
                                  <Input
                                    type="email"
                                    value={currentEditedData.signer?.contact?.email || ""}
                                    onChange={(e) => {
                                      setEditedData({
                                        ...editedData,
                                        [docId]: {
                                          ...currentEditedData,
                                          signer: {
                                            ...currentEditedData.signer,
                                            contact: { ...currentEditedData.signer?.contact, email: e.target.value },
                                          },
                                        },
                                      })
                                    }}
                                    className="mt-1"
                                    placeholder="Email address"
                                  />
                                ) : (
                                  <span className="text-gray-900">{currentEditedData.signer?.contact?.email}</span>
                                )}
                              </div>
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
                              {allProducts.some((p) => p.dutyCalculation || p.htsCode || (p as any).dutyInfo) && (
                                <TableHead className="font-semibold">Duty Calculation</TableHead>
                              )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* NOTE: Row formatting and cell display logic may be changed later */}
                          {(isEditing ? currentEditedData.products : allProducts).map((product: any, productIndex: number) => (
                            <TableRow key={productIndex} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {isEditing ? (
                                  <Input
                                    value={product.description || ""}
                                    onChange={(e) => {
                                      const updatedProducts = [...(currentEditedData.products || [])]
                                      updatedProducts[productIndex] = { ...updatedProducts[productIndex], description: e.target.value }
                                      setEditedData({
                                        ...editedData,
                                        [docId]: { ...currentEditedData, products: updatedProducts },
                                      })
                                    }}
                                    placeholder="Product description"
                                  />
                                ) : (
                                  product.description || "N/A"
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={product.quantity || ""}
                                    onChange={(e) => {
                                      const updatedProducts = [...(currentEditedData.products || [])]
                                      updatedProducts[productIndex] = { ...updatedProducts[productIndex], quantity: parseFloat(e.target.value) || 0 }
                                      setEditedData({
                                        ...editedData,
                                        [docId]: { ...currentEditedData, products: updatedProducts },
                                      })
                                    }}
                                    placeholder="Quantity"
                                  />
                                ) : (
                                  product.quantity || "-"
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {isEditing ? (
                                  <Input
                                    value={product.unitOfMeasure || ""}
                                    onChange={(e) => {
                                      const updatedProducts = [...(currentEditedData.products || [])]
                                      updatedProducts[productIndex] = { ...updatedProducts[productIndex], unitOfMeasure: e.target.value }
                                      setEditedData({
                                        ...editedData,
                                        [docId]: { ...currentEditedData, products: updatedProducts },
                                      })
                                    }}
                                    placeholder="Unit"
                                  />
                                ) : (
                                  product.unitOfMeasure || "-"
                                )}
                              </TableCell>
                              {allProducts.some((p) => p.unitPrice) && (
                                <TableCell>
                                  {isEditing ? (
                                    <div className="flex gap-1">
                                      <Input
                                        value={product.currency || "USD"}
                                        onChange={(e) => {
                                          const updatedProducts = [...(currentEditedData.products || [])]
                                          updatedProducts[productIndex] = { ...updatedProducts[productIndex], currency: e.target.value }
                                          setEditedData({
                                            ...editedData,
                                            [docId]: { ...currentEditedData, products: updatedProducts },
                                          })
                                        }}
                                        className="w-16"
                                        placeholder="USD"
                                      />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={product.unitPrice || ""}
                                        onChange={(e) => {
                                          const updatedProducts = [...(currentEditedData.products || [])]
                                          updatedProducts[productIndex] = { ...updatedProducts[productIndex], unitPrice: parseFloat(e.target.value) || 0 }
                                          setEditedData({
                                            ...editedData,
                                            [docId]: { ...currentEditedData, products: updatedProducts },
                                          })
                                        }}
                                        className="flex-1"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  ) : (
                                    product.unitPrice
                                    ? `${product.currency || "USD"} ${product.unitPrice.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}`
                                      : "-"
                                  )}
                                </TableCell>
                              )}
                              {allProducts.some((p) => p.totalPrice) && (
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={product.totalPrice || ""}
                                      onChange={(e) => {
                                        const updatedProducts = [...(currentEditedData.products || [])]
                                        updatedProducts[productIndex] = { ...updatedProducts[productIndex], totalPrice: parseFloat(e.target.value) || 0 }
                                        setEditedData({
                                          ...editedData,
                                          [docId]: { ...currentEditedData, products: updatedProducts },
                                        })
                                      }}
                                      placeholder="0.00"
                                    />
                                  ) : (
                                    product.totalPrice
                                    ? `${product.currency || "USD"} ${product.totalPrice.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}`
                                      : "-"
                                  )}
                                </TableCell>
                              )}
                              {allProducts.some((p) => p.weight) && (
                                <TableCell>
                                  {isEditing ? (
                                    <div className="flex gap-1">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={product.weight || ""}
                                        onChange={(e) => {
                                          const updatedProducts = [...(currentEditedData.products || [])]
                                          updatedProducts[productIndex] = { ...updatedProducts[productIndex], weight: parseFloat(e.target.value) || 0 }
                                          setEditedData({
                                            ...editedData,
                                            [docId]: { ...currentEditedData, products: updatedProducts },
                                          })
                                        }}
                                        className="flex-1"
                                        placeholder="0.00"
                                      />
                                      <Input
                                        value={product.weightUnit || "kg"}
                                        onChange={(e) => {
                                          const updatedProducts = [...(currentEditedData.products || [])]
                                          updatedProducts[productIndex] = { ...updatedProducts[productIndex], weightUnit: e.target.value }
                                          setEditedData({
                                            ...editedData,
                                            [docId]: { ...currentEditedData, products: updatedProducts },
                                          })
                                        }}
                                        className="w-16"
                                        placeholder="kg"
                                      />
                                    </div>
                                  ) : (
                                    product.weight
                                    ? `${product.weight} ${product.weightUnit || "kg"}`
                                      : "-"
                                  )}
                                </TableCell>
                              )}
                              {allProducts.some((p) => p.countryOfOrigin) && (
                                <TableCell className="text-gray-600">
                                  {isEditing ? (
                                    <Input
                                      value={product.countryOfOrigin || ""}
                                      onChange={(e) => {
                                        const updatedProducts = [...(currentEditedData.products || [])]
                                        updatedProducts[productIndex] = { ...updatedProducts[productIndex], countryOfOrigin: e.target.value }
                                        setEditedData({
                                          ...editedData,
                                          [docId]: { ...currentEditedData, products: updatedProducts },
                                        })
                                      }}
                                      placeholder="Country code"
                                    />
                                  ) : (
                                    product.countryOfOrigin || "-"
                                  )}
                                </TableCell>
                              )}
                              {allProducts.some((p) => p.htsCode) && (
                                <TableCell className="font-mono text-sm">
                                  {isEditing ? (
                                    <Input
                                      value={product.htsCode || ""}
                                      onChange={(e) => {
                                        const updatedProducts = [...(currentEditedData.products || [])]
                                        updatedProducts[productIndex] = { ...updatedProducts[productIndex], htsCode: e.target.value }
                                        setEditedData({
                                          ...editedData,
                                          [docId]: { ...currentEditedData, products: updatedProducts },
                                        })
                                      }}
                                      placeholder="HTS Code"
                                    />
                                  ) : (
                                    product.htsCode || "-"
                                  )}
                                </TableCell>
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
                              {allProducts.some((p) => p.dutyCalculation || p.htsCode || (p as any).dutyInfo) && (
                                <TableCell>
                                  {(() => {
                                    // DEBUG: Log duty calculation display
                                    if (product.dutyCalculation) {
                                      console.log(`[UI Render] Product "${product.description}" duty calculation:`, {
                                        calculatedDuty: product.dutyCalculation.calculatedDuty,
                                        currency: product.dutyCalculation.currency,
                                        isDutyFree: product.dutyCalculation.isDutyFree,
                                        dutyRate: product.dutyCalculation.dutyRate,
                                        fullObject: product.dutyCalculation,
                                      })
                                    }
                                    return null
                                  })()}
                                  {product.dutyCalculation ? (
                                    <div className="space-y-1">
                                      {product.dutyCalculation.isDutyFree ? (
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                          <span className="font-semibold text-green-600">No Duty (Free)</span>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="font-semibold text-red-600">
                                            {(() => {
                                              const calculatedValue = product.dutyCalculation.calculatedDuty
                                              const currency = product.dutyCalculation.currency || "USD"
                                              const formatted = calculatedValue?.toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                              }) || "0.00"
                                              console.log(`[UI Render] Displaying duty for "${product.description}":`, {
                                                calculatedValue,
                                                currency,
                                                formatted,
                                                displayString: `${currency} ${formatted}`,
                                              })
                                              return `${currency} ${formatted}`
                                            })()}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            Rate: {product.dutyCalculation.dutyRate || 'N/A'} ({product.dutyCalculation.dutyRateType || 'general'})
                                          </div>
                                          {product.dutyCalculation.freeTradeAgreement && product.dutyCalculation.freeTradeAgreement !== 'None' && (
                                            <div className="text-xs text-blue-600 flex items-center gap-1">
                                              <Globe className="h-3 w-3" />
                                              <span>FTA: {product.dutyCalculation.freeTradeAgreement}</span>
                                              {product.dutyCalculation.ftaBenefit && product.dutyCalculation.ftaBenefit > 0 && (
                                                <span className="text-green-600">
                                                  (Savings: {product.dutyCalculation.currency || "USD"} {product.dutyCalculation.ftaBenefit.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })})
                                                </span>
                                              )}
                                            </div>
                                          )}
                                          {product.dutyCalculation.additionalDuties && (
                                            <div className="text-xs text-orange-600">
                                              + Additional: {product.dutyCalculation.additionalDuties}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ) : (product as any).dutyInfo ? (
                                    <div className="space-y-1">
                                      {(!(product as any).dutyInfo.selectedRate || (product as any).dutyInfo.selectedRate.toLowerCase() === 'free') ? (
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                          <span className="font-semibold text-green-600">No Duty (Free)</span>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="text-xs font-semibold text-gray-700">
                                            Rate: {(product as any).dutyInfo.selectedRate || 'N/A'}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            Type: {(product as any).dutyInfo.selectedRateType || 'general'}
                                          </div>
                                          {(product as any).dutyInfo.generalRate && (
                                            <div className="text-xs text-gray-500">
                                              General: {(product as any).dutyInfo.generalRate}
                                            </div>
                                          )}
                                          {(product as any).dutyInfo.specialRate && (
                                            <div className="text-xs text-gray-500">
                                              Special: {(product as any).dutyInfo.specialRate}
                                            </div>
                                          )}
                                          {(product as any).dutyInfo.column2Rate && (
                                            <div className="text-xs text-gray-500">
                                              Column 2: {(product as any).dutyInfo.column2Rate}
                                            </div>
                                          )}
                                          {(product as any).dutyInfo.additionalDuties && (
                                            <div className="text-xs text-orange-600 mt-1">
                                              + Additional: {(product as any).dutyInfo.additionalDuties}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ) : product.htsCode ? (
                                    <span className="text-gray-400 text-xs">
                                      {mounted && loadingDutyCalculations ? "Calculating duty..." : "Loading duty information..."}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
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
                  {(currentEditedData.shipmentInfo || isEditing) && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Shipment Information</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Origin Country:</span>
                          {isEditing ? (
                            <div className="mt-1 space-y-1">
                              <Input
                                value={currentEditedData.shipmentInfo?.originCountry || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      shipmentInfo: { ...currentEditedData.shipmentInfo, originCountry: e.target.value },
                                    },
                                  })
                                }}
                                placeholder="Origin country"
                              />
                              <Input
                                value={currentEditedData.shipmentInfo?.originCity || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      shipmentInfo: { ...currentEditedData.shipmentInfo, originCity: e.target.value },
                                    },
                                  })
                                }}
                                placeholder="Origin city"
                              />
                            </div>
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">
                              {currentEditedData.shipmentInfo?.originCountry}
                              {currentEditedData.shipmentInfo?.originCity && `, ${currentEditedData.shipmentInfo.originCity}`}
                            </span>
                        )}
                        </div>
                          <div>
                            <span className="text-gray-500">Destination:</span>
                          {isEditing ? (
                            <div className="mt-1 space-y-1">
                              <Input
                                value={currentEditedData.shipmentInfo?.destinationCountry || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      shipmentInfo: { ...currentEditedData.shipmentInfo, destinationCountry: e.target.value },
                                    },
                                  })
                                }}
                                placeholder="Destination country"
                              />
                              <Input
                                value={currentEditedData.shipmentInfo?.destinationCity || ""}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [docId]: {
                                      ...currentEditedData,
                                      shipmentInfo: { ...currentEditedData.shipmentInfo, destinationCity: e.target.value },
                                    },
                                  })
                                }}
                                placeholder="Destination city"
                              />
                            </div>
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">
                              {currentEditedData.shipmentInfo?.destinationCountry}
                              {currentEditedData.shipmentInfo?.destinationCity &&
                                `, ${currentEditedData.shipmentInfo.destinationCity}`}
                            </span>
                        )}
                        </div>
                          <div>
                            <span className="text-gray-500">Carrier:</span>
                          {isEditing ? (
                            <Input
                              value={currentEditedData.shipmentInfo?.carrier || ""}
                              onChange={(e) => {
                                setEditedData({
                                  ...editedData,
                                  [docId]: {
                                    ...currentEditedData,
                                    shipmentInfo: { ...currentEditedData.shipmentInfo, carrier: e.target.value },
                                  },
                                })
                              }}
                              className="mt-1"
                              placeholder="Carrier name"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">{currentEditedData.shipmentInfo?.carrier}</span>
                          )}
                        </div>
                          <div>
                            <span className="text-gray-500">Container:</span>
                          {isEditing ? (
                            <Input
                              value={currentEditedData.shipmentInfo?.containerNumber || ""}
                              onChange={(e) => {
                                setEditedData({
                                  ...editedData,
                                  [docId]: {
                                    ...currentEditedData,
                                    shipmentInfo: { ...currentEditedData.shipmentInfo, containerNumber: e.target.value },
                                  },
                                })
                              }}
                              className="mt-1"
                              placeholder="Container number"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">{currentEditedData.shipmentInfo?.containerNumber}</span>
                          )}
                        </div>
                          <div>
                            <span className="text-gray-500">Vessel:</span>
                          {isEditing ? (
                            <Input
                              value={currentEditedData.shipmentInfo?.vesselName || ""}
                              onChange={(e) => {
                                setEditedData({
                                  ...editedData,
                                  [docId]: {
                                    ...currentEditedData,
                                    shipmentInfo: { ...currentEditedData.shipmentInfo, vesselName: e.target.value },
                                  },
                                })
                              }}
                              className="mt-1"
                              placeholder="Vessel name"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">{currentEditedData.shipmentInfo?.vesselName}</span>
                          )}
                        </div>
                          <div>
                            <span className="text-gray-500">ETA:</span>
                          {isEditing ? (
                            <Input
                              value={currentEditedData.shipmentInfo?.estimatedArrivalDate || ""}
                              onChange={(e) => {
                                setEditedData({
                                  ...editedData,
                                  [docId]: {
                                    ...currentEditedData,
                                    shipmentInfo: { ...currentEditedData.shipmentInfo, estimatedArrivalDate: e.target.value },
                                  },
                                })
                              }}
                              className="mt-1"
                              placeholder="Estimated arrival date"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">{currentEditedData.shipmentInfo?.estimatedArrivalDate}</span>
                          )}
                        </div>
                          <div>
                            <span className="text-gray-500">Incoterms:</span>
                          {isEditing ? (
                            <Input
                              value={currentEditedData.shipmentInfo?.incoterm || currentEditedData.shipmentInfo?.incoterms || ""}
                              onChange={(e) => {
                                setEditedData({
                                  ...editedData,
                                  [docId]: {
                                    ...currentEditedData,
                                    shipmentInfo: { ...currentEditedData.shipmentInfo, incoterm: e.target.value, incoterms: e.target.value },
                                  },
                                })
                              }}
                              className="mt-1"
                              placeholder="Incoterms (e.g., FOB, CIF)"
                            />
                          ) : (
                            <span className="ml-2 font-medium text-gray-900">
                              {currentEditedData.shipmentInfo?.incoterm || currentEditedData.shipmentInfo?.incoterms}
                              {currentEditedData.shipmentInfo?.incotermDetails && (
                                <span className="text-gray-600 text-xs ml-1">
                                  ({currentEditedData.shipmentInfo.incotermDetails.name})
                                </span>
                              )}
                            </span>
                        )}
                        </div>
                      </div>
                      
                      {/* Display detailed incoterm information if available */}
                      {doc.extractedData.shipmentInfo.incotermDetails && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                            <span>Incoterm Details: {doc.extractedData.shipmentInfo.incotermDetails.name}</span>
                            <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                              {doc.extractedData.shipmentInfo.incoterm}
                            </span>
                          </h4>
                          {doc.extractedData.shipmentInfo.incotermDetails.description_short && (
                            <p className="text-sm text-gray-700 mb-3">
                              {doc.extractedData.shipmentInfo.incotermDetails.description_short}
                            </p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${doc.extractedData.shipmentInfo.incotermDetails.includes_pre_carriage ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                              <span className="text-gray-600">Pre-Carriage</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${doc.extractedData.shipmentInfo.incotermDetails.includes_main_carriage ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                              <span className="text-gray-600">Main Carriage</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${doc.extractedData.shipmentInfo.incotermDetails.includes_insurance ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                              <span className="text-gray-600">Insurance</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${doc.extractedData.shipmentInfo.incotermDetails.includes_export_clearance ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                              <span className="text-gray-600">Export Clearance</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${doc.extractedData.shipmentInfo.incotermDetails.includes_import_clearance ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                              <span className="text-gray-600">Import Clearance</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${doc.extractedData.shipmentInfo.incotermDetails.includes_duties_taxes ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                              <span className="text-gray-600">Duties & Taxes</span>
                            </div>
                            {doc.extractedData.shipmentInfo.incotermDetails.transport_mode && (
                              <div>
                                <span className="text-gray-500">Transport Mode:</span>
                                <span className="ml-2 font-medium text-gray-900 capitalize">
                                  {doc.extractedData.shipmentInfo.incotermDetails.transport_mode}
                                </span>
                              </div>
                            )}
                            {doc.extractedData.shipmentInfo.incotermDetails.valuation_basis && (
                              <div>
                                <span className="text-gray-500">Valuation Basis:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {doc.extractedData.shipmentInfo.incotermDetails.valuation_basis}
                                </span>
                              </div>
                            )}
                          </div>
                          {doc.extractedData.shipmentInfo.incotermDetails.risk_transfer_point && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <span className="text-gray-500 text-sm">Risk Transfer Point: </span>
                              <span className="text-gray-900 text-sm font-medium">
                                {doc.extractedData.shipmentInfo.incotermDetails.risk_transfer_point}
                              </span>
                            </div>
                          )}
                          {doc.extractedData.shipmentInfo.incotermDetails.notes && (
                            <div className="mt-2 pt-2 border-t border-green-200">
                              <span className="text-gray-500 text-sm">Notes: </span>
                              <span className="text-gray-700 text-sm">
                                {doc.extractedData.shipmentInfo.incotermDetails.notes}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Duty Calculations Summary - Always displayed after Shipment Information */}
                  {/* Show this section if there are products with HTS codes or if duty calculations exist */}
                  {(allProducts.some((p: any) => p.htsCode) || doc.extractedData.totalDuties || (doc.extractedData.dutyCalculations && doc.extractedData.dutyCalculations.length > 0)) && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-red-600" />
                        <span>Duty Calculations (Incoterms 2020 Compliant)</span>
                      </h4>
                      
                      {/* Show total duties if available */}
                      {doc.extractedData.totalDuties && doc.extractedData.totalDuties.amount > 0 ? (
                        <>
                          <div className="text-2xl font-bold text-red-600 mb-2">
                            {doc.extractedData.totalDuties.currency || "USD"} {doc.extractedData.totalDuties.amount?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </div>
                          <p className="text-xs text-gray-600 mb-3">Total duties calculated from HTS codes table</p>
                        </>
                      ) : doc.extractedData.totalDuties && doc.extractedData.totalDuties.amount === 0 ? (
                        <div className="text-lg font-semibold text-green-600 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>No Duties Apply</span>
                        </div>
                      ) : null}
                      
                      {/* Show duty calculations breakdown if available */}
                      {doc.extractedData.dutyCalculations && doc.extractedData.dutyCalculations.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-700 mb-2">Breakdown by HTS Code:</p>
                          {doc.extractedData.dutyCalculations.map((duty: any, idx: number) => (
                            <div 
                              key={idx} 
                              className={`text-xs bg-white p-3 rounded border ${
                                duty.isDutyFree 
                                  ? 'border-green-200 bg-green-50' 
                                  : 'border-red-100'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-gray-700 font-semibold">{duty.htsCode || duty.htsNumber}</span>
                                  {duty.freeTradeAgreement && duty.freeTradeAgreement !== 'None' && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                      {duty.freeTradeAgreement}
                                    </span>
                                  )}
                                  {duty.isDutyFree && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                      Free
                                    </span>
                                  )}
                                </div>
                                <span className={`font-semibold ${
                                  duty.isDutyFree ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {duty.isDutyFree ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      No Duty
                                    </span>
                                  ) : (
                                    `${duty.currency || "USD"} ${duty.calculatedDuty?.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) || "0.00"}`
                                  )}
                                </span>
                              </div>
                              
                              {!duty.isDutyFree && (
                                <div className="text-gray-600 mt-1 space-y-0.5">
                                  <div className="text-xs">
                                    <span className="font-medium">Rate:</span> {duty.dutyRate || 'N/A'} ({duty.dutyRateType || 'general'})
                                  </div>
                                  {duty.freeTradeAgreement && duty.freeTradeAgreement !== 'None' && duty.ftaBenefit && duty.ftaBenefit > 0 && (
                                    <div className="text-xs text-blue-600">
                                      <span className="font-medium">FTA Benefit:</span> {duty.currency || "USD"} {duty.ftaBenefit.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                  )}
                                  {duty.additionalDuties && (
                                    <div className="text-xs text-orange-600">
                                      <span className="font-medium">Additional Duties:</span> {duty.additionalDuties}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {duty.calculationBreakdown && (
                                <div className="text-gray-600 mt-2 pt-2 border-t border-gray-200 text-xs italic">
                                  {duty.calculationBreakdown}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : allProducts.some((p: any) => p.htsCode) ? (
                        // Show message if products have HTS codes but no calculations yet
                        <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs text-yellow-800">
                            <Info className="h-3 w-3 inline mr-1" />
                            {mounted && loadingDutyCalculations 
                              ? "Calculating duty amounts..." 
                              : "Products with HTS codes found, but duty calculations are not yet available. Calculations are performed when incoterms don't include duties/taxes."}
                          </p>
                          <div className="mt-2 space-y-1">
                            {allProducts
                              .filter((p: any) => p.htsCode)
                              .map((product: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-600">
                                  <span className="font-mono">{product.htsCode}</span>
                                  {product.description && (
                                    <span className="ml-2">- {product.description}</span>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : null}
                      
                      {/* Show incoterm information */}
                      {doc.extractedData.shipmentInfo?.incotermDetails && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Incoterm:</span> {doc.extractedData.shipmentInfo.incoterm} ({doc.extractedData.shipmentInfo.incotermDetails.name})
                            {doc.extractedData.shipmentInfo.incotermDetails.includes_duties_taxes ? (
                              <span className="text-green-600 ml-2">• Duties included in incoterm</span>
                            ) : (
                              <span className="text-red-600 ml-2">• Buyer responsible for duties</span>
                            )}
                          </p>
                        </div>
                      )}
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

          <div className="space-y-6">
            {/* Orders Sub-Navigation */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
              {(["overview", "shipments", "compliance", "analytics", "accounting"] as const).map((tab) => (
              <button
                  key={tab}
                  onClick={() => setOrdersSubTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                    ordersSubTab === tab
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
              ))}
            </div>

              {/* Overview Tab */}
            {ordersSubTab === "overview" && (
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
                  {ordersSubTab === "shipments" && (
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
                  {ordersSubTab === "compliance" && (
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
                  {ordersSubTab === "analytics" && (
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

                  {/* Accounting Tab (Sub) */}
                  {ordersSubTab === "accounting" && (
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
        </Card>
          </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="p-6 space-y-6 w-full min-w-0 max-w-full">
              {/* Header with Create Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage your orders and assigned documents</p>
                </div>
                <Button
                  onClick={() => setCreateOrderDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Create New Order
                </Button>
              </div>

              {/* Orders List */}
              {loadingOrders ? (
                <Card className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        </Card>
              ) : orders.length === 0 ? (
                <Card className="p-6">
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-4">Create your first order and assign document data to it.</p>
                    <Button
                      onClick={() => setCreateOrderDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                    >
                      Create Order
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6 w-full">
                  {/* Open Orders Section */}
                  {orders.filter(order => isOrderOpen(order)).length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Open Orders</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          {orders.filter(order => isOrderOpen(order)).length}
                        </span>
                      </div>
                      {orders.filter(order => isOrderOpen(order)).map((order) => {
                    const isExpanded = expandedOrderId === order.id
                    const parsedJson = order.parsed_json
                    const documentType = parsedJson?.documentType || "commercial_invoice"
                    const extractedData = parsedJson?.extractedData || parsedJson || {}
                    const allProducts = extractedData.products || []
                    
                    return (
                      <Card key={order.id} className={`hover:shadow-lg transition-all w-full max-w-full min-w-0 overflow-hidden ${isExpanded ? 'shadow-xl' : ''}`}>
                        <div className="p-6 w-full min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {order.order_name || order.order_number}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  order.status === "draft" ? "bg-gray-100 text-gray-700" :
                                  order.status === "active" ? "bg-blue-100 text-blue-700" :
                                  order.status === "completed" ? "bg-green-100 text-green-700" :
                                  "bg-yellow-100 text-yellow-700"
                                }`}>
                                  {order.status}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                                  isOrderOpen(order) 
                                    ? "bg-green-50 text-green-700 border border-green-200" 
                                    : "bg-gray-50 text-gray-600 border border-gray-200"
                                }`}>
                                  {isOrderOpen(order) ? (
                                    <>
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      Open
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                      Closed
                                    </>
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">Order #: {order.order_number}</p>
                              {extractedData.shipmentInfo && (extractedData.shipmentInfo.originCountry || extractedData.shipmentInfo.destinationCountry) && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">
                                    {extractedData.shipmentInfo.originCountry || ""}
                                    {extractedData.shipmentInfo.originCity ? `, ${extractedData.shipmentInfo.originCity}` : ""}
                                  </span>
                                  <ArrowRight className="h-3 w-3 text-gray-400" />
                                  <span className="font-medium">
                                    {extractedData.shipmentInfo.destinationCountry || ""}
                                    {extractedData.shipmentInfo.destinationCity ? `, ${extractedData.shipmentInfo.destinationCity}` : ""}
                                  </span>
                                </div>
                              )}
                              {order.documents && order.documents.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <FileText className="h-4 w-4" />
                                  <span>{order.documents[0].file_name}</span>
                                </div>
                              )}
                              {(() => {
                                // Normalize hts_codes to array
                                const htsCodesArray = Array.isArray(order.hts_codes) 
                                  ? order.hts_codes 
                                  : (typeof order.hts_codes === 'string' 
                                      ? order.hts_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
                                      : [])
                                
                                return htsCodesArray.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {htsCodesArray.slice(0, 5).map((hts: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-mono rounded"
                                      >
                                        {hts}
                                      </span>
                                    ))}
                                    {htsCodesArray.length > 5 && (
                                      <span className="px-2 py-1 text-xs text-gray-500">
                                        +{htsCodesArray.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                )
                              })()}
                              {order.order_date && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Created: {mounted ? new Date(order.order_date).toLocaleDateString() : new Date(order.order_date).toISOString().split('T')[0]}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setExpandedOrderId(isExpanded ? null : order.id)
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                {isExpanded ? "Hide Details" : "View Details"}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Details Section */}
                        {isExpanded && order.parsed_json && (() => {
                          const isEditing = editingOrderId === order.id
                          const orderId = order.id
                          const parsedJson = order.parsed_json || {}
                          const currentEditedData = editedOrderData[orderId] || parsedJson
                          const currentExtractedData = currentEditedData?.extractedData || currentEditedData || {}
                          const documentType = parsedJson.documentType || currentExtractedData.documentType || "commercial_invoice"
                          const allProducts = currentExtractedData?.products || []
                          
                          return (
                            <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4 w-full min-w-0">
                              {/* Document Header Info - Same format as Document Processing */}
                              {documentType === "commercial_invoice" && (currentExtractedData.invoiceNumber || currentExtractedData.invoiceDate || currentExtractedData.seller || currentExtractedData.buyer) && (
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 w-full min-w-0">
                                  {/* Edit/Save/Cancel Buttons */}
                                  <div className="flex justify-end mb-4 gap-2">
                                    {!isEditing ? (
                                      <>
                                        {isOrderOpen(order) && (
                                          <Button
                                            onClick={() => handleCloseOrder(order)}
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <XCircle className="h-4 w-4" />
                                            Close Order
                                          </Button>
                                        )}
                                        <Button
                                          onClick={() => openOrderPdfTemplateSelector(order)}
                                          variant="outline"
                                          size="sm"
                                          className="gap-2"
                                          disabled={generatingPdf}
                                        >
                                          <FileDown className="h-4 w-4" />
                                          {generatingPdf ? "Generating..." : "Generate PDF"}
                                        </Button>
                                        <Button
                                          onClick={() => handleStartEditOrder(order)}
                                          variant="outline"
                                          size="sm"
                                          className="gap-2"
                                        >
                                          <Edit className="h-4 w-4" />
                                          Edit
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          onClick={() => handleCancelEditOrder()}
                                          variant="outline"
                                          size="sm"
                                          className="gap-2"
                                          disabled={isSavingOrder}
                                        >
                                          <X className="h-4 w-4" />
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() => handleSaveEditOrder(order)}
                                          size="sm"
                                          className="gap-2"
                                          disabled={isSavingOrder}
                                        >
                                          <Save className="h-4 w-4" />
                                          {isSavingOrder ? "Saving..." : "Save"}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 w-full">
                                    {documentType === "commercial_invoice" && (currentExtractedData.invoiceNumber || isEditing) && (
                                      <div>
                                        <span className="text-gray-500">Invoice #:</span>
                                        {isEditing ? (
                                          <Input
                                            value={currentExtractedData.invoiceNumber || ""}
                                            onChange={(e) => {
                                              setEditedOrderData({
                                                ...editedOrderData,
                                                [orderId]: { ...currentEditedData, invoiceNumber: e.target.value },
                                              })
                                            }}
                                            className="mt-1"
                                            placeholder="Invoice number"
                                          />
                                        ) : (
                                          <span className="ml-2 font-medium text-gray-900">{currentExtractedData.invoiceNumber}</span>
                                        )}
                                      </div>
                                    )}
                                    {(currentExtractedData.invoiceDate || isEditing) && (
                                      <div>
                                        <span className="text-gray-500">Date:</span>
                                        {isEditing ? (
                                          <Input
                                            value={currentExtractedData.invoiceDate || ""}
                                            onChange={(e) => {
                                              setEditedOrderData({
                                                ...editedOrderData,
                                                [orderId]: { ...currentEditedData, invoiceDate: e.target.value },
                                              })
                                            }}
                                            className="mt-1"
                                            placeholder="Invoice date"
                                          />
                                        ) : (
                                          <span className="ml-2 font-medium text-gray-900">{currentExtractedData.invoiceDate}</span>
                                        )}
                                      </div>
                                    )}
                                    {(currentExtractedData.totals?.totalValue || isEditing) && (
                                      <div>
                                        <span className="text-gray-500">Total Value:</span>
                                        {isEditing ? (
                                          <div className="flex gap-2 mt-1">
                                            <Input
                                              value={currentExtractedData.totals?.currency || "USD"}
                                              onChange={(e) => {
                                                setEditedOrderData({
                                                  ...editedOrderData,
                                                  [orderId]: {
                                                    ...currentEditedData,
                                                    totals: { ...currentExtractedData.totals, currency: e.target.value },
                                                  },
                                                })
                                              }}
                                              className="w-20"
                                              placeholder="USD"
                                            />
                                            <Input
                                              type="number"
                                              value={currentExtractedData.totals?.totalValue || ""}
                                              onChange={(e) => {
                                                setEditedOrderData({
                                                  ...editedOrderData,
                                                  [orderId]: {
                                                    ...currentEditedData,
                                                    totals: { ...currentExtractedData.totals, totalValue: parseFloat(e.target.value) || 0 },
                                                  },
                                                })
                                              }}
                                              className="flex-1"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        ) : (
                                          <span className="ml-2 font-medium text-gray-900">
                                            {currentExtractedData.totals?.currency || "USD"} {currentExtractedData.totals?.totalValue?.toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Shipper/Exporter Information */}
                              {(currentExtractedData.seller || isEditing) && (
                                <div className="mb-4 p-3 bg-white rounded border border-gray-200 w-full min-w-0">
                                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Shipper/Exporter</h4>
                                  <div className="text-sm space-y-2">
                                    <div>
                                      <span className="text-gray-500">Name: </span>
                                      {isEditing ? (
                                        <Input
                                          value={currentExtractedData.seller?.name || ""}
                                          onChange={(e) => {
                                            setEditedOrderData({
                                              ...editedOrderData,
                                              [orderId]: {
                                                ...currentEditedData,
                                                extractedData: {
                                                  ...currentExtractedData,
                                                  seller: { ...currentExtractedData.seller, name: e.target.value },
                                                },
                                              },
                                            })
                                          }}
                                          className="mt-1"
                                          placeholder="Company name"
                                        />
                                      ) : (
                                        <span className="font-medium text-gray-900">{currentExtractedData.seller?.name}</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Address: </span>
                                      {isEditing ? (
                                        <Input
                                          value={currentExtractedData.seller?.address || ""}
                                          onChange={(e) => {
                                            setEditedOrderData({
                                              ...editedOrderData,
                                              [orderId]: {
                                                ...currentEditedData,
                                                extractedData: {
                                                  ...currentExtractedData,
                                                  seller: { ...currentExtractedData.seller, address: e.target.value },
                                                },
                                              },
                                            })
                                          }}
                                          className="mt-1"
                                          placeholder="Complete address"
                                        />
                                      ) : (
                                        <span className="text-gray-900">{currentExtractedData.seller?.address}</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Tax ID: </span>
                                      {isEditing ? (
                                        <Input
                                          value={currentExtractedData.seller?.taxId || ""}
                                          onChange={(e) => {
                                            setEditedOrderData({
                                              ...editedOrderData,
                                              [orderId]: {
                                                ...currentEditedData,
                                                extractedData: {
                                                  ...currentExtractedData,
                                                  seller: { ...currentExtractedData.seller, taxId: e.target.value },
                                                },
                                              },
                                            })
                                          }}
                                          className="mt-1"
                                          placeholder="Tax ID"
                                        />
                                      ) : (
                                        <span className="text-gray-900">{currentExtractedData.seller?.taxId}</span>
                                      )}
                                    </div>
                                    {(currentExtractedData.seller?.contact || isEditing) && (
                                      <div className="mt-2 space-y-2">
                                        <div>
                                          <span className="text-gray-500">Phone: </span>
                                          {isEditing ? (
                                            <Input
                                              value={currentExtractedData.seller?.contact?.phone || ""}
                                              onChange={(e) => {
                                                setEditedOrderData({
                                                  ...editedOrderData,
                                                  [orderId]: {
                                                    ...currentEditedData,
                                                    extractedData: {
                                                      ...currentExtractedData,
                                                      seller: {
                                                        ...currentExtractedData.seller,
                                                        contact: { ...currentExtractedData.seller?.contact, phone: e.target.value },
                                                      },
                                                    },
                                                  },
                                                })
                                              }}
                                              className="mt-1"
                                              placeholder="Phone number"
                                            />
                                          ) : (
                                            <span className="text-gray-900">{currentExtractedData.seller?.contact?.phone}</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Email: </span>
                                          {isEditing ? (
                                            <Input
                                              type="email"
                                              value={currentExtractedData.seller?.contact?.email || ""}
                                              onChange={(e) => {
                                                setEditedOrderData({
                                                  ...editedOrderData,
                                                  [orderId]: {
                                                    ...currentEditedData,
                                                    extractedData: {
                                                      ...currentExtractedData,
                                                      seller: {
                                                        ...currentExtractedData.seller,
                                                        contact: { ...currentExtractedData.seller?.contact, email: e.target.value },
                                                      },
                                                    },
                                                  },
                                                })
                                              }}
                                              className="mt-1"
                                              placeholder="Email address"
                                            />
                                          ) : (
                                            <span className="text-gray-900">{currentExtractedData.seller?.contact?.email}</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Fax: </span>
                                          {isEditing ? (
                                            <Input
                                              value={currentExtractedData.seller?.contact?.fax || ""}
                                              onChange={(e) => {
                                                setEditedOrderData({
                                                  ...editedOrderData,
                                                  [orderId]: {
                                                    ...currentEditedData,
                                                    extractedData: {
                                                      ...currentExtractedData,
                                                      seller: {
                                                        ...currentExtractedData.seller,
                                                        contact: { ...currentExtractedData.seller?.contact, fax: e.target.value },
                                                      },
                                                    },
                                                  },
                                                })
                                              }}
                                              className="mt-1"
                                              placeholder="Fax number"
                                            />
                                          ) : (
                                            <span className="text-gray-900">{currentExtractedData.seller?.contact?.fax}</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Contact Person: </span>
                                          {isEditing ? (
                                            <Input
                                              value={currentExtractedData.seller?.contact?.contactPerson || ""}
                                              onChange={(e) => {
                                                setEditedOrderData({
                                                  ...editedOrderData,
                                                  [orderId]: {
                                                    ...currentEditedData,
                                                    extractedData: {
                                                      ...currentExtractedData,
                                                      seller: {
                                                        ...currentExtractedData.seller,
                                                        contact: { ...currentExtractedData.seller?.contact, contactPerson: e.target.value },
                                                      },
                                                    },
                                                  },
                                                })
                                              }}
                                              className="mt-1"
                                              placeholder="Contact person name"
                                            />
                                          ) : (
                                            <span className="text-gray-900">{currentExtractedData.seller?.contact?.contactPerson}</span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Consignee Information */}
                              {(currentExtractedData.buyer || isEditing) && (
                                <div className="mb-4 p-3 bg-white rounded border border-gray-200 w-full min-w-0">
                                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Consignee</h4>
                                  <div className="text-sm space-y-2">
                                    <div>
                                      <span className="text-gray-500">Name: </span>
                                      {isEditing ? (
                                        <Input
                                          value={currentExtractedData.buyer?.name || ""}
                                          onChange={(e) => {
                                            setEditedOrderData({
                                              ...editedOrderData,
                                              [orderId]: {
                                                ...currentEditedData,
                                                extractedData: {
                                                  ...currentExtractedData,
                                                  buyer: { ...currentExtractedData.buyer, name: e.target.value },
                                                },
                                              },
                                            })
                                          }}
                                          className="mt-1"
                                          placeholder="Company name"
                                        />
                                      ) : (
                                        <span className="font-medium text-gray-900">{currentExtractedData.buyer?.name}</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Address: </span>
                                      {isEditing ? (
                                        <Input
                                          value={currentExtractedData.buyer?.address || ""}
                                          onChange={(e) => {
                                            setEditedOrderData({
                                              ...editedOrderData,
                                              [orderId]: {
                                                ...currentEditedData,
                                                extractedData: {
                                                  ...currentExtractedData,
                                                  buyer: { ...currentExtractedData.buyer, address: e.target.value },
                                                },
                                              },
                                            })
                                          }}
                                          className="mt-1"
                                          placeholder="Complete address"
                                        />
                                      ) : (
                                        <span className="text-gray-900">{currentExtractedData.buyer?.address}</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Tax ID: </span>
                                      {isEditing ? (
                                        <Input
                                          value={currentExtractedData.buyer?.taxId || ""}
                                          onChange={(e) => {
                                            setEditedOrderData({
                                              ...editedOrderData,
                                              [orderId]: {
                                                ...currentEditedData,
                                                extractedData: {
                                                  ...currentExtractedData,
                                                  buyer: { ...currentExtractedData.buyer, taxId: e.target.value },
                                                },
                                              },
                                            })
                                          }}
                                          className="mt-1"
                                          placeholder="Tax ID"
                                        />
                                      ) : (
                                        <span className="text-gray-900">{currentExtractedData.buyer?.taxId}</span>
                                      )}
                                    </div>
                                    {(currentExtractedData.buyer?.contact || isEditing) && (
                                      <div className="mt-2 space-y-2">
                                        <div>
                                          <span className="text-gray-500">Phone: </span>
                                          {isEditing ? (
                                            <Input
                                              value={currentExtractedData.buyer?.contact?.phone || ""}
                                              onChange={(e) => {
                                                setEditedOrderData({
                                                  ...editedOrderData,
                                                  [orderId]: {
                                                    ...currentEditedData,
                                                    extractedData: {
                                                      ...currentExtractedData,
                                                      buyer: {
                                                        ...currentExtractedData.buyer,
                                                        contact: { ...currentExtractedData.buyer?.contact, phone: e.target.value },
                                                      },
                                                    },
                                                  },
                                                })
                                              }}
                                              className="mt-1"
                                              placeholder="Phone number"
                                            />
                                          ) : (
                                            <span className="text-gray-900">{currentExtractedData.buyer?.contact?.phone}</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Email: </span>
                                          {isEditing ? (
                                            <Input
                                              type="email"
                                              value={currentExtractedData.buyer?.contact?.email || ""}
                                              onChange={(e) => {
                                                setEditedOrderData({
                                                  ...editedOrderData,
                                                  [orderId]: {
                                                    ...currentEditedData,
                                                    extractedData: {
                                                      ...currentExtractedData,
                                                      buyer: {
                                                        ...currentExtractedData.buyer,
                                                        contact: { ...currentExtractedData.buyer?.contact, email: e.target.value },
                                                      },
                                                    },
                                                  },
                                                })
                                              }}
                                              className="mt-1"
                                              placeholder="Email address"
                                            />
                                          ) : (
                                            <span className="text-gray-900">{currentExtractedData.buyer?.contact?.email}</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Fax: </span>
                                          {isEditing ? (
                                            <Input
                                              value={currentExtractedData.buyer?.contact?.fax || ""}
                                              onChange={(e) => {
                                                setEditedOrderData({
                                                  ...editedOrderData,
                                                  [orderId]: {
                                                    ...currentEditedData,
                                                    extractedData: {
                                                      ...currentExtractedData,
                                                      buyer: {
                                                        ...currentExtractedData.buyer,
                                                        contact: { ...currentExtractedData.buyer?.contact, fax: e.target.value },
                                                      },
                                                    },
                                                  },
                                                })
                                              }}
                                              className="mt-1"
                                              placeholder="Fax number"
                                            />
                                          ) : (
                                            <span className="text-gray-900">{currentExtractedData.buyer?.contact?.fax}</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Contact Person: </span>
                                          {isEditing ? (
                                            <Input
                                              value={currentExtractedData.buyer?.contact?.contactPerson || ""}
                                              onChange={(e) => {
                                                setEditedOrderData({
                                                  ...editedOrderData,
                                                  [orderId]: {
                                                    ...currentEditedData,
                                                    extractedData: {
                                                      ...currentExtractedData,
                                                      buyer: {
                                                        ...currentExtractedData.buyer,
                                                        contact: { ...currentExtractedData.buyer?.contact, contactPerson: e.target.value },
                                                      },
                                                    },
                                                  },
                                                })
                                              }}
                                              className="mt-1"
                                              placeholder="Contact person name"
                                            />
                                          ) : (
                                            <span className="text-gray-900">{currentExtractedData.buyer?.contact?.contactPerson}</span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Signer Information */}
                              {(currentExtractedData.signer || isEditing) && (
                                <div className="mb-4 p-3 bg-white rounded border border-gray-200 w-full min-w-0">
                                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Document Signer</h4>
                                  <div className="text-sm space-y-2">
                                    <div>
                                      <span className="text-gray-500">Name: </span>
                                      {isEditing ? (
                                        <Input
                                          value={currentExtractedData.signer?.name || ""}
                                          onChange={(e) => {
                                            setEditedOrderData({
                                              ...editedOrderData,
                                              [orderId]: {
                                                ...currentEditedData,
                                                extractedData: {
                                                  ...currentExtractedData,
                                                  signer: { ...currentExtractedData.signer, name: e.target.value },
                                                },
                                              },
                                            })
                                          }}
                                          className="mt-1"
                                          placeholder="Signer name"
                                        />
                                      ) : (
                                        <span className="font-medium text-gray-900">{currentExtractedData.signer?.name}</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Company: </span>
                                      {isEditing ? (
                                        <Input
                                          value={currentExtractedData.signer?.company || ""}
                                          onChange={(e) => {
                                            setEditedOrderData({
                                              ...editedOrderData,
                                              [orderId]: {
                                                ...currentEditedData,
                                                extractedData: {
                                                  ...currentExtractedData,
                                                  signer: { ...currentExtractedData.signer, company: e.target.value },
                                                },
                                              },
                                            })
                                          }}
                                          className="mt-1"
                                          placeholder="Company name"
                                        />
                                      ) : (
                                        <span className="text-gray-900">{currentExtractedData.signer?.company}</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Title: </span>
                                      {isEditing ? (
                                        <Input
                                          value={currentExtractedData.signer?.title || ""}
                                          onChange={(e) => {
                                            setEditedOrderData({
                                              ...editedOrderData,
                                              [orderId]: {
                                                ...currentEditedData,
                                                extractedData: {
                                                  ...currentExtractedData,
                                                  signer: { ...currentExtractedData.signer, title: e.target.value },
                                                },
                                              },
                                            })
                                          }}
                                          className="mt-1"
                                          placeholder="Job title"
                                        />
                                      ) : (
                                        <span className="text-gray-900">{currentExtractedData.signer?.title}</span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Signature Date: </span>
                                      {isEditing ? (
                                        <Input
                                          value={currentExtractedData.signer?.signatureDate || ""}
                                          onChange={(e) => {
                                            setEditedOrderData({
                                              ...editedOrderData,
                                              [orderId]: {
                                                ...currentEditedData,
                                                extractedData: {
                                                  ...currentExtractedData,
                                                  signer: { ...currentExtractedData.signer, signatureDate: e.target.value },
                                                },
                                              },
                                            })
                                          }}
                                          className="mt-1"
                                          placeholder="Signature date"
                                        />
                                      ) : (
                                        <span className="text-gray-900">{currentExtractedData.signer?.signatureDate}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* Products Table - Same format as Document Processing */}
                            {allProducts.length > 0 ? (
                              <div className="border rounded-lg bg-white w-full min-w-0 overflow-hidden">
                                <div className="mb-2 p-3 border-b">
                                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    Products/Items
                                  </h3>
                                </div>
                                <div className="w-full min-w-0">
                                  <Table className="w-full min-w-0">
                                  <TableHeader>
                                    <TableRow className="bg-gray-50">
                                      <TableHead className="font-semibold">Description</TableHead>
                                      <TableHead className="font-semibold">Quantity</TableHead>
                                      <TableHead className="font-semibold">Unit</TableHead>
                                      {allProducts.some((p: any) => p.unitPrice) && (
                                        <TableHead className="font-semibold">Unit Price</TableHead>
                                      )}
                                      {allProducts.some((p: any) => p.totalPrice) && (
                                        <TableHead className="font-semibold">Total Price</TableHead>
                                      )}
                                      {allProducts.some((p: any) => p.weight) && (
                                        <TableHead className="font-semibold">Weight</TableHead>
                                      )}
                                      {allProducts.some((p: any) => p.countryOfOrigin) && (
                                        <TableHead className="font-semibold">Origin</TableHead>
                                      )}
                                      {allProducts.some((p: any) => p.htsCode) && (
                                        <TableHead className="font-semibold">HTS Code</TableHead>
                                      )}
                                      {allProducts.some((p: any) => (p as any).dutyCalculation || p.htsCode) && (
                                        <TableHead className="font-semibold">Duty Calculation</TableHead>
                                      )}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {allProducts.map((product: any, productIndex: number) => (
                                      <TableRow key={productIndex} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                          {product.description || "N/A"}
                                        </TableCell>
                                        <TableCell>
                                          {product.quantity || "-"}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                          {product.unitOfMeasure || "-"}
                                        </TableCell>
                                        {allProducts.some((p: any) => p.unitPrice) && (
                                          <TableCell>
                                            {product.unitPrice
                                              ? `${product.currency || "USD"} ${product.unitPrice.toLocaleString(undefined, {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })}`
                                              : "-"}
                                          </TableCell>
                                        )}
                                        {allProducts.some((p: any) => p.totalPrice) && (
                                          <TableCell>
                                            {product.totalPrice
                                              ? `${product.currency || "USD"} ${product.totalPrice.toLocaleString(undefined, {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })}`
                                              : "-"}
                                          </TableCell>
                                        )}
                                        {allProducts.some((p: any) => p.weight) && (
                                          <TableCell>
                                            {product.weight
                                              ? `${product.weight} ${product.weightUnit || "kg"}`
                                              : "-"}
                                          </TableCell>
                                        )}
                                        {allProducts.some((p: any) => p.countryOfOrigin) && (
                                          <TableCell>
                                            {product.countryOfOrigin || "-"}
                                          </TableCell>
                                        )}
                                        {allProducts.some((p: any) => p.htsCode) && (
                                          <TableCell className="font-mono text-sm">
                                            {product.htsCode || "-"}
                                          </TableCell>
                                        )}
                                        {allProducts.some((p: any) => (p as any).dutyCalculation || p.htsCode) && (
                                          <TableCell>
                                            {(product as any).dutyCalculation ? (
                                              <div className="space-y-1">
                                                {(product as any).dutyCalculation.isDutyFree ? (
                                                  <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <span className="font-semibold text-green-600">No Duty (Free)</span>
                                                  </div>
                                                ) : (
                                                  <>
                                                    <div className="font-semibold text-red-600">
                                                      {(() => {
                                                        const calculatedValue = (product as any).dutyCalculation.calculatedDuty
                                                        const currency = (product as any).dutyCalculation.currency || "USD"
                                                        const formatted = calculatedValue?.toLocaleString(undefined, {
                                                          minimumFractionDigits: 2,
                                                          maximumFractionDigits: 2,
                                                        }) || "0.00"
                                                        return `${currency} ${formatted}`
                                                      })()}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                      Rate: {(product as any).dutyCalculation.dutyRate || 'N/A'} ({(product as any).dutyCalculation.dutyRateType || 'general'})
                                                    </div>
                                                    {(product as any).dutyCalculation.freeTradeAgreement && (product as any).dutyCalculation.freeTradeAgreement !== 'None' && (
                                                      <div className="text-xs text-blue-600 flex items-center gap-1">
                                                        <Globe className="h-3 w-3" />
                                                        <span>FTA: {(product as any).dutyCalculation.freeTradeAgreement}</span>
                                                        {(product as any).dutyCalculation.ftaBenefit && (product as any).dutyCalculation.ftaBenefit > 0 && (
                                                          <span className="text-green-600">
                                                            (Savings: {(product as any).dutyCalculation.currency || "USD"} {(product as any).dutyCalculation.ftaBenefit.toLocaleString(undefined, {
                                                              minimumFractionDigits: 2,
                                                              maximumFractionDigits: 2,
                                                            })})
                                                          </span>
                                                        )}
                                                      </div>
                                                    )}
                                                    {(product as any).dutyCalculation.additionalDuties && (
                                                      <div className="text-xs text-orange-600">
                                                        + Additional: {(product as any).dutyCalculation.additionalDuties}
                                                      </div>
                                                    )}
                                                    {(product as any).dutyCalculation.calculationBreakdown && (
                                                      <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-50 rounded">
                                                        {(product as any).dutyCalculation.calculationBreakdown}
                                                      </div>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            ) : product.htsCode ? (
                                              <span className="text-gray-400 text-xs">No duty calculation available</span>
                                            ) : (
                                              "-"
                                            )}
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 text-center text-gray-500 border rounded-lg bg-white text-sm">
                                No products/items found in this order
                              </div>
                            )}

                            {/* Shipment Info */}
                            {extractedData.shipmentInfo && (
                              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 w-full min-w-0">
                                <h3 className="font-semibold text-gray-900 mb-2">Shipment Information</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm w-full">
                                  <div>
                                    <span className="text-gray-500">Origin Country:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                      {extractedData.shipmentInfo.originCountry}
                                      {extractedData.shipmentInfo.originCity && `, ${extractedData.shipmentInfo.originCity}`}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Destination:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                      {extractedData.shipmentInfo.destinationCountry}
                                      {extractedData.shipmentInfo.destinationCity &&
                                        `, ${extractedData.shipmentInfo.destinationCity}`}
                                    </span>
                                  </div>
                                  {extractedData.shipmentInfo.carrier && (
                                    <div>
                                      <span className="text-gray-500">Carrier:</span>
                                      <span className="ml-2 font-medium text-gray-900">{extractedData.shipmentInfo.carrier}</span>
                                    </div>
                                  )}
                                  {extractedData.shipmentInfo.containerNumber && (
                                    <div>
                                      <span className="text-gray-500">Container:</span>
                                      <span className="ml-2 font-medium text-gray-900">{extractedData.shipmentInfo.containerNumber}</span>
                                    </div>
                                  )}
                                  {extractedData.shipmentInfo.vesselName && (
                                    <div>
                                      <span className="text-gray-500">Vessel:</span>
                                      <span className="ml-2 font-medium text-gray-900">{extractedData.shipmentInfo.vesselName}</span>
                                    </div>
                                  )}
                                  {extractedData.shipmentInfo.estimatedArrivalDate && (
                                    <div>
                                      <span className="text-gray-500">ETA:</span>
                                      <span className="ml-2 font-medium text-gray-900">{extractedData.shipmentInfo.estimatedArrivalDate}</span>
                                    </div>
                                  )}
                                  {(extractedData.shipmentInfo.incoterm || extractedData.shipmentInfo.incoterms) && (
                                    <div>
                                      <span className="text-gray-500">Incoterms:</span>
                                      <span className="ml-2 font-medium text-gray-900">
                                        {extractedData.shipmentInfo.incoterm || extractedData.shipmentInfo.incoterms}
                                        {extractedData.shipmentInfo.incotermDetails && (
                                          <span className="text-gray-600 text-xs ml-1">
                                            ({extractedData.shipmentInfo.incotermDetails.name})
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Display detailed incoterm information if available */}
                                {extractedData.shipmentInfo.incotermDetails && (
                                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                    <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                                      <span>Incoterm Details: {extractedData.shipmentInfo.incotermDetails.name}</span>
                                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                                        {extractedData.shipmentInfo.incoterm}
                                      </span>
                                    </h4>
                                    {extractedData.shipmentInfo.incotermDetails.description_short && (
                                      <p className="text-sm text-gray-700 mb-3">
                                        {extractedData.shipmentInfo.incotermDetails.description_short}
                                      </p>
                                    )}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${extractedData.shipmentInfo.incotermDetails.includes_pre_carriage ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-gray-600">Pre-Carriage</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${extractedData.shipmentInfo.incotermDetails.includes_main_carriage ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-gray-600">Main Carriage</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${extractedData.shipmentInfo.incotermDetails.includes_insurance ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-gray-600">Insurance</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${extractedData.shipmentInfo.incotermDetails.includes_export_clearance ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-gray-600">Export Clearance</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${extractedData.shipmentInfo.incotermDetails.includes_import_clearance ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-gray-600">Import Clearance</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${extractedData.shipmentInfo.incotermDetails.includes_duties_taxes ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-gray-600">Duties & Taxes</span>
                                      </div>
                                      {extractedData.shipmentInfo.incotermDetails.transport_mode && (
                                        <div>
                                          <span className="text-gray-500">Transport Mode:</span>
                                          <span className="ml-2 font-medium text-gray-900 capitalize">
                                            {extractedData.shipmentInfo.incotermDetails.transport_mode}
                                          </span>
                                        </div>
                                      )}
                                      {extractedData.shipmentInfo.incotermDetails.valuation_basis && (
                                        <div>
                                          <span className="text-gray-500">Valuation Basis:</span>
                                          <span className="ml-2 font-medium text-gray-900">
                                            {extractedData.shipmentInfo.incotermDetails.valuation_basis}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {extractedData.shipmentInfo.incotermDetails.risk_transfer_point && (
                                      <div className="mt-3 pt-3 border-t border-green-200">
                                        <span className="text-gray-500 text-sm">Risk Transfer Point: </span>
                                        <span className="text-gray-900 text-sm font-medium">
                                          {extractedData.shipmentInfo.incotermDetails.risk_transfer_point}
                                        </span>
                                      </div>
                                    )}
                                    {extractedData.shipmentInfo.incotermDetails.notes && (
                                      <div className="mt-2 pt-2 border-t border-green-200">
                                        <span className="text-gray-500 text-sm">Notes: </span>
                                        <span className="text-gray-700 text-sm">
                                          {extractedData.shipmentInfo.incotermDetails.notes}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Totals */}
                            {extractedData.totals && (
                              <div className="p-3 bg-green-50 rounded-lg border border-green-200 w-full min-w-0">
                                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Totals</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm w-full">
                                  {extractedData.totals.totalValue !== undefined && (
                                    <div>
                                      <span className="text-gray-500">Total Value:</span>
                                      <span className="ml-2 font-medium text-gray-900">
                                        {extractedData.totals.currency || "USD"} {extractedData.totals.totalValue.toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  {extractedData.totals.totalWeight !== undefined && (
                                    <div>
                                      <span className="text-gray-500">Total Weight:</span>
                                      <span className="ml-2 font-medium text-gray-900">
                                        {extractedData.totals.totalWeight} kg
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Duty Calculations Summary - Always displayed after Shipment Information */}
                            {/* Show this section if there are products with HTS codes or if duty calculations exist */}
                            {(allProducts.some((p: any) => p.htsCode) || (extractedData as any).totalDuties || ((extractedData as any).dutyCalculations && Array.isArray((extractedData as any).dutyCalculations) && (extractedData as any).dutyCalculations.length > 0)) && (
                              <div className="mt-4 p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200 shadow-sm w-full min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                                  <Calculator className="h-4 w-4 text-red-600" />
                                  <span>Duty Calculations (Incoterms 2020 Compliant)</span>
                                </h4>
                                
                                {/* Show total duties if available */}
                                {(extractedData as any).totalDuties && (extractedData as any).totalDuties.amount > 0 ? (
                                  <>
                                    <div className="text-2xl font-bold text-red-600 mb-2">
                                      {(extractedData as any).totalDuties.currency || "USD"} {(extractedData as any).totalDuties.amount?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }) || "0.00"}
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3">Total duties calculated from HTS codes table</p>
                                  </>
                                ) : (extractedData as any).totalDuties && (extractedData as any).totalDuties.amount === 0 ? (
                                  <div className="text-lg font-semibold text-green-600 mb-2 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    <span>No Duties Apply</span>
                                  </div>
                                ) : null}
                                
                                {/* Show duty calculations breakdown if available */}
                                {(extractedData as any).dutyCalculations && Array.isArray((extractedData as any).dutyCalculations) && (extractedData as any).dutyCalculations.length > 0 ? (
                                  <div className="mt-3 space-y-2">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Breakdown by HTS Code:</p>
                                    {(extractedData as any).dutyCalculations.map((duty: any, idx: number) => (
                                      <div 
                                        key={idx} 
                                        className={`text-xs bg-white p-3 rounded border ${
                                          duty.isDutyFree 
                                            ? 'border-green-200 bg-green-50' 
                                            : 'border-red-100'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-gray-700 font-semibold">{duty.htsCode || duty.htsNumber}</span>
                                            {duty.freeTradeAgreement && duty.freeTradeAgreement !== 'None' && (
                                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                {duty.freeTradeAgreement}
                                              </span>
                                            )}
                                            {duty.isDutyFree && (
                                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                Free
                                              </span>
                                            )}
                                          </div>
                                          <span className={`font-semibold ${
                                            duty.isDutyFree ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            {duty.isDutyFree ? (
                                              <span className="flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                No Duty
                                              </span>
                                            ) : (
                                              `${duty.currency || "USD"} ${duty.calculatedDuty?.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              }) || "0.00"}`
                                            )}
                                          </span>
                                        </div>
                                        
                                        {!duty.isDutyFree && (
                                          <div className="text-gray-600 mt-1 space-y-0.5">
                                            <div className="text-xs">
                                              <span className="font-medium">Rate:</span> {duty.dutyRate || 'N/A'} ({duty.dutyRateType || 'general'})
                                            </div>
                                            {duty.freeTradeAgreement && duty.freeTradeAgreement !== 'None' && duty.ftaBenefit && duty.ftaBenefit > 0 && (
                                              <div className="text-xs text-blue-600">
                                                <span className="font-medium">FTA Benefit:</span> {duty.currency || "USD"} {duty.ftaBenefit.toLocaleString(undefined, {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })}
                                              </div>
                                            )}
                                            {duty.additionalDuties && (
                                              <div className="text-xs text-orange-600">
                                                <span className="font-medium">Additional Duties:</span> {duty.additionalDuties}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {duty.calculationBreakdown && (
                                          <div className="text-gray-600 mt-2 pt-2 border-t border-gray-200 text-xs italic">
                                            {duty.calculationBreakdown}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : allProducts.some((p: any) => p.htsCode) ? (
                                  // Show message if products have HTS codes but no calculations yet
                                  <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                                    <p className="text-xs text-yellow-800">
                                      Products have HTS codes but duty calculations are not yet available. Calculations will appear here once processed.
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            )}
                            </div>
                          )
                        })()}
                      </Card>
                    )
                  })}
                    </div>
                  )}

                  {/* Closed Orders Section */}
                  {orders.filter(order => !isOrderOpen(order)).length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Closed Orders</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {orders.filter(order => !isOrderOpen(order)).length}
                        </span>
                      </div>
                      {orders.filter(order => !isOrderOpen(order)).map((order) => {
                        const isExpanded = expandedOrderId === order.id
                        const parsedJson = order.parsed_json
                        const documentType = parsedJson?.documentType || "commercial_invoice"
                        const extractedData = parsedJson?.extractedData || parsedJson || {}
                        const allProducts = extractedData.products || []
                        
                        return (
                          <Card key={order.id} className={`hover:shadow-lg transition-all w-full max-w-full min-w-0 overflow-hidden ${isExpanded ? 'shadow-xl' : ''}`}>
                            <div className="p-6 w-full min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {order.order_name || order.order_number}
                                    </h3>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      order.status === "draft" ? "bg-gray-100 text-gray-700" :
                                      order.status === "active" ? "bg-blue-100 text-blue-700" :
                                      order.status === "completed" ? "bg-green-100 text-green-700" :
                                      "bg-yellow-100 text-yellow-700"
                                    }`}>
                                      {order.status}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                                      isOrderOpen(order) 
                                        ? "bg-green-50 text-green-700 border border-green-200" 
                                        : "bg-gray-50 text-gray-600 border border-gray-200"
                                    }`}>
                                      {isOrderOpen(order) ? (
                                        <>
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          Open
                                        </>
                                      ) : (
                                        <>
                                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                          Closed
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">Order #: {order.order_number}</p>
                                  {extractedData.shipmentInfo && (extractedData.shipmentInfo.originCountry || extractedData.shipmentInfo.destinationCountry) && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                      <MapPin className="h-4 w-4 text-gray-500" />
                                      <span className="font-medium">
                                        {extractedData.shipmentInfo.originCountry || ""}
                                        {extractedData.shipmentInfo.originCity ? `, ${extractedData.shipmentInfo.originCity}` : ""}
                                      </span>
                                      <ArrowRight className="h-3 w-3 text-gray-400" />
                                      <span className="font-medium">
                                        {extractedData.shipmentInfo.destinationCountry || ""}
                                        {extractedData.shipmentInfo.destinationCity ? `, ${extractedData.shipmentInfo.destinationCity}` : ""}
                                      </span>
                                    </div>
                                  )}
                                  {order.documents && order.documents.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <FileText className="h-4 w-4" />
                                      <span>{order.documents[0].file_name}</span>
                                    </div>
                                  )}
                                  {(() => {
                                    // Normalize hts_codes to array
                                    const htsCodesArray = Array.isArray(order.hts_codes) 
                                      ? order.hts_codes 
                                      : (typeof order.hts_codes === 'string' 
                                          ? order.hts_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
                                          : [])
                                    
                                    return htsCodesArray.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {htsCodesArray.slice(0, 5).map((hts: string, idx: number) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-mono rounded"
                                          >
                                            {hts}
                                          </span>
                                        ))}
                                        {htsCodesArray.length > 5 && (
                                          <span className="px-2 py-1 text-xs text-gray-500">
                                            +{htsCodesArray.length - 5} more
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })()}
                                  {order.order_date && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      Created: {mounted ? new Date(order.order_date).toLocaleDateString() : new Date(order.order_date).toISOString().split('T')[0]}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setExpandedOrderId(isExpanded ? null : order.id)
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    {isExpanded ? "Hide Details" : "View Details"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded Details Section - Same as open orders */}
                            {isExpanded && order.parsed_json && (() => {
                              const isEditing = editingOrderId === order.id
                              const orderId = order.id
                              const parsedJson = order.parsed_json || {}
                              const currentEditedData = editedOrderData[orderId] || parsedJson
                              const currentExtractedData = currentEditedData?.extractedData || currentEditedData || {}
                              const documentType = parsedJson.documentType || currentExtractedData.documentType || "commercial_invoice"
                              const allProducts = currentExtractedData?.products || []
                              
                              return (
                                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4 w-full min-w-0">
                                  {/* Document Header Info - Same format as Document Processing */}
                                  {documentType === "commercial_invoice" && (currentExtractedData.invoiceNumber || currentExtractedData.invoiceDate || currentExtractedData.seller || currentExtractedData.buyer) && (
                                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 w-full min-w-0">
                                      {/* Edit/Save/Cancel Buttons */}
                                      <div className="flex justify-end mb-4 gap-2">
                                        {!isEditing ? (
                                          <>
                                            {!isOrderOpen(order) && (
                                              <Button
                                                onClick={() => handleReopenOrder(order)}
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                              >
                                                <CheckCircle className="h-4 w-4" />
                                                Reopen Order
                                              </Button>
                                            )}
                                            <Button
                                              onClick={() => openOrderPdfTemplateSelector(order)}
                                              variant="outline"
                                              size="sm"
                                              className="gap-2"
                                              disabled={generatingPdf}
                                            >
                                              <FileDown className="h-4 w-4" />
                                              {generatingPdf ? "Generating..." : "Generate PDF"}
                                            </Button>
                                            <Button
                                              onClick={() => handleStartEditOrder(order)}
                                              variant="outline"
                                              size="sm"
                                              className="gap-2"
                                            >
                                              <Edit className="h-4 w-4" />
                                              Edit
                                            </Button>
                                          </>
                                        ) : (
                                          <>
                                            <Button
                                              onClick={() => handleCancelEditOrder()}
                                              variant="outline"
                                              size="sm"
                                              className="gap-2"
                                              disabled={isSavingOrder}
                                            >
                                              <X className="h-4 w-4" />
                                              Cancel
                                            </Button>
                                            <Button
                                              onClick={() => handleSaveEditOrder(order)}
                                              variant="default"
                                              size="sm"
                                              className="gap-2"
                                              disabled={isSavingOrder}
                                            >
                                              <Save className="h-4 w-4" />
                                              {isSavingOrder ? "Saving..." : "Save"}
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 w-full">
                                        {documentType === "commercial_invoice" && (currentExtractedData.invoiceNumber || isEditing) && (
                                          <div>
                                            <span className="text-gray-500">Invoice #:</span>
                                            {isEditing ? (
                                              <Input
                                                value={currentExtractedData.invoiceNumber || ""}
                                                onChange={(e) => {
                                                  setEditedOrderData({
                                                    ...editedOrderData,
                                                    [orderId]: { ...currentEditedData, extractedData: { ...currentExtractedData, invoiceNumber: e.target.value } },
                                                  })
                                                }}
                                                className="mt-1"
                                                placeholder="Invoice number"
                                              />
                                            ) : (
                                              <span className="ml-2 font-medium text-gray-900">{currentExtractedData.invoiceNumber}</span>
                                            )}
                                          </div>
                                        )}
                                        {(currentExtractedData.invoiceDate || isEditing) && (
                                          <div>
                                            <span className="text-gray-500">Date:</span>
                                            {isEditing ? (
                                              <Input
                                                value={currentExtractedData.invoiceDate || ""}
                                                onChange={(e) => {
                                                  setEditedOrderData({
                                                    ...editedOrderData,
                                                    [orderId]: { ...currentEditedData, extractedData: { ...currentExtractedData, invoiceDate: e.target.value } },
                                                  })
                                                }}
                                                className="mt-1"
                                                placeholder="Invoice date"
                                              />
                                            ) : (
                                              <span className="ml-2 font-medium text-gray-900">{currentExtractedData.invoiceDate}</span>
                                            )}
                                          </div>
                                        )}
                                        {(currentExtractedData.totals?.totalValue || isEditing) && (
                                          <div>
                                            <span className="text-gray-500">Total Value:</span>
                                            {isEditing ? (
                                              <div className="flex gap-2 mt-1">
                                                <Input
                                                  value={currentExtractedData.totals?.currency || "USD"}
                                                  onChange={(e) => {
                                                    setEditedOrderData({
                                                      ...editedOrderData,
                                                      [orderId]: {
                                                        ...currentEditedData,
                                                        extractedData: {
                                                          ...currentExtractedData,
                                                          totals: { ...currentExtractedData.totals, currency: e.target.value },
                                                        },
                                                      },
                                                    })
                                                  }}
                                                  className="w-20"
                                                  placeholder="USD"
                                                />
                                                <Input
                                                  type="number"
                                                  value={currentExtractedData.totals?.totalValue || ""}
                                                  onChange={(e) => {
                                                    setEditedOrderData({
                                                      ...editedOrderData,
                                                      [orderId]: {
                                                        ...currentEditedData,
                                                        extractedData: {
                                                          ...currentExtractedData,
                                                          totals: { ...currentExtractedData.totals, totalValue: parseFloat(e.target.value) || 0 },
                                                        },
                                                      },
                                                    })
                                                  }}
                                                  className="flex-1"
                                                  placeholder="0.00"
                                                />
                                              </div>
                                            ) : (
                                              <span className="ml-2 font-medium text-gray-900">
                                                {currentExtractedData.totals?.currency || "USD"} {currentExtractedData.totals?.totalValue?.toLocaleString()}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Create Order Dialog */}
              <Dialog open={createOrderDialogOpen} onOpenChange={setCreateOrderDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Order</DialogTitle>
                    <DialogDescription>
                      Create a new order and assign extracted document data to it.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={newOrderNumber}
                        onChange={(e) => setNewOrderNumber(e.target.value)}
                        placeholder="ORD-2024-001"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Name (Optional)
                      </label>
                      <Input
                        value={newOrderName}
                        onChange={(e) => setNewOrderName(e.target.value)}
                        placeholder="Customer Order Name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign Document <span className="text-red-500">*</span>
                      </label>
                      {loadingAvailableDocuments ? (
                        <div className="flex items-center justify-center py-4">
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                          <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
                        </div>
                      ) : availableDocuments.length === 0 ? (
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-600">
                            No processed documents available. Please process a document in the Document Processing tab first.
                          </p>
                        </div>
                      ) : (
                        <Select
                          value={selectedDocumentParsedDataId || ""}
                          onValueChange={(value) => {
                            setSelectedDocumentParsedDataId(value)
                            const doc = availableDocuments.find((d: any) => 
                              d.document_parsed_data && d.document_parsed_data[0]?.id === value
                            )
                            if (doc) {
                              setSelectedDocumentId(doc.id)
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a processed document" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDocuments.map((doc: any) => {
                              const parsedData = doc.document_parsed_data?.[0]
                              if (!parsedData) return null
                              // Normalize hts_codes to array
                              const htsCodesArray = Array.isArray(parsedData.hts_codes) 
                                ? parsedData.hts_codes 
                                : (typeof parsedData.hts_codes === 'string' 
                                    ? parsedData.hts_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
                                    : [])
                              
                              return (
                                <SelectItem key={parsedData.id} value={parsedData.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{doc.file_name}</span>
                                    {htsCodesArray.length > 0 && (
                                      <span className="text-xs text-gray-500">
                                        {htsCodesArray.length} HTS code(s)
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    {selectedDocumentParsedDataId && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2">Selected Document:</p>
                        {(() => {
                          const doc = availableDocuments.find((d: any) => 
                            d.document_parsed_data && d.document_parsed_data[0]?.id === selectedDocumentParsedDataId
                          )
                          const parsedData = doc?.document_parsed_data?.[0]
                          if (!parsedData) return null
                          
                          // Normalize hts_codes to array (PostgreSQL TEXT[] might be returned as string)
                          const htsCodesArray = Array.isArray(parsedData.hts_codes) 
                            ? parsedData.hts_codes 
                            : (typeof parsedData.hts_codes === 'string' 
                                ? parsedData.hts_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
                                : [])
                          
                          return (
                            <div className="space-y-2 text-sm">
                              <p className="text-blue-800"><strong>File:</strong> {doc?.file_name}</p>
                              {htsCodesArray.length > 0 && (
                                <div>
                                  <p className="text-blue-800 font-medium mb-1">HTS Codes:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {htsCodesArray.map((hts: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded"
                                      >
                                        {hts}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {parsedData.primary_hts_code && (
                                <p className="text-blue-800">
                                  <strong>Primary HTS:</strong> {parsedData.primary_hts_code}
                                </p>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreateOrderDialogOpen(false)
                        setNewOrderNumber("")
                        setNewOrderName("")
                        setSelectedDocumentParsedDataId(null)
                        setSelectedDocumentId(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateOrder}
                      disabled={creatingOrder || !newOrderNumber.trim() || !selectedDocumentParsedDataId}
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                    >
                      {creatingOrder ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Order"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            </div>
          )}

          {/* Accounting Tab */}
          {activeTab === "accounting" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Accounting</h2>
                <p className="text-sm text-gray-600">Financial overview and duty calculations</p>
              </div>

              {/* Total Duties Card */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    Total Duties Across All Orders
                  </h3>
                  {loadingOrders && (
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading orders...</span>
                  </div>
                ) : totalDuties ? (
                  <div className="space-y-4">
                    <div 
                      className="text-center p-6 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={handleOpenDutiesBreakdown}
                      title="Click to view breakdown by order"
                    >
                      <div className="text-4xl font-bold text-blue-600 mb-2 flex items-center justify-center gap-2">
                        {totalDuties.currency} {totalDuties.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        <Info className="h-5 w-5 text-blue-400" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Total duties calculated from {orders.length} order{orders.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-blue-500 mt-2">Click to view breakdown</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-white rounded border border-blue-100">
                        <div className="text-gray-500 mb-1">Total Orders</div>
                        <div className="text-xl font-semibold text-gray-900">{orders.length}</div>
                      </div>
                      <div className="p-3 bg-white rounded border border-blue-100">
                        <div className="text-gray-500 mb-1">Open Orders</div>
                        <div className="text-xl font-semibold text-green-600">
                          {orders.filter((o: any) => isOrderOpen(o)).length}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No orders found or no duty calculations available.</p>
                    {orders.length === 0 && (
                      <p className="text-sm mt-2">Create orders and assign documents to see duty totals.</p>
                    )}
                  </div>
                )}
              </Card>

              {/* Additional Accounting Cards Placeholder */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Additional Reports</h3>
                <p className="text-gray-600">More accounting features coming soon.</p>
              </Card>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === "clients" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Clients</h2>
                <p className="text-sm text-gray-600">View all clients and their associated orders</p>
              </div>

              {loadingOrders ? (
                <Card className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading clients...</span>
                  </div>
                </Card>
              ) : clients.length > 0 ? (
                <div className="space-y-4">
                  {clients.map((client, index) => (
                    <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="space-y-4">
                        {/* Client Header */}
                        <div className="border-b border-gray-200 pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {client.name}
                              </h3>
                              {client.address && (
                                <p className="text-sm text-gray-600 mb-1">{client.address}</p>
                              )}
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                {client.taxId && (
                                  <span><strong>Tax ID:</strong> {client.taxId}</span>
                                )}
                                {client.contact?.phone && (
                                  <span><strong>Phone:</strong> {client.contact.phone}</span>
                                )}
                                {client.contact?.email && (
                                  <span><strong>Email:</strong> {client.contact.email}</span>
                                )}
                                {client.contact?.contactPerson && (
                                  <span><strong>Contact:</strong> {client.contact.contactPerson}</span>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                {client.orders.length} order{client.orders.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Orders List */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Orders:</h4>
                          <div className="space-y-2">
                            {client.orders.map((order) => (
                              <div
                                key={order.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                      {order.orderName || order.orderNumber}
                                    </span>
                                    <span className="text-xs text-gray-500">#{order.orderNumber}</span>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                      order.status === "draft" ? "bg-gray-100 text-gray-700" :
                                      order.status === "active" ? "bg-blue-100 text-blue-700" :
                                      order.status === "completed" ? "bg-green-100 text-green-700" :
                                      "bg-yellow-100 text-yellow-700"
                                    }`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  {order.orderDate && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Created: {mounted ? new Date(order.orderDate).toLocaleDateString() : new Date(order.orderDate).toISOString().split('T')[0]}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActiveTab("orders")
                                    setExpandedOrderId(order.id)
                                  }}
                                  className="ml-4"
                                >
                                  View Order
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6">
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No clients found</p>
                    <p className="text-sm">Clients will appear here once orders are created with buyer/consignee information.</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Brokers Tab */}
          {activeTab === "brokers" && (
            <div className="p-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Brokers</h3>
                <p className="text-gray-600">Broker management coming soon.</p>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="p-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Settings</h3>
                <p className="text-gray-600">Settings page coming soon.</p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* PDF Template Selection Dialog */}
      <Dialog open={pdfTemplateOpen} onOpenChange={setPdfTemplateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select PDF Template</DialogTitle>
            <DialogDescription>
              Choose the format for your generated PDF document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedPdfTemplate === "commercial_invoice"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedPdfTemplate("commercial_invoice")}
            >
              <div className="font-semibold text-sm">Commercial Invoice / Packing List</div>
              <div className="text-xs text-gray-600 mt-1">Standard invoice format with detailed product table</div>
            </div>
            <div
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedPdfTemplate === "certificate_of_origin"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedPdfTemplate("certificate_of_origin")}
            >
              <div className="font-semibold text-sm">Certificate of Origin</div>
              <div className="text-xs text-gray-600 mt-1">Plain format focusing on origin information</div>
            </div>
            <div
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedPdfTemplate === "transport_docs"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedPdfTemplate("transport_docs")}
            >
              <div className="font-semibold text-sm">Transport Documents</div>
              <div className="text-xs text-gray-600 mt-1">Transportation and shipping information format</div>
            </div>
            <div
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedPdfTemplate === "customs_broker"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedPdfTemplate("customs_broker")}
            >
              <div className="font-semibold text-sm">Customs/Broker Data Sheet</div>
              <div className="text-xs text-gray-600 mt-1">Data-focused format for customs clearance</div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPdfTemplateOpen(false)
                setPendingDocForPdf(null)
                setPendingOrderForPdf(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingDocForPdf) {
                  generatePDF(pendingDocForPdf.doc, pendingDocForPdf.docIndex, selectedPdfTemplate)
                } else if (pendingOrderForPdf) {
                  generateOrderPDF(pendingOrderForPdf.order, selectedPdfTemplate)
                }
              }}
              disabled={(!pendingDocForPdf && !pendingOrderForPdf) || generatingPdf}
            >
              {generatingPdf ? "Generating..." : "Generate PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
            <DialogDescription>
              Preview your generated PDF document. Click download to save it to your device.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
            {pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading PDF preview...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPdfPreviewOpen(false)
                if (pdfPreviewUrl) {
                  URL.revokeObjectURL(pdfPreviewUrl)
                  setPdfPreviewUrl(null)
                }
              }}
            >
              Close
            </Button>
            <Button onClick={downloadPDF} className="gap-2">
              <FileDown className="h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duties Breakdown Dialog */}
      <Dialog open={dutiesBreakdownOpen} onOpenChange={setDutiesBreakdownOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Duties Breakdown by Order</DialogTitle>
            <DialogDescription>
              View individual duty amounts for each order
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {orderDutiesBreakdown.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 font-semibold text-sm">
                  <div>Order Number</div>
                  <div>Order Name</div>
                  <div className="text-right">Duty Amount</div>
                </div>
                {orderDutiesBreakdown.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{item.orderNumber}</div>
                    <div className="text-gray-600">{item.orderName || "-"}</div>
                    <div className="text-right font-semibold text-blue-600">
                      {item.currency} {item.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300 font-bold text-sm mt-4">
                  <div className="col-span-2">Total</div>
                  <div className="text-right text-blue-700">
                    {totalDuties?.currency || "USD"} {totalDuties?.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No duty calculations available for orders.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDutiesBreakdownOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

