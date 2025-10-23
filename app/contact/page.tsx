import { Card } from "@/components/ui/card"
import Script from "next/script"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              SwiftDocks
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join Our Beta</h1>
          <p className="text-xl text-gray-600">Be among the first to experience the future of global trade</p>
        </div>

        <Card className="p-8 shadow-2xl bg-white">
          <Script src="https://form.jotform.com/jsform/252954587796177" strategy="lazyOnload" />
        </Card>
      </div>
    </div>
  )
}
