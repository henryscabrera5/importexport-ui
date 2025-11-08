"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Check,
  X,
  Zap,
  Clock,
  DollarSign,
  Shield,
  Users,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { Card } from "@/components/ui/card"

export default function BenefitsPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  const advantages = [
    {
      icon: Zap,
      title: "AI-Powered Automation",
      legacy: "Manual data entry and classification",
      swiftdocks: "Automatic HTS classification with 98% accuracy",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Clock,
      title: "Processing Speed",
      legacy: "Days to weeks for document processing",
      swiftdocks: "Minutes to hours with instant generation",
      color: "from-teal-500 to-teal-600",
    },
    {
      icon: DollarSign,
      title: "Cost Efficiency",
      legacy: "High licensing fees + consultant costs",
      swiftdocks: "Transparent pricing, 60% cost reduction",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Shield,
      title: "Compliance & Accuracy",
      legacy: "Manual verification, prone to errors",
      swiftdocks: "Real-time tariff updates, automated compliance",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Users,
      title: "User Experience",
      legacy: "Complex interfaces, steep learning curve",
      swiftdocks: "Intuitive design, onboard in minutes",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: TrendingUp,
      title: "Scalability",
      legacy: "Limited capacity, requires infrastructure",
      swiftdocks: "Cloud-native, scales with your business",
      color: "from-pink-500 to-pink-600",
    },
  ]

  const features = [
    {
      title: "Real-Time Collaboration",
      description: "Invite brokers, team members, and partners to collaborate on shipments in real-time",
      icon: Users,
    },
    {
      icon: Sparkles,
      title: "AI-Powered Intelligence",
      description:
        "Machine learning continuously improves classification accuracy and identifies cost-saving opportunities",
    },
    {
      icon: RefreshCw,
      title: "Live Tariff Updates",
      description: "Automatic updates when tariff rates change, ensuring you always have the latest information",
    },
    {
      icon: Shield,
      title: "Audit Trail & Compliance",
      description: "Complete documentation history and audit trails for regulatory compliance",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image
                src="/images/swiftdocks-logo.png"
                alt="SwiftDocks"
                width={320}
                height={92}
                className="h-24 w-auto"
                priority
              />
              <span className="text-2xl font-bold" style={{ color: "#2C3E50" }}>
                SwiftDocks
              </span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom duration-500">
            Why Choose SwiftDocks?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom duration-700">
            Modern import/export management built for today's global trade environment. Say goodbye to outdated systems
            and hello to intelligent automation.
          </p>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">SwiftDocks vs. Legacy Software</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((advantage, index) => {
              const Icon = advantage.icon
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${advantage.color} flex items-center justify-center mb-4 transition-transform ${
                      hoveredFeature === index ? "scale-110 rotate-6" : ""
                    }`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-4">{advantage.title}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600">{advantage.legacy}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-900 font-medium">{advantage.swiftdocks}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Exclusive SwiftDocks Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                >
                  <Icon className="h-10 w-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold text-center mb-12">By the Numbers</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">10x</div>
                <div className="text-blue-100">Faster Processing</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">60%</div>
                <div className="text-blue-100">Cost Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">98%</div>
                <div className="text-blue-100">Classification Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">Automated Operations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Modernize Your Trade Operations?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join forward-thinking companies that have already made the switch to SwiftDocks.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-xl transition-all hover:scale-105"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/images/swiftdocks-logo.png"
              alt="SwiftDocks"
              width={200}
              height={58}
              className="h-16 w-auto brightness-0 invert"
            />
            <span className="text-xl font-bold">SwiftDocks</span>
          </div>
          <p className="text-gray-400 mb-4">operations@swiftdocks.com</p>
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} SwiftDocks. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
