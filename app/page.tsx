"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
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
  const [activeStep, setActiveStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const [animatedStats, setAnimatedStats] = useState({ speed: 0, cost: 0, accuracy: 0 })

  const [calculatorInputs, setCalculatorInputs] = useState({
    manualTime: 3,
    automatedTime: 1,
    laborCost: 35,
    shipmentsPerMonth: 40,
    errorReduction: 5,
    errorCost: 150,
  })

  const [displayedMonthlySavings, setDisplayedMonthlySavings] = useState(0)
  const [displayedAnnualSavings, setDisplayedAnnualSavings] = useState(0)

  // Calculate savings
  const timeSavings =
    (calculatorInputs.manualTime - calculatorInputs.automatedTime) *
    calculatorInputs.laborCost *
    calculatorInputs.shipmentsPerMonth
  const errorSavings =
    (calculatorInputs.errorReduction / 100) * calculatorInputs.errorCost * calculatorInputs.shipmentsPerMonth
  const monthlySavings = timeSavings + errorSavings
  const annualSavings = monthlySavings * 12

  // Count-up animation effect
  useEffect(() => {
    const duration = 1000
    const steps = 60
    const monthlyIncrement = monthlySavings / steps
    const annualIncrement = annualSavings / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      if (currentStep <= steps) {
        setDisplayedMonthlySavings(Math.floor(monthlyIncrement * currentStep))
        setDisplayedAnnualSavings(Math.floor(annualIncrement * currentStep))
      } else {
        setDisplayedMonthlySavings(Math.floor(monthlySavings))
        setDisplayedAnnualSavings(Math.floor(annualSavings))
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [monthlySavings, annualSavings])

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
    setStepProgress(0)
    const interval = setInterval(() => {
      setStepProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 50)
    return () => clearInterval(interval)
  }, [activeStep])

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

  const howItWorksSteps = [
    {
      number: 1,
      title: "Upload Your Product Info",
      description:
        "Simply upload your product details, invoices, or packing lists. Our AI-powered OCR extracts all relevant information automatically.",
      icon: Upload,
      color: "from-blue-500 to-blue-600",
      details: [
        "Drag & drop invoices or product catalogs",
        "AI extracts product descriptions, quantities, and values",
        "Supports PDF, Excel, CSV, and image formats",
        "Bulk upload for multiple products at once",
      ],
    },
    {
      number: 2,
      title: "AI Classifies & Calculates",
      description:
        "Our system automatically classifies your products using HTS codes and calculates accurate duty rates based on origin country and destination.",
      icon: Calculator,
      color: "from-teal-500 to-teal-600",
      details: [
        "Automatic HTS code classification with 98% accuracy",
        "Real-time duty rate calculations",
        "Country-specific tariff lookups",
        "Trade agreement optimization (USMCA, FTAs)",
      ],
    },
    {
      number: 3,
      title: "Generate Documents",
      description:
        "All required customs documentation is generated instantly, including commercial invoices, packing lists, and certificates of origin.",
      icon: FileText,
      color: "from-green-500 to-green-600",
      details: [
        "Commercial invoices with proper formatting",
        "Packing lists with HS codes",
        "Bills of lading and air waybills",
        "Certificates of origin (when applicable)",
      ],
    },
    {
      number: 4,
      title: "Review & Submit",
      description:
        "Review all documents and compliance checks in one dashboard. Submit directly to customs or download for your broker.",
      icon: CheckCircle,
      color: "from-purple-500 to-purple-600",
      details: [
        "Compliance verification before submission",
        "Real-time alerts for regulatory changes",
        "Direct integration with customs portals",
        "Audit trail for all submissions",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <Image
                src="/images/swiftdocks-logo.png"
                alt="SwiftDocks"
                width={320}
                height={92}
                className="h-24 w-auto"
              />
              <span className="text-3xl font-bold text-[#2C3E50] hidden sm:block">SwiftDocks</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-all hover:scale-105">
                Benefits
              </a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-all hover:scale-105">
                Features
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-all hover:scale-105">
                About
              </a>
              <Link href="/contact">
                <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 hover:scale-105 transition-all">
                  Join Beta
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4 animate-in fade-in slide-in-from-top-2">
              <a href="#benefits" className="block text-gray-600 hover:text-gray-900">
                Benefits
              </a>
              <a href="#features" className="block text-gray-600 hover:text-gray-900">
                Features
              </a>
              <a href="#about" className="block text-gray-600 hover:text-gray-900">
                About
              </a>
              <Link href="/contact">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-600">Join Beta</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 animate-gradient" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight text-balance hover:scale-105 transition-transform duration-300">
                Automating Global Trade for Small Businesses
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed text-pretty">
                Generate customs paperwork, calculate duties, and ensure compliance — all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg px-8 w-full sm:w-auto hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                  >
                    Request Early Access
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 border-2 hover:bg-gray-50 bg-transparent w-full hover:scale-105 transition-all"
                  >
                    See How It Works
                  </Button>
                </Link>
              </div>

              {/* Easily Integrated With Section */}
              <div className="pt-8">
                <p className="text-sm text-gray-500 mb-4">Easily integrated with:</p>
                <div className="flex flex-wrap gap-6 items-center">
                  {/* QuickBooks */}
                  <div className="flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer">
                    <div className="w-8 h-8 rounded bg-green-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">QB</span>
                    </div>
                    <span className="text-gray-700 font-medium">QuickBooks</span>
                  </div>

                  {/* Xero */}
                  <div className="flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer">
                    <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">X</span>
                    </div>
                    <span className="text-gray-700 font-medium">Xero</span>
                  </div>

                  {/* Outlook */}
                  <div className="flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">O</span>
                    </div>
                    <span className="text-gray-700 font-medium">Outlook</span>
                  </div>

                  {/* SAP */}
                  <div className="flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer">
                    <div className="w-8 h-8 rounded bg-blue-700 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">SAP</span>
                    </div>
                    <span className="text-gray-700 font-medium">SAP</span>
                  </div>

                  {/* Sage */}
                  <div className="flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer">
                    <div className="w-8 h-8 rounded bg-green-700 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">S</span>
                    </div>
                    <span className="text-gray-700 font-medium">Sage</span>
                  </div>

                  {/* Oracle */}
                  <div className="flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer">
                    <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">O</span>
                    </div>
                    <span className="text-gray-700 font-medium">Oracle</span>
                  </div>

                  {/* NetSuite */}
                  <div className="flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer">
                    <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">NS</span>
                    </div>
                    <span className="text-gray-700 font-medium">NetSuite</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Dashboard Preview */}
            <div className="relative animate-in fade-in slide-in-from-right duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-teal-500/20 blur-3xl animate-pulse" />
              <Card className="relative p-6 shadow-2xl border-2 hover:shadow-3xl transition-all duration-300 hover:scale-105">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Dashboard Overview</h3>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 hover:scale-125 transition-transform cursor-pointer" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500 hover:scale-125 transition-transform cursor-pointer" />
                      <div className="w-3 h-3 rounded-full bg-green-500 hover:scale-125 transition-transform cursor-pointer" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-2xl font-bold text-blue-700">24</div>
                      <div className="text-xs text-blue-600">Active Shipments</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-2xl font-bold text-teal-700">156</div>
                      <div className="text-xs text-teal-600">Documents</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-2xl font-bold text-green-700">98%</div>
                      <div className="text-xs text-green-600">Compliant</div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-2xl font-bold text-blue-700">$48.2K</div>
                      <div className="text-xs text-blue-600">Total Duties Paid</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-2xl font-bold text-green-700">$12.8K</div>
                      <div className="text-xs text-green-600">Total Savings</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-2xl font-bold text-teal-700">$2,008</div>
                      <div className="text-xs text-teal-600">Avg Cost/Import</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-2xl font-bold text-purple-700">8.2%</div>
                      <div className="text-xs text-purple-600">Effective Duty Rate</div>
                    </Card>
                  </div>

                  <Card className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Recent Shipments</span>
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      {[
                        { item: "Electronics - China", duty: "$3,240" },
                        { item: "Textiles - Vietnam", duty: "$1,850" },
                        { item: "Machinery - Germany", duty: "$5,120" },
                      ].map((shipment, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm hover:bg-white p-2 rounded transition-colors cursor-pointer"
                        >
                          <span className="text-gray-600">{shipment.item}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs">{shipment.duty}</span>
                            <span className="text-green-600 font-medium">✓</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">AI-Powered Automation</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How SwiftDocks Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From product upload to customs clearance in four simple steps
            </p>
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex items-center gap-4 p-2 bg-gray-100 rounded-full shadow-lg">
              {howItWorksSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveStep(index)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all transform hover:scale-105 ${
                      activeStep === index
                        ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg scale-105"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                        activeStep === index ? "bg-white/20 animate-pulse" : "bg-gray-300"
                      }`}
                    >
                      {step.number}
                    </div>
                    <span className="font-medium hidden md:inline">{step.title}</span>
                  </button>
                  {index < howItWorksSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-gray-400 hidden lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-teal-600 transition-all duration-100 ease-linear"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>
                Step {activeStep + 1} of {howItWorksSteps.length}
              </span>
              <span>{stepProgress}% Complete</span>
            </div>
          </div>

          {/* Active Step Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${howItWorksSteps[activeStep].color} flex items-center justify-center shadow-lg transform hover:scale-110 hover:rotate-3 transition-all`}
              >
                {(() => {
                  const Icon = howItWorksSteps[activeStep].icon
                  return <Icon className="h-8 w-8 text-white" />
                })()}
              </div>
              <h3 className="text-4xl font-bold text-gray-900">{howItWorksSteps[activeStep].title}</h3>
              <p className="text-xl text-gray-600 leading-relaxed">{howItWorksSteps[activeStep].description}</p>

              <div className="space-y-3 pt-4">
                {howItWorksSteps[activeStep].details.map((detail, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-all transform hover:translate-x-2 cursor-pointer group"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{detail}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-6">
                {activeStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(activeStep - 1)}
                    className="gap-2 hover:scale-105 transition-transform bg-transparent"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                    Previous
                  </Button>
                )}
                {activeStep < howItWorksSteps.length - 1 ? (
                  <Button
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 gap-2 hover:scale-105 transition-transform shadow-lg"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Link href="/contact">
                    <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 gap-2 hover:scale-105 transition-transform shadow-lg">
                      Join Beta
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Visual Demo */}
            <Card className="p-8 shadow-2xl animate-in fade-in slide-in-from-right duration-500 hover:shadow-3xl transition-all transform hover:scale-[1.02]">
              <div className="space-y-6">
                {activeStep === 0 && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer transform hover:scale-105 group">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                      <p className="text-gray-600 font-medium group-hover:text-blue-600 transition-colors">
                        Drop files here or click to upload
                      </p>
                      <p className="text-sm text-gray-500 mt-2">PDF, Excel, CSV, or images</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {["invoice.pdf", "products.xlsx"].map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all transform hover:scale-105 cursor-pointer"
                        >
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-4">
                    <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:shadow-lg transition-all transform hover:scale-[1.02]">
                      <div className="flex items-center gap-3 mb-3">
                        <Scan className="h-5 w-5 text-teal-600 animate-pulse" />
                        <span className="font-semibold text-teal-900">AI Classification</span>
                        <Zap className="h-4 w-4 text-yellow-500 ml-auto animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm hover:bg-teal-200/50 p-2 rounded transition-colors">
                          <span className="text-gray-700">Product: Laptop Computer</span>
                          <CheckCircle className="h-4 w-4 text-green-600 animate-in zoom-in duration-300" />
                        </div>
                        <div className="flex justify-between text-sm hover:bg-teal-200/50 p-2 rounded transition-colors">
                          <span className="text-gray-700">HTS Code: 8471.30.0100</span>
                          <CheckCircle className="h-4 w-4 text-green-600 animate-in zoom-in duration-300 delay-150" />
                        </div>
                        <div className="flex justify-between text-sm hover:bg-teal-200/50 p-2 rounded transition-colors">
                          <span className="text-gray-700">Duty Rate: 0.8%</span>
                          <CheckCircle className="h-4 w-4 text-green-600 animate-in zoom-in duration-300 delay-300" />
                        </div>
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-teal-200 hover:bg-teal-200/50 p-2 rounded transition-colors">
                          <span className="text-gray-900">Total Duty:</span>
                          <span className="text-teal-700">$240.00</span>
                        </div>
                      </div>
                    </Card>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-all transform hover:scale-[1.02]">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 animate-pulse" />
                        <span className="font-medium">Classification complete with 98% confidence</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-3">
                    {[
                      { name: "Commercial Invoice", status: "Generated", icon: FileText },
                      { name: "Packing List", status: "Generated", icon: Package },
                      { name: "Bill of Lading", status: "Generated", icon: FileText },
                      { name: "Certificate of Origin", status: "Generated", icon: Globe },
                    ].map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 hover:shadow-md transition-all transform hover:scale-[1.02] cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <doc.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">
                              {doc.name}
                            </div>
                            <div className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {doc.status}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-green-600 hover:text-white transition-all bg-transparent"
                        >
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-4">
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all transform hover:scale-[1.02]">
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="h-5 w-5 text-purple-600 animate-pulse" />
                        <span className="font-semibold text-purple-900">Compliance Check</span>
                        <CheckCircle className="h-5 w-5 text-green-600 ml-auto animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        {[
                          "HTS Classification Verified",
                          "Duty Calculations Accurate",
                          "All Documents Complete",
                          "Regulatory Requirements Met",
                        ].map((check, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-700 p-2 rounded hover:bg-purple-200/50 transition-all transform hover:translate-x-2"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600 animate-in zoom-in duration-300" />
                            <span>{check}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all shadow-lg">
                      Submit to Customs
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why This Matters Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why This Matters</h2>
            <p className="text-xl text-gray-600">Traditional import processes are slow, expensive, and error-prone</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-2 cursor-pointer group">
              <div className="text-5xl font-bold text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                {animatedStats.speed}x
              </div>
              <div className="text-xl font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Faster Processing
              </div>
              <p className="text-gray-600">Generate documents in seconds instead of hours of manual work</p>
            </Card>
            <Card className="p-8 text-center hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-2 cursor-pointer group">
              <div className="text-5xl font-bold text-green-600 mb-2 group-hover:scale-110 transition-transform">
                {animatedStats.cost}%
              </div>
              <div className="text-xl font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Cost Reduction
              </div>
              <p className="text-gray-600">Eliminate expensive broker fees and reduce compliance errors</p>
            </Card>
            <Card className="p-8 text-center hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-2 cursor-pointer group">
              <div className="text-5xl font-bold text-purple-600 mb-2 group-hover:scale-110 transition-transform">
                {animatedStats.accuracy}%
              </div>
              <div className="text-xl font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                Accuracy Rate
              </div>
              <p className="text-gray-600">AI-powered classification ensures regulatory compliance</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:scale-105 transition-transform">
              Why Choose SwiftDocks?
            </h2>
            <p className="text-xl text-gray-600">Streamline your global trade operations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "Save Time",
                description:
                  "Auto-generate import documents in seconds, not hours. Focus on growing your business instead of paperwork.",
                gradient: "from-blue-500 to-blue-600",
              },
              {
                icon: DollarSign,
                title: "Reduce Costs",
                description: "Eliminate expensive broker fees and reduce compliance errors that lead to costly delays.",
                gradient: "from-teal-500 to-teal-600",
              },
              {
                icon: CheckCircle,
                title: "Stay Compliant",
                description:
                  "Real-time HTS classification and duty calculations ensure you meet all regulatory requirements.",
                gradient: "from-green-500 to-green-600",
              },
            ].map((benefit, i) => (
              <Card
                key={i}
                className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom cursor-pointer group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all`}
                >
                  <benefit.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Dashboard</h2>
            <p className="text-xl text-gray-600">Everything you need in one place</p>
          </div>

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

                    {/* Live Shipment Tracker with Timezones */}
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

                        {/* Timezone Display */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Origin</div>
                            <div className="font-semibold text-gray-900">Shanghai</div>
                            <div className="text-xs text-blue-600">GMT+8 • 14:30</div>
                          </div>
                          <div className="text-center border-x border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Current Position</div>
                            <div className="font-semibold text-gray-900">{currentLocation}</div>
                            <div className="text-xs text-teal-600">GMT-8 • 22:30</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Destination</div>
                            <div className="font-semibold text-gray-900">Los Angeles</div>
                            <div className="text-xs text-purple-600">GMT-8 • 22:30</div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 animate-bounce" />
                          Current Location: {currentLocation}
                        </div>

                        {/* Carrier Integration */}
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">Carrier Integration</div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center">
                              <span className="text-white font-bold text-xs">M</span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">Maersk Line</div>
                              <div className="text-xs text-gray-500">Container: MSCU1234567</div>
                            </div>
                            <Button size="sm" variant="outline" className="ml-auto bg-transparent hover:bg-blue-50">
                              Track on Maersk
                            </Button>
                          </div>
                        </div>

                        {/* Greenhouse Gas Emissions */}
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-green-900 flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Carbon Footprint
                            </h4>
                            <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-medium rounded">
                              -15% vs avg
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-2xl font-bold text-green-700">2.4t</div>
                              <div className="text-xs text-green-600">CO₂ Emissions</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-700">0.19kg</div>
                              <div className="text-xs text-green-600">CO₂ per kg shipped</div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-green-700">
                            ✓ This route is 15% more efficient than industry average
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Project/Workflow Management */}
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
                          {
                            task: "Coordinate with freight forwarder",
                            assignee: "Lisa K.",
                            status: "in-progress",
                            progress: 40,
                          },
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

                    {/* Team Messaging/Collaboration */}
                    <Card className="p-6 hover:shadow-xl transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          Team Messages
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          3 unread
                        </span>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {[
                          {
                            from: "Sarah M.",
                            message: "Documents for SH-2024-001 are ready for review",
                            time: "2m ago",
                            unread: true,
                          },
                          {
                            from: "Customs Broker (Invited)",
                            message: "I've reviewed the HTS classification. Looks good!",
                            time: "15m ago",
                            unread: true,
                          },
                          {
                            from: "John D.",
                            message: "Can someone verify the duty calculation for shipment 002?",
                            time: "1h ago",
                            unread: true,
                          },
                          {
                            from: "Mike R.",
                            message: "ISF filing submitted successfully",
                            time: "3h ago",
                            unread: false,
                          },
                        ].map((msg, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border transition-all hover:scale-[1.02] cursor-pointer ${
                              msg.unread ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-gray-900 text-sm">{msg.from}</span>
                              <span className="text-xs text-gray-500">{msg.time}</span>
                            </div>
                            <p className="text-sm text-gray-600">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Input placeholder="Type a message..." className="flex-1" />
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-600">
                          Send
                        </Button>
                      </div>
                      <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                        <Info className="h-3 w-3" />
                        You can invite customs brokers and team members to collaborate on specific shipments
                      </div>
                    </Card>

                    {/* Today's Tariff Changes */}
                    <Card className="p-6 hover:shadow-xl transition-all">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        Today's Tariff Changes
                      </h3>
                      <div className="space-y-3">
                        {[
                          {
                            hts: "8471.30.0100",
                            product: "Laptop Computers",
                            oldRate: "1.2%",
                            newRate: "0.8%",
                            change: "down",
                          },
                          {
                            hts: "6204.62.4020",
                            product: "Women's Trousers",
                            oldRate: "16.6%",
                            newRate: "17.2%",
                            change: "up",
                          },
                          {
                            hts: "8479.89.9897",
                            product: "Industrial Machinery",
                            oldRate: "2.5%",
                            newRate: "2.5%",
                            change: "same",
                          },
                        ].map((tariff, i) => (
                          <div
                            key={i}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
                            onClick={() => setExpandedTariff(expandedTariff === tariff.hts ? null : tariff.hts)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900">{tariff.hts}</div>
                                <div className="text-sm text-gray-600">{tariff.product}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-xs text-gray-500 line-through">{tariff.oldRate}</div>
                                  <div
                                    className={`font-bold ${
                                      tariff.change === "down"
                                        ? "text-green-600"
                                        : tariff.change === "up"
                                          ? "text-red-600"
                                          : "text-gray-600"
                                    }`}
                                  >
                                    {tariff.newRate}
                                  </div>
                                </div>
                                {tariff.change === "down" && (
                                  <TrendingUp className="h-5 w-5 text-green-500 rotate-180" />
                                )}
                                {tariff.change === "up" && <TrendingUp className="h-5 w-5 text-red-500" />}
                              </div>
                            </div>
                            {expandedTariff === tariff.hts && (
                              <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600 animate-in fade-in">
                                <p>Affected shipments: 3 active shipments use this HTS code</p>
                                <p className="mt-1">
                                  Estimated impact:{" "}
                                  {tariff.change === "down"
                                    ? "Save $240/month"
                                    : tariff.change === "up"
                                      ? "Additional $180/month"
                                      : "No change"}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Shipments List */}
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">Shipments</h3>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Search shipments..."
                            className="pl-10 border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500"
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
                              <div className="mt-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top">
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
                                    <p className="text-gray-600 font-medium">Weight:</p>
                                    <p className="text-gray-900">{shipment.weight}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 font-medium">Value:</p>
                                    <p className="text-gray-900">{shipment.value}</p>
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
                                <div className="mt-4 flex gap-2">
                                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-600">
                                    Track Shipment
                                  </Button>
                                  <Button size="sm" variant="outline" className="bg-transparent">
                                    View Documents
                                  </Button>
                                  <Button size="sm" variant="outline" className="bg-transparent">
                                    Invite Collaborator
                                  </Button>
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
                          <p className="text-sm text-gray-600 mt-2">
                            Duty rate decreased by 0.4%. This change will be automatically applied to all affected
                            shipments.
                          </p>
                          {htsUpdateVisible && (
                            <div className="mt-3 p-2 bg-green-50 rounded border border-green-200 text-xs text-green-700 animate-in fade-in">
                              ✓ Propagating changes to 3 active shipments...
                            </div>
                          )}
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
                            description: "New ISF filing requirements effective Feb 1st - Review documentation",
                            type: "alert",
                            icon: AlertCircle,
                          },
                          {
                            title: "Trade Agreement Update",
                            description: "USMCA benefits available for 8 shipments - Potential savings: $1,240",
                            type: "info",
                            icon: Info,
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className={`p-4 rounded-lg flex items-start gap-3 border transition-all hover:scale-[1.02] cursor-pointer ${
                              item.type === "alert"
                                ? "bg-red-50 border-red-200"
                                : item.type === "info"
                                  ? "bg-blue-50 border-blue-200"
                                  : "bg-green-50 border-green-200"
                            }`}
                          >
                            <item.icon
                              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                item.type === "alert"
                                  ? "text-red-600"
                                  : item.type === "info"
                                    ? "text-blue-600"
                                    : "text-green-600"
                              }`}
                            />
                            <div className="flex-1">
                              <h4
                                className={`font-semibold mb-1 ${
                                  item.type === "alert"
                                    ? "text-red-900"
                                    : item.type === "info"
                                      ? "text-blue-900"
                                      : "text-green-900"
                                }`}
                              >
                                {item.title}
                              </h4>
                              <p
                                className={`text-sm ${
                                  item.type === "alert"
                                    ? "text-red-700"
                                    : item.type === "info"
                                      ? "text-blue-700"
                                      : "text-green-700"
                                }`}
                              >
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
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:scale-105 transition-transform cursor-pointer">
                          <div className="text-5xl font-bold text-blue-600 mb-2">{animatedStats.speed}x</div>
                          <div className="text-sm font-medium text-gray-700">Processing Speed</div>
                          <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 animate-pulse"
                              style={{ width: `${animatedStats.speed * 10}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg hover:scale-105 transition-transform cursor-pointer">
                          <div className="text-5xl font-bold text-teal-600 mb-2">{animatedStats.cost}%</div>
                          <div className="text-sm font-medium text-gray-700">Cost Reduction</div>
                          <div className="mt-2 h-2 bg-teal-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-600 animate-pulse"
                              style={{ width: `${animatedStats.cost}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:scale-105 transition-transform cursor-pointer">
                          <div className="text-5xl font-bold text-purple-600 mb-2">{animatedStats.accuracy}%</div>
                          <div className="text-sm font-medium text-gray-700">Accuracy Rate</div>
                          <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 animate-pulse"
                              style={{ width: `${animatedStats.accuracy}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 hover:shadow-xl transition-all">
                      <h3 className="font-semibold text-lg mb-4">Trade Volume Analysis</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Asia-Pacific</span>
                            <span className="text-sm font-semibold text-gray-900">45% • $21.7K</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse"
                              style={{ width: "45%" }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Europe</span>
                            <span className="text-sm font-semibold text-gray-900">35% • $16.9K</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-teal-600 animate-pulse"
                              style={{ width: "35%" }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Americas</span>
                            <span className="text-sm font-semibold text-gray-900">20% • $9.6K</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-600 animate-pulse"
                              style={{ width: "20%" }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 hover:shadow-xl transition-all">
                      <h3 className="font-semibold text-lg mb-4">Monthly Trends</h3>
                      <div className="h-64 flex items-center justify-center text-gray-400">
                        <BarChart3 className="h-24 w-24 opacity-50 animate-pulse" />
                        <p className="ml-4">Interactive chart visualization</p>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Accounting Tab with all accounting integration features */}
                {activeTab === "accounting" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-xl transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          Accounting Integration
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Synced
                          </span>
                        </div>
                      </div>

                      {/* Connected Accounting Software */}
                      <div className="mb-6 p-4 bg-white rounded-lg border border-green-200">
                        <div className="text-xs text-gray-500 mb-3">Connected Platforms</div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { name: "QuickBooks", status: "active", color: "green" },
                            { name: "Xero", status: "active", color: "blue" },
                            { name: "Sage", status: "inactive", color: "gray" },
                          ].map((platform, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer ${
                                platform.status === "active"
                                  ? "border-green-300 bg-green-50"
                                  : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm text-gray-900">{platform.name}</span>
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    platform.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                                  }`}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {platform.status === "active" ? "Live sync" : "Not connected"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Accounting Transactions */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-gray-900">Recent Transactions</h4>
                          <Button size="sm" variant="outline" className="text-xs bg-transparent hover:bg-green-50">
                            View All in QuickBooks
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {[
                            {
                              type: "Duty Payment",
                              amount: "$2,450.00",
                              account: "5100 - Import Duties",
                              shipment: "SH-2024-001",
                              status: "Posted",
                              time: "2 min ago",
                            },
                            {
                              type: "Freight Charges",
                              amount: "$1,850.00",
                              account: "5200 - Freight & Shipping",
                              shipment: "SH-2024-002",
                              status: "Posted",
                              time: "15 min ago",
                            },
                            {
                              type: "Customs Broker Fee",
                              amount: "$350.00",
                              account: "5300 - Professional Fees",
                              shipment: "SH-2024-001",
                              status: "Pending",
                              time: "1 hour ago",
                            },
                          ].map((transaction, i) => (
                            <div
                              key={i}
                              className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all hover:scale-[1.02] cursor-pointer"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      transaction.status === "Posted" ? "bg-green-500" : "bg-yellow-500 animate-pulse"
                                    }`}
                                  />
                                  <span className="font-semibold text-sm text-gray-900">{transaction.type}</span>
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                                      transaction.status === "Posted"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {transaction.status}
                                  </span>
                                </div>
                                <span className="font-bold text-gray-900">{transaction.amount}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>GL: {transaction.account}</span>
                                <span>Shipment: {transaction.shipment}</span>
                                <span>{transaction.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cost Breakdown by GL Account */}
                      <div className="p-4 bg-white rounded-lg border border-green-200">
                        <h4 className="font-semibold text-sm text-gray-900 mb-3">This Month - Cost by GL Account</h4>
                        <div className="space-y-3">
                          {[
                            { account: "5100 - Import Duties", amount: "$18,450", percentage: 45 },
                            { account: "5200 - Freight & Shipping", amount: "$12,300", percentage: 30 },
                            { account: "5300 - Professional Fees", amount: "$6,150", percentage: 15 },
                            { account: "5400 - Storage & Handling", amount: "$4,100", percentage: 10 },
                          ].map((item, i) => (
                            <div key={i} className="group hover:bg-green-50 p-2 rounded transition-all cursor-pointer">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-700 group-hover:text-green-700 transition-colors">
                                  {item.account}
                                </span>
                                <span className="font-semibold text-gray-900">{item.amount}</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 group-hover:from-green-600 group-hover:to-emerald-600"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Automated Journal Entries */}
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold text-sm text-blue-900">Automated Journal Entries</h4>
                        </div>
                        <div className="space-y-2 text-sm text-blue-800">
                          <div className="flex items-center justify-between">
                            <span>✓ Duty payments auto-posted to GL 5100</span>
                            <span className="text-xs text-blue-600">Real-time</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>✓ Freight charges reconciled with invoices</span>
                            <span className="text-xs text-blue-600">Daily</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>✓ Currency conversions applied automatically</span>
                            <span className="text-xs text-blue-600">Real-time</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>✓ Tax calculations synced with accounting</span>
                            <span className="text-xs text-blue-600">Real-time</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
                        <Info className="h-3 w-3" />
                        All import costs are automatically categorized and posted to your accounting software in
                        real-time
                      </div>
                    </Card>
                  </div>
                )}

                {/* Shipments Tab */}
                {activeTab === "shipments" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">All Shipments</h3>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Search shipments..."
                            className="pl-10 border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500"
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
                              <div className="mt-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top">
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
                                    <p className="text-gray-600 font-medium">Weight:</p>
                                    <p className="text-gray-900">{shipment.weight}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 font-medium">Value:</p>
                                    <p className="text-gray-900">{shipment.value}</p>
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
                                <div className="mt-4 flex gap-2">
                                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-600">
                                    Track Shipment
                                  </Button>
                                  <Button size="sm" variant="outline" className="bg-transparent">
                                    View Documents
                                  </Button>
                                  <Button size="sm" variant="outline" className="bg-transparent">
                                    Invite Collaborator
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Savings Calculator Section */}
      <section id="savings" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Calculate Your Savings</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See how much you can save by automating your import processes with SwiftDocks.
            </p>
          </div>

          <Card className="p-8 shadow-xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-900">Unlock Significant Savings</h3>
                <p className="text-lg text-gray-600">
                  By automating manual tasks and reducing errors, SwiftDocks empowers businesses to save time and money
                  on every import.
                </p>

                {/* Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="manualTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Manual Document Processing Time (hours/shipment)
                    </label>
                    <div className="relative">
                      <Input
                        id="manualTime"
                        type="number"
                        min="0"
                        value={calculatorInputs.manualTime}
                        onChange={(e) =>
                          setCalculatorInputs({ ...calculatorInputs, manualTime: Number.parseFloat(e.target.value) })
                        }
                        className="pl-8"
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="automatedTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Automated Processing Time (hours/shipment)
                    </label>
                    <div className="relative">
                      <Input
                        id="automatedTime"
                        type="number"
                        min="0"
                        value={calculatorInputs.automatedTime}
                        onChange={(e) =>
                          setCalculatorInputs({ ...calculatorInputs, automatedTime: Number.parseFloat(e.target.value) })
                        }
                        className="pl-8"
                      />
                      <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="laborCost" className="block text-sm font-medium text-gray-700 mb-1">
                      Labor Cost per Hour ($)
                    </label>
                    <div className="relative">
                      <Input
                        id="laborCost"
                        type="number"
                        min="0"
                        value={calculatorInputs.laborCost}
                        onChange={(e) =>
                          setCalculatorInputs({ ...calculatorInputs, laborCost: Number.parseFloat(e.target.value) })
                        }
                        className="pl-8"
                      />
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="shipmentsPerMonth" className="block text-sm font-medium text-gray-700 mb-1">
                      Shipments per Month
                    </label>
                    <div className="relative">
                      <Input
                        id="shipmentsPerMonth"
                        type="number"
                        min="0"
                        value={calculatorInputs.shipmentsPerMonth}
                        onChange={(e) =>
                          setCalculatorInputs({
                            ...calculatorInputs,
                            shipmentsPerMonth: Number.parseFloat(e.target.value),
                          })
                        }
                        className="pl-8"
                      />
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="errorReduction" className="block text-sm font-medium text-gray-700 mb-1">
                      Error Reduction (%)
                    </label>
                    <div className="relative">
                      <Input
                        id="errorReduction"
                        type="number"
                        min="0"
                        max="100"
                        value={calculatorInputs.errorReduction}
                        onChange={(e) =>
                          setCalculatorInputs({
                            ...calculatorInputs,
                            errorReduction: Number.parseFloat(e.target.value),
                          })
                        }
                        className="pl-8"
                      />
                      <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="errorCost" className="block text-sm font-medium text-gray-700 mb-1">
                      Average Cost per Error ($)
                    </label>
                    <div className="relative">
                      <Input
                        id="errorCost"
                        type="number"
                        min="0"
                        value={calculatorInputs.errorCost}
                        onChange={(e) =>
                          setCalculatorInputs({ ...calculatorInputs, errorCost: Number.parseFloat(e.target.value) })
                        }
                        className="pl-8"
                      />
                      <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Savings Display */}
              <div className="bg-gradient-to-br from-green-50 to-teal-100 border-2 border-green-300 p-8 rounded-xl shadow-lg animate-in fade-in slide-in-from-right duration-700">
                <h4 className="text-2xl font-bold text-green-800 mb-4">Estimated Monthly Savings</h4>
                <div className="text-6xl font-extrabold text-green-700 mb-2">${displayedMonthlySavings}</div>
                <p className="text-lg text-green-600 mb-6">per month</p>
                <h4 className="text-2xl font-bold text-green-800 mb-4">Estimated Annual Savings</h4>
                <div className="text-6xl font-extrabold text-green-700 mb-2">${displayedAnnualSavings}</div>
                <p className="text-lg text-green-600">per year</p>
                <div className="mt-8">
                  <Link href="/contact">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 shadow-lg hover:scale-105 transition-transform"
                    >
                      Get Started Today
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
                <Image
                  src="/images/swiftdocks-logo.png"
                  alt="SwiftDocks"
                  width={230}
                  height={66}
                  className="h-20 w-auto brightness-0 invert"
                />
                <span className="text-2xl font-bold text-white">SwiftDocks</span>
              </Link>
              <p className="text-gray-400 mb-4">Automating global trade for small businesses.</p>
              <div className="flex items-center gap-2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.002 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a href="mailto:operations@swiftdocks.com" className="hover:text-white transition-colors">
                  operations@swiftdocks.com
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="text-gray-400 hover:text-white transition-colors">
                    Benefits
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} SwiftDocks. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Accounting Tab with all accounting integration features */}
      {activeTab === "accounting" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Accounting Integration
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Synced
                </span>
              </div>
            </div>

            {/* Connected Accounting Software */}
            <div className="mb-6 p-4 bg-white rounded-lg border border-green-200">
              <div className="text-xs text-gray-500 mb-3">Connected Platforms</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "QuickBooks", status: "active", color: "green" },
                  { name: "Xero", status: "active", color: "blue" },
                  { name: "Sage", status: "inactive", color: "gray" },
                ].map((platform, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer ${
                      platform.status === "active" ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-900">{platform.name}</span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          platform.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {platform.status === "active" ? "Live sync" : "Not connected"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Accounting Transactions */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-gray-900">Recent Transactions</h4>
                <Button size="sm" variant="outline" className="text-xs bg-transparent hover:bg-green-50">
                  View All in QuickBooks
                </Button>
              </div>
              <div className="space-y-2">
                {[
                  {
                    type: "Duty Payment",
                    amount: "$2,450.00",
                    account: "5100 - Import Duties",
                    shipment: "SH-2024-001",
                    status: "Posted",
                    time: "2 min ago",
                  },
                  {
                    type: "Freight Charges",
                    amount: "$1,850.00",
                    account: "5200 - Freight & Shipping",
                    shipment: "SH-2024-002",
                    status: "Posted",
                    time: "15 min ago",
                  },
                  {
                    type: "Customs Broker Fee",
                    amount: "$350.00",
                    account: "5300 - Professional Fees",
                    shipment: "SH-2024-001",
                    status: "Pending",
                    time: "1 hour ago",
                  },
                ].map((transaction, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            transaction.status === "Posted" ? "bg-green-500" : "bg-yellow-500 animate-pulse"
                          }`}
                        />
                        <span className="font-semibold text-sm text-gray-900">{transaction.type}</span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            transaction.status === "Posted"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">{transaction.amount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>GL: {transaction.account}</span>
                      <span>Shipment: {transaction.shipment}</span>
                      <span>{transaction.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown by GL Account */}
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <h4 className="font-semibold text-sm text-gray-900 mb-3">This Month - Cost by GL Account</h4>
              <div className="space-y-3">
                {[
                  { account: "5100 - Import Duties", amount: "$18,450", percentage: 45 },
                  { account: "5200 - Freight & Shipping", amount: "$12,300", percentage: 30 },
                  { account: "5300 - Professional Fees", amount: "$6,150", percentage: 15 },
                  { account: "5400 - Storage & Handling", amount: "$4,100", percentage: 10 },
                ].map((item, i) => (
                  <div key={i} className="group hover:bg-green-50 p-2 rounded transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 group-hover:text-green-700 transition-colors">
                        {item.account}
                      </span>
                      <span className="font-semibold text-gray-900">{item.amount}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 group-hover:from-green-600 group-hover:to-emerald-600"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automated Journal Entries */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-sm text-blue-900">Automated Journal Entries</h4>
              </div>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center justify-between">
                  <span>✓ Duty payments auto-posted to GL 5100</span>
                  <span className="text-xs text-blue-600">Real-time</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>✓ Freight charges reconciled with invoices</span>
                  <span className="text-xs text-blue-600">Daily</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>✓ Currency conversions applied automatically</span>
                  <span className="text-xs text-blue-600">Real-time</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>✓ Tax calculations synced with accounting</span>
                  <span className="text-xs text-blue-600">Real-time</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <Info className="h-3 w-3" />
              All import costs are automatically categorized and posted to your accounting software in real-time
            </div>
          </Card>
        </div>
      )}

      {/* Shipments Tab */}
      {activeTab === "shipments" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">All Shipments</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search shipments..."
                  className="pl-10 border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500"
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
                    <div className="mt-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top">
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
                          <p className="text-gray-600 font-medium">Weight:</p>
                          <p className="text-gray-900">{shipment.weight}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Value:</p>
                          <p className="text-gray-900">{shipment.value}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">HTS Code:</p>
                          <p className="text-gray-900">{shipment.hts}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-gray-600 font-medium mb-2">Documents:</p>
                          <div className="flex flex-wrap gap-2">
                            {shipment.documents.map((doc, i) => (
                              <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-600">
                          Track Shipment
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          View Documents
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Invite Collaborator
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
