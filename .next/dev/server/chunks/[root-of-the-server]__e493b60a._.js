module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/process-documents/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@google/generative-ai/dist/index.mjs [app-route] (ecmascript)");
;
;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set. Document processing will not work.");
}
const genAI = GEMINI_API_KEY ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GoogleGenerativeAI"](GEMINI_API_KEY) : null;
async function POST(request) {
    try {
        if (!genAI) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Gemini API key not configured"
            }, {
                status: 500
            });
        }
        const body = await request.json();
        const { fileData, fileName, mimeType, documentType } = body;
        if (!fileData || !documentType) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Missing required fields: fileData and documentType"
            }, {
                status: 400
            });
        }
        // Get the Gemini model
        // NOTE: Default/free tier API keys typically only have access to gemini-2.0-flash-exp
        // Check available models at /api/check-gemini-models if you need to verify
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp"
        });
        // First pass: Understand the document structure
        // NOTE: This understanding prompt may be adjusted based on document analysis needs
        const understandingPrompt = `Analyze this document and describe its structure, layout, and content type. 
Identify if it contains tables, lists, or structured data. 
For packing lists, identify if items are in a table format where each row represents one item.
Return a brief JSON summary: { "documentType": "...", "hasTables": true/false, "tableStructure": "description", "itemCount": number }`;
        const firstPassResult = await model.generateContent([
            understandingPrompt,
            {
                inlineData: {
                    data: fileData,
                    mimeType: mimeType
                }
            }
        ]);
        const firstPassResponse = await firstPassResult.response;
        const firstPassText = firstPassResponse.text();
        // Parse first pass understanding
        let documentUnderstanding;
        try {
            const jsonMatch = firstPassText.match(/```json\n([\s\S]*?)\n```/) || firstPassText.match(/```\n([\s\S]*?)\n```/);
            const jsonString = jsonMatch ? jsonMatch[1] : firstPassText;
            documentUnderstanding = JSON.parse(jsonString);
        } catch (parseError) {
            documentUnderstanding = {
                rawText: firstPassText
            };
        }
        // Second pass: Extract data (with specialized prompts for each document type)
        let prompt;
        if (documentType === "packing_list") {
            // Special prompt for packing lists to extract table rows
            prompt = createPackingListExtractionPrompt(documentUnderstanding);
        } else if (documentType === "commercial_invoice") {
            // Special prompt for commercial invoices to extract billed items from table rows
            prompt = createCommercialInvoiceExtractionPrompt(documentUnderstanding);
        } else {
            // Fallback extraction prompt
            prompt = createPromptForDocumentType(documentType);
        }
        // Process the document for extraction
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: fileData,
                    mimeType: mimeType
                }
            }
        ]);
        const response = await result.response;
        const text = response.text();
        // Parse the JSON response from Gemini
        // NOTE: Response parsing logic may need adjustment based on Gemini's output format changes
        let parsedData;
        try {
            // Extract JSON from markdown code blocks if present
            // NOTE: This regex pattern may need updates if Gemini changes its response formatting
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
            const jsonString = jsonMatch ? jsonMatch[1] : text;
            parsedData = JSON.parse(jsonString);
        } catch (parseError) {
            // If parsing fails, try to extract structured data from text
            // NOTE: Fallback parsing strategy - may need enhancement for better error recovery
            parsedData = {
                rawText: text,
                parseError: "Failed to parse JSON response"
            };
        }
        // Add understanding metadata to parsed data
        parsedData.documentUnderstanding = documentUnderstanding;
        // NOTE: Response structure may be modified when integrating with Supabase storage
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            documentType,
            extractedData: parsedData,
            confidence: parsedData.confidence || 0.85,
            processingMetadata: {
                model: "gemini-2.0-flash-exp",
                extractionMethod: "gemini_vision",
                fileName
            }
        });
    } catch (error) {
        console.error("Error processing document:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to process document",
            message: error instanceof Error ? error.message : "Unknown error"
        }, {
            status: 500
        });
    }
}
/**
 * Create fallback prompt for document extraction (used for unknown document types)
 * NOTE: This is a generic fallback - specific document types use specialized prompts
 */ function createPromptForDocumentType(documentType) {
    const basePrompt = `You are an expert at extracting structured data from import/export documents. 
Analyze the provided document and extract all relevant information. Return the data as a JSON object.`;
    return basePrompt;
}
/**
 * Create specialized prompt for commercial invoice extraction with table row focus
 * NOTE: This prompt structure and output format may be adjusted based on document variations
 */ function createCommercialInvoiceExtractionPrompt(documentUnderstanding) {
    return `You are an expert at extracting structured data from COMMERCIAL INVOICES.

IMPORTANT: Commercial invoices typically contain billed items in a TABLE format where EACH ROW represents ONE BILLED ITEM.

Based on the document structure analysis, extract the following information:

1. Document Header Information (REQUIRED):
- invoiceNumber: Invoice number (extract from document)
- invoiceDate: Invoice date (YYYY-MM-DD format)
- currency: Currency code (e.g., "USD", "EUR", "CNY") - extract from document

2. Shipper/Consignee Information (REQUIRED):
- seller (Shipper/Exporter): { 
    name: Company/business name,
    address: Complete exact address including street, city, state/province, postal code, country,
    taxId: Tax ID/VAT number if available,
    contact: {
      phone: Phone number if available,
      email: Email address if available,
      fax: Fax number if available,
      contactPerson: Contact person name if available
    }
  } - Extract shipper/exporter/seller complete information
- buyer (Consignee): { 
    name: Company/business name,
    address: Complete exact address including street, city, state/province, postal code, country,
    taxId: Tax ID/VAT number if available,
    contact: {
      phone: Phone number if available,
      email: Email address if available,
      fax: Fax number if available,
      contactPerson: Contact person name if available
    }
  } - Extract consignee/buyer complete information

3. Billed Items/Products Table (REQUIRED):
The document contains a table where each ROW is one billed item. Extract ALL rows from the table.
For EACH ROW, create an entry in the products array with:
- description: Product/item description from the row (REQUIRED)
- quantity: Quantity as number (REQUIRED - extract from the row)
- unitOfMeasure: Unit of measure (e.g., "pcs", "kg", "m", "boxes", "cartons")
- unitPrice: Unit price as number (REQUIRED - extract from the row)
- totalPrice: Total price for this line item (REQUIRED - extract from the row)
- countryOfOrigin: Country being shipped from/origin (e.g., "CN", "US", "DE") - extract country code or name
- htsCode: HS Code (Harmonized System code) if available in the row - also known as HTS code
- currency: Currency code (e.g., "USD", "EUR") - usually consistent across all items
- weight: Weight from the row (if available)
- weightUnit: Weight unit (e.g., "kg", "lbs")
- any other relevant fields from the table columns

4. Shipment Information:
- shipmentInfo: { 
    originCountry: Country being shipped from/origin (REQUIRED),
    originCity: Origin city if available,
    destinationCountry: Destination country,
    destinationCity: Destination city,
    carrier: Carrier name if available,
    containerNumber: Container number if available,
    vesselName: Vessel name if available,
    estimatedArrivalDate: Estimated arrival date if available,
    incoterms: Incoterms if applicable (e.g., "FOB", "CIF", "EXW", "DDP", "DAP", etc.)
  }

5. Document Signer Information:
- signer: {
    name: Full name of person signing the document,
    company: Company name of signer if different from seller,
    title: Job title/position if available,
    signature: Signature information if available,
    date: Date of signature if available,
    contact: {
      phone: Phone number if available,
      email: Email address if available
    }
  } - Extract complete information about the person signing off on the document

6. Totals:
- totals: { totalValue: Total invoice value (REQUIRED), totalWeight, currency }

7. Metadata:
- confidence: Your confidence score (0-1)

CRITICAL EXTRACTION REQUIREMENTS: 
- Extract EVERY row from the billed items table
- Each row should become one object in the products array
- Product Descriptions: Extract full product/item descriptions
- Quantities: Extract quantities as numbers
- Unit Prices and Totals: Extract both unit price and total price for each line item
- Shipper/Exporter/Consignee Names and Addresses: Extract complete exact addresses including street address, city, state/province, postal code, and country
- Contact Information: Extract phone, email, fax, and contact person for all parties (seller, buyer, signer)
- Signer Information: Extract name, company, title, signature details, and contact information for person signing the document
- Invoice Numbers: Extract invoice number from document header
- Dates: Extract invoice date in YYYY-MM-DD format
- Currencies: Extract currency code (USD, EUR, etc.)
- Country being shipped from/origin: Extract origin country for each product and overall shipment
- HS Code: Extract HS/HTS codes if visible in the table rows
- Incoterms: Extract incoterms if applicable (FOB, CIF, EXW, DDP, DAP, etc.)
- Preserve all information from each table row including pricing details
- If the table has column headers, use them to identify what each column represents
- Ensure currency is captured and applied consistently

Return ONLY valid JSON in this format:
{
  "invoiceNumber": "...",
  "invoiceDate": "YYYY-MM-DD",
  "currency": "USD",
  "seller": { 
    "name": "...", 
    "address": "Complete exact address including street, city, state, postal code, country",
    "taxId": "...",
    "contact": {
      "phone": "...",
      "email": "...",
      "fax": "...",
      "contactPerson": "..."
    }
  },
  "buyer": { 
    "name": "...", 
    "address": "Complete exact address including street, city, state, postal code, country",
    "taxId": "...",
    "contact": {
      "phone": "...",
      "email": "...",
      "fax": "...",
      "contactPerson": "..."
    }
  },
  "signer": {
    "name": "Full name of signer",
    "company": "Company name",
    "title": "Job title",
    "signature": "Signature info if available",
    "date": "Signature date",
    "contact": {
      "phone": "...",
      "email": "..."
    }
  },
  "products": [
    { 
      "description": "...", 
      "quantity": 1, 
      "unitPrice": 10.00, 
      "totalPrice": 10.00,
      "countryOfOrigin": "CN",
      "htsCode": "8471.30.0100",
      "currency": "USD",
      ...
    },
    ...
  ],
  "shipmentInfo": { 
    "originCountry": "CN",
    "originCity": "...",
    "destinationCountry": "US",
    "incoterms": "FOB",
    ...
  },
  "totals": { "totalValue": 1000.00, "totalWeight": 500, "currency": "USD" },
  "confidence": 0.95
}

Return ONLY valid JSON, no markdown formatting or additional text.`;
}
/**
 * Create specialized prompt for packing list extraction with table row focus
 * NOTE: This prompt structure and output format may be adjusted based on document variations
 */ function createPackingListExtractionPrompt(documentUnderstanding) {
    return `You are an expert at extracting structured data from PACKING LISTS.

IMPORTANT: Packing lists typically contain items in a TABLE format where EACH ROW represents ONE ITEM.

Based on the document structure analysis, extract the following information:

1. Document Header Information (REQUIRED):
- packingListNumber: Packing list number (extract from document)
- invoiceNumber: Invoice number if referenced on packing list
- shipmentDate: Shipment date (YYYY-MM-DD format)
- currency: Currency code (e.g., "USD", "EUR", "CNY") if available

2. Shipper/Consignee Information (REQUIRED):
- seller (Shipper/Exporter): { 
    name: Company/business name,
    address: Complete exact address including street, city, state/province, postal code, country,
    taxId: Tax ID/VAT number if available,
    contact: {
      phone: Phone number if available,
      email: Email address if available,
      fax: Fax number if available,
      contactPerson: Contact person name if available
    }
  } - Extract shipper/exporter/seller complete information
- buyer (Consignee): { 
    name: Company/business name,
    address: Complete exact address including street, city, state/province, postal code, country,
    taxId: Tax ID/VAT number if available,
    contact: {
      phone: Phone number if available,
      email: Email address if available,
      fax: Fax number if available,
      contactPerson: Contact person name if available
    }
  } - Extract consignee/buyer complete information

3. Items/Products Table (REQUIRED):
The document contains a table where each ROW is one item. Extract ALL rows from the table.
For EACH ROW, create an entry in the products array with:
- description: Product/item description from the row (REQUIRED)
- quantity: Quantity as number (REQUIRED - extract from the row)
- unitOfMeasure: Unit of measure (e.g., "pcs", "kg", "m", "boxes", "cartons")
- unitPrice: Unit price as number (if available in the row)
- totalPrice: Total price for this line item (if available in the row)
- countryOfOrigin: Country being shipped from/origin (e.g., "CN", "US", "DE") - extract country code or name
- htsCode: HS Code (Harmonized System code) if available in the row - also known as HTS code
- packageNumber: Package/carton number if listed (Package Counts)
- packageCount: Number of packages/cartons for this item
- weight: Weight from the row (REQUIRED if available)
- weightUnit: Weight unit (e.g., "kg", "lbs")
- dimensions: Dimensions if available (length x width x height) - extract as string like "10x20x30 cm" or object
- length: Length dimension if available
- width: Width dimension if available
- height: Height dimension if available
- dimensionUnit: Unit for dimensions (e.g., "cm", "in", "m")
- currency: Currency code (e.g., "USD", "EUR") if available
- any other relevant fields from the table columns

4. Shipment Information:
- shipmentInfo: { 
    originCountry: Country being shipped from/origin (REQUIRED),
    originCity: Origin city if available,
    destinationCountry: Destination country,
    destinationCity: Destination city,
    carrier: Carrier name if available,
    containerNumber: Container number if available,
    vesselName: Vessel name if available,
    estimatedArrivalDate: Estimated arrival date if available,
    incoterms: Incoterms if applicable (e.g., "FOB", "CIF", "EXW", "DDP", "DAP", etc.)
  }

5. Document Signer Information:
- signer: {
    name: Full name of person signing the document,
    company: Company name of signer if different from seller,
    title: Job title/position if available,
    signature: Signature information if available,
    date: Date of signature if available,
    contact: {
      phone: Phone number if available,
      email: Email address if available
    }
  } - Extract complete information about the person signing off on the document

6. Totals:
- totals: { 
    totalWeight: Total weight (REQUIRED if available),
    weightUnit: Weight unit,
    totalPackages: Total package count (REQUIRED if available),
    totalQuantity: Total quantity of items,
    totalValue: Total value if available,
    currency: Currency code
  }

7. Metadata:
- confidence: Your confidence score (0-1)

CRITICAL EXTRACTION REQUIREMENTS: 
- Extract EVERY row from the items table
- Each row should become one object in the products array
- Product Descriptions: Extract full product/item descriptions
- Quantities: Extract quantities as numbers
- Unit Prices and Totals: Extract both unit price and total price if available
- Shipper/Exporter/Consignee Names and Addresses: Extract complete exact addresses including street address, city, state/province, postal code, and country
- Contact Information: Extract phone, email, fax, and contact person for all parties (seller, buyer, signer)
- Signer Information: Extract name, company, title, signature details, and contact information for person signing the document
- Invoice Numbers: Extract invoice number if referenced on packing list
- Dates: Extract shipment date in YYYY-MM-DD format
- Currencies: Extract currency code (USD, EUR, etc.) if available
- Country being shipped from/origin: Extract origin country for each product and overall shipment
- HS Code: Extract HS/HTS codes if visible in the table rows
- Package Counts: Extract number of packages/cartons for each item and total
- Weights: Extract weight for each item and total weight
- Dimensions: Extract dimensions (length, width, height) for each item if available
- Incoterms: Extract incoterms if applicable (FOB, CIF, EXW, DDP, DAP, etc.)
- Preserve all information from each table row
- If the table has column headers, use them to identify what each column represents

Return ONLY valid JSON in this format:
{
  "packingListNumber": "...",
  "invoiceNumber": "...",
  "shipmentDate": "YYYY-MM-DD",
  "currency": "USD",
  "seller": { 
    "name": "...", 
    "address": "Complete exact address including street, city, state, postal code, country",
    "taxId": "...",
    "contact": {
      "phone": "...",
      "email": "...",
      "fax": "...",
      "contactPerson": "..."
    }
  },
  "buyer": { 
    "name": "...", 
    "address": "Complete exact address including street, city, state, postal code, country",
    "taxId": "...",
    "contact": {
      "phone": "...",
      "email": "...",
      "fax": "...",
      "contactPerson": "..."
    }
  },
  "signer": {
    "name": "Full name of signer",
    "company": "Company name",
    "title": "Job title",
    "signature": "Signature info if available",
    "date": "Signature date",
    "contact": {
      "phone": "...",
      "email": "..."
    }
  },
  "products": [
    { 
      "description": "...", 
      "quantity": 1,
      "unitPrice": 10.00,
      "totalPrice": 10.00,
      "countryOfOrigin": "CN",
      "htsCode": "8471.30.0100",
      "packageNumber": "PKG-001",
      "packageCount": 2,
      "weight": 5.5,
      "weightUnit": "kg",
      "dimensions": "10x20x30 cm",
      "length": 10,
      "width": 20,
      "height": 30,
      "dimensionUnit": "cm",
      ...
    },
    ...
  ],
  "shipmentInfo": { 
    "originCountry": "CN",
    "originCity": "...",
    "incoterms": "FOB",
    ...
  },
  "totals": { 
    "totalWeight": 100,
    "weightUnit": "kg",
    "totalPackages": 20,
    "totalQuantity": 50,
    "totalValue": 1000.00,
    "currency": "USD"
  },
  "confidence": 0.95
}

Return ONLY valid JSON, no markdown formatting or additional text.`;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e493b60a._.js.map