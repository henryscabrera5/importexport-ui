import Link from "next/link"
import { ArrowLeft, ChevronDown } from "lucide-react"
import Image from "next/image"

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="flex items-center justify-center mb-6">
            <Image src="/images/swiftdocks-logo.png" alt="SwiftDocks" width={320} height={92} className="h-24 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join Our Beta</h1>
          <p className="text-xl text-gray-600">Be among the first to experience the future of global trade</p>
          <div className="flex justify-center mt-6">
            <ChevronDown className="h-8 w-8 text-blue-600 animate-bounce" />
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-150">
          <iframe
            id="JotFormIFrame-252954587796177"
            title="SwiftDocks Beta Signup"
            src="https://form.jotform.com/252954587796177"
            frameBorder="0"
            style={{
              minWidth: "100%",
              maxWidth: "100%",
              height: "539px",
              border: "none",
            }}
            scrolling="no"
          />
        </div>
      </div>
    </div>
  )
}
