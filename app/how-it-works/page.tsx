"use client"

import { useState } from "react"
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
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0)

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
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/swiftdocks-logo.png"
                alt="SwiftDocks"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 text-balance">How SwiftDocks Works</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
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
            <div className="inline-flex items-center gap-4 p-2 bg-gray-100 rounded-full">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveStep(index)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all ${
                      activeStep === index
                        ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        activeStep === index ? "bg-white/20" : "bg-gray-300"
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

          {/* Active Step Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${steps[activeStep].color} flex items-center justify-center`}
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
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{detail}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-6">
                {activeStep > 0 && (
                  <Button variant="outline" onClick={() => setActiveStep(activeStep - 1)} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}
                {activeStep < steps.length - 1 ? (
                  <Button
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 gap-2"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Link href="/#contact">
                    <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 gap-2">
                      Join Beta
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Visual Demo */}
            <Card className="p-8 shadow-2xl animate-in fade-in slide-in-from-right duration-500">
              <div className="space-y-6">
                {activeStep === 0 && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Drop files here or click to upload</p>
                      <p className="text-sm text-gray-500 mt-2">PDF, Excel, CSV, or images</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {["invoice.pdf", "products.xlsx"].map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
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
                    <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Scan className="h-5 w-5 text-teal-600" />
                        <span className="font-semibold text-teal-900">AI Classification</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Product: Laptop Computer</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">HTS Code: 8471.30.0100</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Duty Rate: 0.8%</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-teal-200">
                          <span className="text-gray-900">Total Duty:</span>
                          <span className="text-teal-700">$240.00</span>
                        </div>
                      </div>
                    </Card>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
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
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <doc.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{doc.name}</div>
                            <div className="text-xs text-green-600">{doc.status}</div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-4">
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Compliance Check</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          "HTS Classification Verified",
                          "Duty Calculations Accurate",
                          "All Documents Complete",
                          "Regulatory Requirements Met",
                        ].map((check, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{check}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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
            <Card className="p-8 text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">10x</div>
              <div className="text-xl font-semibold text-gray-900 mb-3">Faster Processing</div>
              <p className="text-gray-600">Generate documents in seconds instead of hours of manual work</p>
            </Card>
            <Card className="p-8 text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">70%</div>
              <div className="text-xl font-semibold text-gray-900 mb-3">Cost Reduction</div>
              <p className="text-gray-600">Eliminate expensive broker fees and reduce compliance errors</p>
            </Card>
            <Card className="p-8 text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-xl font-semibold text-gray-900 mb-3">Accuracy Rate</div>
              <p className="text-gray-600">AI-powered classification ensures regulatory compliance</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Automate Your Import Process?</h2>
          <p className="text-xl mb-8 text-blue-100">Join our beta and experience the future of global trade</p>
          <Link href="/#contact">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8">
              Request Early Access
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
