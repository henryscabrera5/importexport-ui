"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Upload,
  Scan,
  Calculator,
  FileText,
  CheckCircle,
  ArrowRight,
  Package,
  Globe,
  Shield,
  ChevronLeft,
  Sparkles,
  Zap,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [animatedStats, setAnimatedStats] = useState({ speed: 0, cost: 0, accuracy: 0 })

  useEffect(() => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
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

  const steps = [
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
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28">
            <Link href="/" className="flex items-center gap-4 group">
              <Image
                src="/images/swiftdocks-logo.png"
                alt="SwiftDocks"
                width={320}
                height={92}
                className="h-24 w-auto transition-transform group-hover:scale-105"
              />
              <span className="text-3xl font-bold text-[#2C3E50] transition-colors group-hover:text-blue-600">
                SwiftDocks
              </span>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="gap-2 hover:bg-blue-50 transition-all hover:scale-105">
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-teal-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6 animate-in fade-in slide-in-from-top duration-500">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">AI-Powered Automation</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 text-balance animate-in fade-in slide-in-from-bottom duration-700">
            How SwiftDocks Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-700 delay-150">
            From product upload to customs clearance in four simple steps. See how we automate the entire import-export
            process.
          </p>
        </div>
      </section>

      {/* Interactive Steps Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Step Navigation */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex items-center gap-4 p-2 bg-gray-100 rounded-full shadow-lg">
              {steps.map((step, index) => (
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
                  {index < steps.length - 1 && <ArrowRight className="h-5 w-5 text-gray-400 hidden lg:block" />}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-teal-600 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>
                Step {activeStep + 1} of {steps.length}
              </span>
              <span>{progress}% Complete</span>
            </div>
          </div>

          {/* Active Step Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${steps[activeStep].color} flex items-center justify-center shadow-lg transform hover:scale-110 hover:rotate-3 transition-all`}
              >
                {(() => {
                  const Icon = steps[activeStep].icon
                  return <Icon className="h-8 w-8 text-white" />
                })()}
              </div>
              <h2 className="text-4xl font-bold text-gray-900">{steps[activeStep].title}</h2>
              <p className="text-xl text-gray-600 leading-relaxed">{steps[activeStep].description}</p>

              <div className="space-y-3 pt-4">
                {steps[activeStep].details.map((detail, i) => (
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
                    className="gap-2 hover:scale-105 transition-transform"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}
                {activeStep < steps.length - 1 ? (
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
                        style={{ animationDelay: `${i * 100}ms` }}
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
                            style={{ animationDelay: `${i * 100}ms` }}
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

      {/* Benefits Section */}
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-blob"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6 animate-in fade-in slide-in-from-bottom duration-500">
            Ready to Automate Your Import Process?
          </h2>
          <p className="text-xl mb-8 text-blue-100 animate-in fade-in slide-in-from-bottom duration-500 delay-150">
            Join our beta and experience the future of global trade
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 hover:scale-110 transition-all shadow-2xl animate-in fade-in slide-in-from-bottom duration-500 delay-300"
            >
              Request Early Access
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
