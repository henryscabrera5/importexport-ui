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
"[project]/app/api/get-latest-documents/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
;
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://ziqueocxmhfqtijrxwbp.supabase.co") || "";
async function GET(request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        // Extract token from "Bearer <token>"
        const token = authHeader.replace("Bearer ", "");
        // Create Supabase client with user's token
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcXVlb2N4bWhmcXRpanJ4d2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDg4NTksImV4cCI6MjA3ODEyNDg1OX0.S_p0dXf8M2ru7jUBjQb7nxJGnuvOO9uhj67x7dCNShY") || "", {
            global: {
                headers: {
                    Authorization: authHeader
                }
            }
        });
        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        // Fetch latest documents with parsed data
        const { data: documents, error: documentsError } = await supabase.from("documents").select(`
        id,
        file_name,
        file_type,
        file_size,
        status,
        created_at,
        document_parsed_data (
          id,
          parsed_json,
          extraction_confidence,
          extraction_method,
          created_at
        )
      `).eq("user_id", user.id).eq("status", "processed").order("created_at", {
            ascending: false
        }).limit(1) // Get only the most recent document
        ;
        if (documentsError) {
            console.error("Error fetching documents:", documentsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Failed to fetch documents",
                details: documentsError.message
            }, {
                status: 500
            });
        }
        // Transform the data to match the ProcessedDocument format
        // NOTE: Handle both nested structure (parsed_json.extractedData) and flat structure (parsed_json is extractedData)
        const processedDocuments = documents?.filter((doc)=>doc.document_parsed_data && Array.isArray(doc.document_parsed_data) && doc.document_parsed_data.length > 0).map((doc)=>{
            const parsedData = Array.isArray(doc.document_parsed_data) ? doc.document_parsed_data[0] : doc.document_parsed_data;
            const parsedJson = parsedData?.parsed_json || {};
            // Determine document type and extracted data structure
            const documentType = parsedJson.documentType || "commercial_invoice";
            const extractedData = parsedJson.extractedData || parsedJson // Use extractedData if available, otherwise use parsedJson directly
            ;
            return {
                documentId: doc.id,
                fileName: doc.file_name,
                documentType: documentType,
                extractedData: extractedData,
                confidence: (parsedData?.extraction_confidence || 0) / 100,
                processingMetadata: {
                    processingTime: 0,
                    model: "gemini-2.0-flash-exp",
                    extractionMethod: parsedData?.extraction_method || "gemini_vision",
                    fileName: doc.file_name
                },
                createdAt: doc.created_at
            };
        }) || [];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            documents: processedDocuments,
            count: processedDocuments.length
        });
    } catch (error) {
        console.error("Error in get-latest-documents:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to fetch documents",
            message: error instanceof Error ? error.message : "Unknown error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__57884960._.js.map