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
  Users,
  Zap,
  RefreshCw,
  MapPin,
  Ship,
  Newspaper,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "shipments" | "compliance" | "analytics">("overview")
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
                  className={`w-full p-3 rounded-lg font-medium text-left transition-all ${
                    activeTab === "overview"
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("shipments")}
                  className={`w-full p-3 rounded-lg font-medium text-left transition-all ${
                    activeTab === "shipments"
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Shipments
                </button>
                <button
                  onClick={() => setActiveTab("compliance")}
                  className={`w-full p-3 rounded-lg font-medium text-left transition-all ${
                    activeTab === "compliance"
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Compliance
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`w-full p-3 rounded-lg font-medium text-left transition-all ${
                    activeTab === "analytics"
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Analytics
                </button>
              </div>

              <div className="lg:col-span-3 space-y-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                    {/* Key Metrics */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer group">
                        <DollarSign className="h-5 w-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-2xl font-bold text-blue-700">$48.2K</div>
                        <div className="text-xs text-blue-600">Total Duties Paid</div>
                        <div className="text-xs text-blue-500 mt-1">↓ 12% vs last quarter</div>
                      </Card>
                      <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow cursor-pointer group">
                        <TrendingUp className="h-5 w-5 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-2xl font-bold text-green-700">$12.8K</div>
                        <div className="text-xs text-green-600">Total Savings</div>
                        <div className="text-xs text-green-500 mt-1">↑ 24% vs last quarter</div>
                      </Card>
                      <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:shadow-lg transition-shadow cursor-pointer group">
                        <Calculator className="h-5 w-5 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-2xl font-bold text-teal-700">$2,008</div>
                        <div className="text-xs text-teal-600">Avg Cost/Import</div>
                        <div className="text-xs text-teal-500 mt-1">24 shipments</div>
                      </Card>
                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow cursor-pointer group">
                        <Shield className="h-5 w-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-2xl font-bold text-purple-700">8.2%</div>
                        <div className="text-xs text-purple-600">Effective Duty Rate</div>
                        <div className="text-xs text-purple-500 mt-1">Industry avg: 9.8%</div>
                      </Card>
                    </div>

                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200">
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
                          <div className="text-right">
                            <div className="text-xs text-gray-500">ETA: Jan 28, 2025</div>
                            <div className="text-xs font-medium text-blue-600">{trackingProgress}% Complete</div>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-300 ease-linear"
                              style={{ width: `${trackingProgress}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-700">Current Location:</span>
                          <span className="font-semibold text-gray-900 animate-in fade-in">{currentLocation}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 pt-2">
                          {["Origin", "Departed", "In Transit", "Customs", "Delivered"].map((stage, i) => (
                            <div key={i} className="text-center">
                              <div
                                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 transition-all ${
                                  trackingProgress >= i * 25
                                    ? "bg-gradient-to-br from-blue-500 to-teal-500 text-white scale-110"
                                    : "bg-gray-200 text-gray-400"
                                }`}
                              >
                                {trackingProgress >= i * 25 ? "✓" : i + 1}
                              </div>
                              <div className="text-xs text-gray-600">{stage}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {[
                          { action: "Document Generated", item: "Commercial Invoice #2024-001", time: "2 min ago" },
                          { action: "Shipment Updated", item: "SH-2024-001 - In Transit", time: "15 min ago" },
                          { action: "HTS Classification", item: "8471.30.0100 verified", time: "1 hour ago" },
                          { action: "Duty Calculated", item: "$3,240 for Electronics shipment", time: "2 hours ago" },
                        ].map((activity, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <div>
                              <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                              <div className="text-xs text-gray-600">{activity.item}</div>
                            </div>
                            <div className="text-xs text-gray-500">{activity.time}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Shipments Tab */}
                {activeTab === "shipments" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search shipments by ID, origin, or destination..."
                          value={shipmentSearch}
                          onChange={(e) => setShipmentSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="flex items-center gap-2 bg-transparent">
                        <Filter className="h-4 w-4" />
                        Filter
                      </Button>
                    </div>

                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Package className="h-5 w-5 text-blue-600" />
                          Active Shipments
                        </h3>
                        <Button size="sm" variant="outline">
                          View All
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {filteredShipments.map((shipment, i) => (
                          <div key={i} className="bg-white rounded-lg border overflow-hidden">
                            <div
                              className="flex items-center justify-between p-4 hover:shadow-md transition-all cursor-pointer"
                              onClick={() => setExpandedShipment(expandedShipment === shipment.id ? null : shipment.id)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="font-semibold text-gray-900">{shipment.id}</div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      shipment.status === "Delivered"
                                        ? "bg-green-100 text-green-700"
                                        : shipment.status === "Customs Clearance"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {shipment.status}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 mb-1">
                                  {shipment.origin} → {shipment.dest}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>HTS: {shipment.hts}</span>
                                  <span>•</span>
                                  <span>{shipment.carrier}</span>
                                  <span>•</span>
                                  <span>ETA: {shipment.eta}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right ml-4">
                                  <div className="text-lg font-bold text-gray-900">{shipment.duty}</div>
                                  <div className="text-xs text-gray-500">duties</div>
                                </div>
                                {expandedShipment === shipment.id ? (
                                  <ChevronUp className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </div>

                            {expandedShipment === shipment.id && (
                              <div className="px-4 pb-4 border-t bg-gray-50 animate-in slide-in-from-top-2">
                                <div className="grid md:grid-cols-2 gap-4 pt-4">
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Shipment Details</h4>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Container:</span>
                                        <span className="font-medium text-gray-900">{shipment.container}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Weight:</span>
                                        <span className="font-medium text-gray-900">{shipment.weight}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Value:</span>
                                        <span className="font-medium text-gray-900">{shipment.value}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Documents</h4>
                                    <div className="space-y-1">
                                      {shipment.documents.map((doc, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 cursor-pointer"
                                        >
                                          <FileText className="h-3 w-3" />
                                          <span>{doc}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                                    Track Shipment
                                  </Button>
                                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                                    View Documents
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Compliance Tab */}
                {activeTab === "compliance" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Shield className="h-5 w-5 text-yellow-600" />
                          Compliance Monitor
                        </h3>
                        <div className="text-2xl font-bold text-green-600">98%</div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all cursor-pointer">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">HTS Review Required</div>
                            <div className="text-xs text-gray-600">2 classifications need verification</div>
                          </div>
                        </div>

                        <div
                          className={`relative overflow-hidden transition-all duration-500 ${
                            htsUpdateVisible ? "ring-2 ring-blue-500" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all cursor-pointer">
                            <RefreshCw
                              className={`h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0 ${
                                htsUpdateVisible ? "animate-spin" : ""
                              }`}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                HTS Schedule Update - Live
                                {htsUpdateVisible && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full animate-pulse">
                                    Updating
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                HTS 8471.30 duty rate:{" "}
                                <span className={htsUpdateVisible ? "line-through text-red-600" : ""}>
                                  {htsOldRate}
                                </span>
                                {htsUpdateVisible && (
                                  <span className="ml-2 text-green-600 font-semibold animate-in fade-in slide-in-from-right">
                                    → {htsNewRate}
                                  </span>
                                )}
                              </div>
                              {htsUpdateVisible && (
                                <div className="text-xs text-blue-600 mt-1 animate-in fade-in">
                                  ✓ Automatically updated across all active shipments
                                </div>
                              )}
                            </div>
                          </div>
                          {htsUpdateVisible && (
                            <div className="absolute inset-0 bg-blue-500/10 pointer-events-none animate-pulse" />
                          )}
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all cursor-pointer">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">License Renewal</div>
                            <div className="text-xs text-gray-600">Import license renewed until Dec 2025</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all cursor-pointer">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">All Documents Current</div>
                            <div className="text-xs text-gray-600">24 shipments fully compliant</div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <TrendingDown className="h-5 w-5 text-orange-600" />
                          Today's Tariff Changes
                        </h3>
                        <span className="text-xs text-gray-500">Updated 2 hours ago</span>
                      </div>
                      <div className="space-y-3">
                        {[
                          {
                            hts: "8471.30.0100",
                            product: "Portable computers",
                            oldRate: "1.2%",
                            newRate: "0.8%",
                            change: "down",
                            impact: "Save $240/shipment",
                            affectedShipments: ["SH-2024-001", "SH-2024-015"],
                          },
                          {
                            hts: "6204.62.4020",
                            product: "Women's trousers",
                            oldRate: "16.6%",
                            newRate: "14.9%",
                            change: "down",
                            impact: "Save $85/shipment",
                            affectedShipments: ["SH-2024-003"],
                          },
                          {
                            hts: "8479.89.9897",
                            product: "Industrial machinery",
                            oldRate: "2.5%",
                            newRate: "3.1%",
                            change: "up",
                            impact: "+$120/shipment",
                            affectedShipments: ["SH-2024-002", "SH-2024-018"],
                          },
                        ].map((tariff, i) => (
                          <div key={i} className="bg-white rounded-lg border overflow-hidden">
                            <div
                              className="flex items-center justify-between p-3 hover:shadow-md transition-all cursor-pointer"
                              onClick={() => setExpandedTariff(expandedTariff === tariff.hts ? null : tariff.hts)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-gray-900">{tariff.hts}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      tariff.change === "down"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {tariff.change === "down" ? "↓" : "↑"} {tariff.oldRate} → {tariff.newRate}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">{tariff.product}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div
                                  className={`text-sm font-semibold ${
                                    tariff.change === "down" ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {tariff.impact}
                                </div>
                                {expandedTariff === tariff.hts ? (
                                  <ChevronUp className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                            </div>

                            {expandedTariff === tariff.hts && (
                              <div className="px-3 pb-3 border-t bg-gray-50 animate-in slide-in-from-top-2">
                                <div className="pt-3">
                                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Affected Shipments:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {tariff.affectedShipments.map((shipId, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium hover:bg-blue-200 cursor-pointer transition-colors"
                                      >
                                        {shipId}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Newspaper className="h-5 w-5 text-blue-600" />
                          Latest Tariff News & Announcements
                        </h3>
                        <Button size="sm" variant="ghost" className="text-xs">
                          View All
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {[
                          {
                            id: "news-1",
                            title: "New Trade Agreement with EU",
                            summary: "Reduced tariffs on electronics and machinery effective Feb 1, 2025",
                            fullText:
                              "The United States and European Union have reached a comprehensive trade agreement that will significantly reduce tariffs on electronics and machinery imports. This agreement is expected to save importers an average of 15-20% on duty costs for affected categories. The changes will take effect on February 1, 2025, and will apply to HTS chapters 84 and 85.",
                            date: "Today",
                            category: "Trade Policy",
                          },
                          {
                            id: "news-2",
                            title: "HTS Chapter 84 Updates",
                            summary: "15 new classifications added for AI-powered devices and robotics",
                            fullText:
                              "The Harmonized Tariff Schedule has been updated to include 15 new classification codes specifically for AI-powered devices and robotics. These new codes will help importers more accurately classify emerging technologies and ensure proper duty assessment. Importers should review their current classifications and update as necessary.",
                            date: "Yesterday",
                            category: "Classification",
                          },
                          {
                            id: "news-3",
                            title: "Customs Modernization Act",
                            summary: "New digital documentation requirements starting March 2025",
                            fullText:
                              "The Customs Modernization Act introduces new digital documentation requirements that will streamline the import process. Starting March 2025, all commercial invoices and bills of lading must be submitted electronically through the ACE portal. Paper submissions will no longer be accepted for commercial shipments.",
                            date: "2 days ago",
                            category: "Compliance",
                          },
                        ].map((news, i) => (
                          <div key={i} className="bg-white rounded-lg border overflow-hidden">
                            <div
                              className="p-4 hover:shadow-md transition-all cursor-pointer"
                              onClick={() => setExpandedNews(expandedNews === news.id ? null : news.id)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    {news.title}
                                    {expandedNews === news.id ? (
                                      <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )}
                                  </h4>
                                  <p className="text-xs text-gray-600 leading-relaxed">{news.summary}</p>
                                </div>
                              </div>

                              {expandedNews === news.id && (
                                <div className="mt-3 pt-3 border-t animate-in slide-in-from-top-2">
                                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{news.fullText}</p>
                                  <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                    Read Full Article
                                  </Button>
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                  {news.category}
                                </span>
                                <span className="text-xs text-gray-500">{news.date}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* HTS Classification History */}
                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Recent HTS Classifications</h3>
                      <div className="space-y-3">
                        {[
                          { code: "8471.30.0100", product: "Portable computers", rate: "0.8%", status: "Verified" },
                          { code: "8479.89.9897", product: "Industrial machinery", rate: "2.5%", status: "Verified" },
                          { code: "6204.62.4020", product: "Women's trousers", rate: "16.6%", status: "Verified" },
                          { code: "9403.60.8080", product: "Wooden furniture", rate: "0%", status: "Pending" },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{item.code}</div>
                              <div className="text-xs text-gray-600">{item.product}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm font-semibold text-gray-900">{item.rate}</div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  item.status === "Verified"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {item.status}
                              </span>
                              <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                          Trade Analytics
                        </h3>
                        <Button size="sm" variant="ghost">
                          Export Report
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Top Origin Country</span>
                            <span className="font-semibold text-gray-900">China (42%)</span>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-teal-500 w-[42%] transition-all duration-1000" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Most Used HTS Chapter</span>
                            <span className="font-semibold text-gray-900">84 - Machinery (38%)</span>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-[38%] transition-all duration-1000" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Avg Processing Time</span>
                            <span className="font-semibold text-gray-900">3.2 days</span>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 w-[65%] transition-all duration-1000" />
                          </div>
                        </div>
                        <div className="pt-2 border-t border-purple-200">
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold text-green-600">↑ 18%</span> efficiency vs last quarter
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Cost Breakdown */}
                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Cost Breakdown by Category</h3>
                      <div className="space-y-4">
                        {[
                          { category: "Electronics", amount: "$18,240", percentage: 38 },
                          { category: "Machinery", amount: "$15,120", percentage: 31 },
                          { category: "Textiles", amount: "$9,850", percentage: 20 },
                          { category: "Other", amount: "$4,990", percentage: 11 },
                        ].map((item, i) => (
                          <div key={i} className="space-y-2 group cursor-pointer">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                                {item.category}
                              </span>
                              <span className="text-gray-900 font-semibold">{item.amount}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-1000 group-hover:from-blue-600 group-hover:to-teal-600"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
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
      <section className="py-20 bg-gradient-to-br from-blue-50 via-teal-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">See How Much You Could Save</h2>
            <p className="text-xl text-gray-600">Automate documentation, reduce errors, and move products faster.</p>
          </div>

          <Card className="p-8 shadow-2xl max-w-3xl mx-auto bg-white/80 backdrop-blur-sm border-2">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Input Fields */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Manual time per shipment (hours)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={calculatorInputs.manualTime}
                  onChange={(e) =>
                    setCalculatorInputs({ ...calculatorInputs, manualTime: Number.parseFloat(e.target.value) || 0 })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">Time spent on paperwork without automation</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Automated time per shipment (hours, with SwiftDocks)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={calculatorInputs.automatedTime}
                  onChange={(e) =>
                    setCalculatorInputs({ ...calculatorInputs, automatedTime: Number.parseFloat(e.target.value) || 0 })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">Time with AI-powered automation</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Average labor cost per hour ($)</label>
                <Input
                  type="number"
                  min="0"
                  value={calculatorInputs.laborCost}
                  onChange={(e) =>
                    setCalculatorInputs({ ...calculatorInputs, laborCost: Number.parseFloat(e.target.value) || 0 })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">Your team's hourly rate for import tasks</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Shipments per month</label>
                <Input
                  type="number"
                  min="0"
                  value={calculatorInputs.shipmentsPerMonth}
                  onChange={(e) =>
                    setCalculatorInputs({
                      ...calculatorInputs,
                      shipmentsPerMonth: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">Average monthly import volume</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Error rate reduction (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={calculatorInputs.errorReduction}
                  onChange={(e) =>
                    setCalculatorInputs({ ...calculatorInputs, errorReduction: Number.parseFloat(e.target.value) || 0 })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">Percentage of errors eliminated by automation</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Average cost per documentation error ($)</label>
                <Input
                  type="number"
                  min="0"
                  value={calculatorInputs.errorCost}
                  onChange={(e) =>
                    setCalculatorInputs({ ...calculatorInputs, errorCost: Number.parseFloat(e.target.value) || 0 })
                  }
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">Delays, fines, and rework costs per error</p>
              </div>
            </div>

            {/* Results */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="p-6 bg-gradient-to-br from-blue-500 to-teal-500 text-white border-0 shadow-lg">
                <div className="text-sm font-medium mb-2 opacity-90">Estimated Monthly Savings</div>
                <div className="text-4xl font-bold mb-1">${displayedMonthlySavings.toLocaleString()}</div>
                <div className="text-xs opacity-75">per month</div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-teal-500 to-green-500 text-white border-0 shadow-lg">
                <div className="text-sm font-medium mb-2 opacity-90">Estimated Annual Savings</div>
                <div className="text-4xl font-bold mb-1">${displayedAnnualSavings.toLocaleString()}</div>
                <div className="text-xs opacity-75">per year</div>
              </Card>
            </div>

            <p className="text-center text-sm text-gray-600 mb-6">
              Based on reduced data entry time and fewer documentation errors.
            </p>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg"
              onClick={() => {
                const contactSection = document.getElementById("contact")
                contactSection?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Join Beta – Start Saving
            </Button>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:scale-105 transition-transform">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">Built for modern trade operations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: FileText,
                title: "Document Automation",
                description: "Automatically generate all required customs documentation with AI-powered accuracy.",
              },
              {
                icon: Calculator,
                title: "Live HTS & Duty Calculator",
                description:
                  "Instant HTS classification and duty calculations for any product category updated instantaneously.",
              },
              {
                icon: Scan,
                title: "AI-Powered OCR",
                description: "Extract data from invoices and documents automatically with advanced OCR technology.",
              },
              {
                icon: Shield,
                title: "Audit Trail & Version Control",
                description: "Complete audit trail with version control for all documents and compliance records.",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="p-6 hover:shadow-2xl transition-all duration-300 group animate-in fade-in slide-in-from-bottom hover:-translate-y-2 cursor-pointer"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center mb-4 group-hover:scale-125 group-hover:rotate-12 transition-all">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:scale-105 transition-transform">About Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're building modern automation tools to simplify global trade. Our mission is to make international
              commerce accessible and efficient for small businesses worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Global Trade Automation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We automate the entire import-export workflow, from document generation to customs compliance, helping
                businesses navigate complex international regulations with ease.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">
                AI-Powered Intelligence
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our platform leverages advanced AI to classify products, calculate duties, and generate accurate customs
                documentation in seconds, eliminating manual errors and delays.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                Built for Small Businesses
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We understand the challenges small importers face. Our platform provides enterprise-level capabilities
                at an accessible price point, leveling the playing field in global trade.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:scale-105 transition-transform">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join our beta program and be among the first to experience the future of global trade
            operations@swiftdocks.com
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg px-12 hover:scale-110 transition-all shadow-lg hover:shadow-2xl"
            >
              Contact Us
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <Image
                src="/images/swiftdocks-logo.png"
                alt="SwiftDocks"
                width={270}
                height={78}
                className="h-20 w-auto brightness-0 invert"
              />
              <span className="text-2xl font-bold text-white">SwiftDocks</span>
            </Link>

            <div className="flex gap-8">
              <a href="#" className="text-gray-400 hover:text-white transition-all hover:scale-110">
                Privacy Policy
                operations@swiftdocks.com
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-all hover:scale-110">
                Terms of Use
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2025 SwiftDocks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
