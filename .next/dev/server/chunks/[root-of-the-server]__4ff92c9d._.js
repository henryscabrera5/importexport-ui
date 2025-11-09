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
"[project]/lib/services/usitc-api.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * USITC Dataweb API Service
 * Handles HTS code lookups using the USITC Dataweb API
 */ __turbopack_context__.s([
    "clearHtsCache",
    ()=>clearHtsCache,
    "getCacheStats",
    ()=>getCacheStats,
    "lookupHtsCodes",
    ()=>lookupHtsCodes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@google/generative-ai/dist/index.mjs [app-route] (ecmascript)");
;
const USITC_API_KEY = process.env.USITC_DATAWEB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = "https://datawebws.usitc.gov/dataweb";
const genAI = GEMINI_API_KEY ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GoogleGenerativeAI"](GEMINI_API_KEY) : null;
// In-memory cache for HTS code lookups
const htsCache = new Map();
/**
 * Normalize description for caching (lowercase, trim, remove extra spaces)
 */ function normalizeDescription(description) {
    return description.toLowerCase().trim().replace(/\s+/g, " ");
}
/**
 * Extract key search terms from a product description
 * Removes dimensions, measurements, and common words to get to the core product
 */ function extractSearchTerms(description) {
    // Remove common measurement patterns (e.g., "500 X 100 X 100MM", "500mm", etc.)
    let cleaned = description.replace(/\d+\s*[Xx×]\s*\d+\s*[Xx×]\s*\d+\s*[Mm]{2}/gi, "") // Dimensions like "500 X 100 X 100MM"
    .replace(/\d+\s*[Mm]{2}/gi, "") // Standalone measurements like "500MM"
    .replace(/\d+\s*[Xx×]\s*\d+/gi, "") // Simple dimensions like "500 X 100"
    .replace(/\d+\s*[Cc][Mm]/gi, "") // Centimeters
    .replace(/\d+\s*[Ii][Nn]/gi, "") // Inches
    .replace(/\d+\s*[Ff][Tt]/gi, "") // Feet
    ;
    // Remove extra spaces and trim
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    // If the cleaned description is too short or empty, use the original
    if (cleaned.length < 3) {
        return description.trim();
    }
    return cleaned;
}
/**
 * Build the USITC Dataweb API query for HTS code lookup
 */ function buildHtsLookupQuery(description) {
    return {
        savedQueryName: "",
        savedQueryDesc: "",
        isOwner: true,
        runMonthly: false,
        reportOptions: {
            tradeType: "Import",
            classificationSystem: "HTS"
        },
        searchOptions: {
            MiscGroup: {
                districts: {
                    aggregation: "Aggregate District",
                    districtGroups: {
                        userGroups: []
                    },
                    districts: [],
                    districtsExpanded: [
                        {
                            name: "All Districts",
                            value: "all"
                        }
                    ],
                    districtsSelectType: "all"
                },
                importPrograms: {
                    aggregation: null,
                    importPrograms: [],
                    programsSelectType: "all"
                },
                extImportPrograms: {
                    aggregation: "Aggregate CSC",
                    extImportPrograms: [],
                    extImportProgramsExpanded: [],
                    programsSelectType: "all"
                },
                provisionCodes: {
                    aggregation: "Aggregate RPCODE",
                    provisionCodesSelectType: "all",
                    rateProvisionCodes: [],
                    rateProvisionCodesExpanded: []
                }
            },
            commodities: {
                aggregation: "Aggregate Commodities",
                codeDisplayFormat: "YES",
                commodities: [],
                commoditiesExpanded: [],
                commoditiesManual: description,
                commodityGroups: {
                    systemGroups: [],
                    userGroups: []
                },
                commoditySelectType: "search",
                granularity: "6",
                groupGranularity: null,
                searchGranularity: null
            },
            componentSettings: {
                dataToReport: [
                    "CONS_FIR_UNIT_QUANT"
                ],
                scale: "1",
                timeframeSelectType: "fullYears",
                years: [
                    "2023",
                    "2024"
                ],
                startDate: null,
                endDate: null,
                startMonth: null,
                endMonth: null,
                yearsTimeline: "Annual"
            },
            countries: {
                aggregation: "Aggregate Countries",
                countries: [],
                countriesExpanded: [
                    {
                        name: "All Countries",
                        value: "all"
                    }
                ],
                countriesSelectType: "all",
                countryGroups: {
                    systemGroups: [],
                    userGroups: []
                }
            }
        },
        sortingAndDataFormat: {
            DataSort: {
                columnOrder: [],
                fullColumnOrder: [],
                sortOrder: []
            },
            reportCustomizations: {
                exportCombineTables: false,
                showAllSubtotal: true,
                subtotalRecords: "",
                totalRecords: "20",
                exportRawData: false
            }
        }
    };
}
/**
 * Extract column names from column groups (recursive helper)
 */ function getColumns(columnGroups, prevCols = []) {
    const columns = [
        ...prevCols
    ];
    for (const group of columnGroups){
        if (group && typeof group === "object") {
            if (Array.isArray(group.columns)) {
                // Recursively process nested columns
                getColumns(group.columns, columns);
            } else if (group.label) {
                // Found a column label
                columns.push(group.label);
            } else if (Array.isArray(group)) {
                // If it's an array, process each item
                getColumns(group, columns);
            }
        }
    }
    return columns;
}
/**
 * Extract data values from rows
 */ function getData(rows) {
    const data = [];
    for (const row of rows){
        if (row?.rowEntries && Array.isArray(row.rowEntries)) {
            const rowData = [];
            for (const entry of row.rowEntries){
                rowData.push(entry?.value || "");
            }
            data.push(rowData);
        }
    }
    return data;
}
/**
 * Extract HTS codes and descriptions from USITC API response
 * Based on the USITC API documentation structure
 */ function extractHtsCodesFromResponse(responseData) {
    try {
        const results = [];
        // Navigate the nested response structure as per USITC API docs
        const tables = responseData?.dto?.tables;
        if (!tables || !Array.isArray(tables) || tables.length === 0) {
            return results;
        }
        const table = tables[0];
        const rowGroups = table?.row_groups;
        if (!rowGroups || !Array.isArray(rowGroups) || rowGroups.length === 0) {
            return results;
        }
        const rows = rowGroups[0]?.rowsNew;
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return results;
        }
        // Extract column groups to understand structure
        const columnGroups = table?.column_groups;
        if (!columnGroups || !Array.isArray(columnGroups)) {
            return results;
        }
        // Get all column labels
        const columnLabels = getColumns(columnGroups);
        // Find indices for HTS code and description columns
        let htsCodeIndex = -1;
        let descriptionIndex = -1;
        columnLabels.forEach((label, index)=>{
            const lowerLabel = label.toLowerCase();
            if ((lowerLabel.includes("hts") || lowerLabel.includes("code") || lowerLabel.includes("classification")) && htsCodeIndex === -1) {
                htsCodeIndex = index;
            }
            if ((lowerLabel.includes("description") || lowerLabel.includes("commodity") || lowerLabel.includes("product")) && descriptionIndex === -1) {
                descriptionIndex = index;
            }
        });
        // Extract data from rows
        const rowData = getData(rows);
        rowData.forEach((row)=>{
            if (!row || row.length === 0) return;
            let htsCode = "";
            let description = "";
            // Try to get from known column indices
            if (htsCodeIndex >= 0 && row[htsCodeIndex]) {
                htsCode = String(row[htsCodeIndex]).trim();
            }
            if (descriptionIndex >= 0 && row[descriptionIndex]) {
                description = String(row[descriptionIndex]).trim();
            }
            // Fallback: search through all row values
            if (!htsCode || !description) {
                for (const value of row){
                    const strValue = String(value || "").trim();
                    // HTS codes match pattern: 4 digits.2 digits.4 digits (e.g., "8471.30.0100")
                    if (!htsCode && /^\d{4}\.\d{2}\.\d{4}/.test(strValue)) {
                        htsCode = strValue;
                    }
                    // Description is typically longer text that doesn't start with numbers
                    if (!description && strValue.length > 15 && !/^\d/.test(strValue) && !strValue.includes("$")) {
                        description = strValue;
                    }
                }
            }
            // Only add if we have both code and description
            if (htsCode && description) {
                // Avoid duplicates
                const exists = results.some((r)=>r.code === htsCode);
                if (!exists) {
                    results.push({
                        code: htsCode,
                        description: description
                    });
                }
            }
        });
        return results;
    } catch (error) {
        console.error("Error extracting HTS codes from response:", error);
        return [];
    }
}
/**
 * Use Gemini AI to rank HTS codes by relevance to the item description
 * Returns top 3 most relevant matches
 */ async function rankHtsCodesWithGemini(itemDescription, htsCodeOptions) {
    if (!genAI || htsCodeOptions.length === 0) {
        // If Gemini is not available, just return first 3
        return htsCodeOptions.slice(0, 3);
    }
    if (htsCodeOptions.length <= 3) {
        // If we have 3 or fewer, no need to rank
        return htsCodeOptions;
    }
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp"
        });
        const prompt = `You are an expert at matching product/item descriptions to HTS (Harmonized Tariff Schedule) codes.

Item Description: "${itemDescription}"

HTS Code Options:
${htsCodeOptions.map((option, index)=>`${index + 1}. HTS Code: ${option.code}\n   Description: ${option.description}`).join("\n\n")}

Task: Analyze each HTS code option and rank them by how closely they match the item description. Consider:
- How well the HTS code description matches the item description
- The specificity and accuracy of the match
- Whether the HTS code is appropriate for the item type

Return ONLY a JSON array with the indices (1-based) of the top 3 most relevant HTS codes, ordered from most relevant to least relevant.

Format: [1, 5, 3] (where numbers are the 1-based indices from the list above)

Return ONLY the JSON array, no other text.`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        // Parse the JSON response
        let rankedIndices = [];
        try {
            const jsonMatch = text.match(/\[[\d\s,]+\]/);
            if (jsonMatch) {
                rankedIndices = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback: try to parse the whole response
                rankedIndices = JSON.parse(text);
            }
        } catch (parseError) {
            console.error("Error parsing Gemini ranking response:", parseError);
            // Fallback to first 3
            return htsCodeOptions.slice(0, 3);
        }
        // Convert 1-based indices to 0-based and get the ranked results
        const rankedResults = [];
        for (const index of rankedIndices.slice(0, 3)){
            const zeroBasedIndex = index - 1;
            if (zeroBasedIndex >= 0 && zeroBasedIndex < htsCodeOptions.length) {
                rankedResults.push(htsCodeOptions[zeroBasedIndex]);
            }
        }
        // If we didn't get 3 results, fill with remaining options
        if (rankedResults.length < 3) {
            for (const option of htsCodeOptions){
                if (!rankedResults.some((r)=>r.code === option.code)) {
                    rankedResults.push(option);
                    if (rankedResults.length >= 3) break;
                }
            }
        }
        return rankedResults.slice(0, 3);
    } catch (error) {
        console.error("Error ranking HTS codes with Gemini:", error);
        // Fallback to first 3 if Gemini ranking fails
        return htsCodeOptions.slice(0, 3);
    }
}
async function lookupHtsCodes(description) {
    if (!USITC_API_KEY) {
        throw new Error("USITC Dataweb API key is not configured");
    }
    if (!description || description.trim().length === 0) {
        throw new Error("Description is required");
    }
    // Check cache first
    const normalizedDesc = normalizeDescription(description);
    const cached = htsCache.get(normalizedDesc);
    if (cached) {
        return cached.slice(0, 3) // Return top 3 from cache
        ;
    }
    try {
        // Extract key search terms from description (remove dimensions, etc.)
        const searchTerms = extractSearchTerms(description);
        console.log("Original description:", description);
        console.log("Extracted search terms:", searchTerms);
        // Build query using cleaned search terms
        const query = buildHtsLookupQuery(searchTerms);
        console.log("USITC API Query structure:", JSON.stringify(query, null, 2).substring(0, 1000));
        // Make API request
        console.log("Calling USITC API...");
        const response = await fetch(`${BASE_URL}/api/v2/report2/runReport`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: `Bearer ${USITC_API_KEY}`
            },
            body: JSON.stringify(query)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("USITC API Error Response:", errorText);
            throw new Error(`USITC API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        console.log("USITC API Response OK, parsing JSON...");
        const responseData = await response.json();
        // Check for data load mode error
        if (responseData.error && responseData.error.includes("data load mode")) {
            throw new Error("USITC Dataweb is currently in data load mode. Please try again later.");
        }
        // Log response structure for debugging
        console.log("USITC API Response status:", response.status);
        console.log("USITC API Response keys:", Object.keys(responseData || {}));
        if ("TURBOPACK compile-time truthy", 1) {
            console.log("USITC API Full Response:", JSON.stringify(responseData, null, 2).substring(0, 2000));
        }
        // Extract HTS codes from response
        let results = extractHtsCodesFromResponse(responseData);
        console.log("Extracted HTS codes count:", results.length);
        // If extraction didn't work, try alternative parsing
        if (results.length === 0) {
            // Try to extract from a simpler structure
            const data = responseData?.dto?.tables?.[0];
            if (data) {
                // Look for any structured data that might contain HTS codes
                const jsonString = JSON.stringify(data);
                const htsCodeMatches = jsonString.match(/\d{4}\.\d{2}\.\d{4}/g);
                if (htsCodeMatches) {
                    // Create basic results from found codes
                    results = htsCodeMatches.map((code)=>({
                            code,
                            description: `HTS Code ${code}`
                        }));
                }
            }
        }
        // If no results found, return empty array
        if (results.length === 0) {
            return [];
        }
        // Use Gemini to intelligently rank and select top 3 most relevant matches
        const topResults = await rankHtsCodesWithGemini(description, results);
        // Cache the results
        htsCache.set(normalizedDesc, topResults);
        return topResults;
    } catch (error) {
        console.error("Error looking up HTS codes:", error);
        throw error instanceof Error ? error : new Error("Failed to lookup HTS codes");
    }
}
function clearHtsCache() {
    htsCache.clear();
}
function getCacheStats() {
    return {
        size: htsCache.size,
        keys: Array.from(htsCache.keys())
    };
}
}),
"[project]/app/api/lookup-hts-codes/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$usitc$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/services/usitc-api.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    console.log("=".repeat(80));
    console.log("🚀 API ROUTE HIT: /api/lookup-hts-codes");
    console.log("=".repeat(80));
    try {
        const body = await request.json();
        const { description } = body;
        console.log("📥 API Route: Received lookup request for:", description);
        console.log("📥 API Route: Request body:", JSON.stringify(body, null, 2));
        if (!description || typeof description !== "string" || description.trim().length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Description is required and must be a non-empty string"
            }, {
                status: 400
            });
        }
        // Check if API key is configured
        if (!process.env.USITC_DATAWEB_API_KEY) {
            console.error("❌ API Route: USITC_DATAWEB_API_KEY is not set");
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "USITC Dataweb API key is not configured on the server"
            }, {
                status: 500
            });
        }
        console.log("✅ API Route: API key is configured");
        console.log("🔍 API Route: Calling lookupHtsCodes with description:", description.trim());
        // Lookup HTS codes (returns top 3)
        const htsCodes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$usitc$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["lookupHtsCodes"])(description.trim());
        console.log("✅ API Route: Lookup completed, found", htsCodes.length, "codes");
        console.log("📤 API Route: Returning response with", htsCodes.length, "HTS codes");
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            htsCodes,
            count: htsCodes.length
        });
    } catch (error) {
        console.error("=".repeat(80));
        console.error("❌ ERROR in lookup-hts-codes API:", error);
        console.error("❌ Error details:", error instanceof Error ? error.stack : String(error));
        console.error("=".repeat(80));
        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes("API key is not configured")) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "USITC Dataweb API key is not configured"
                }, {
                    status: 500
                });
            }
            if (error.message.includes("data load mode")) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "USITC Dataweb is currently in data load mode. Please try again later."
                }, {
                    status: 503
                });
            }
            if (error.message.includes("USITC API error")) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Failed to query USITC Dataweb API",
                    message: error.message
                }, {
                    status: 502
                });
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to lookup HTS codes",
            message: error instanceof Error ? error.message : "Unknown error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4ff92c9d._.js.map