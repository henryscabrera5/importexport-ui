import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""

/**
 * GET /api/orders
 * Fetch all orders for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch orders with related document information
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        *,
        documents (
          id,
          file_name,
          file_type,
          created_at
        ),
        document_parsed_data (
          id,
          extraction_confidence,
          extraction_method
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      return NextResponse.json(
        { error: "Failed to fetch orders", details: ordersError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ orders: orders || [] })
  } catch (error: any) {
    console.error("Error in GET /api/orders:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    )
  }
}

/**
 * POST /api/orders
 * Create a new order with assigned document data
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      order_number,
      order_name,
      document_parsed_data_id,
      document_id,
      status = "draft",
      order_date,
      expected_delivery_date,
      notes,
    } = body

    if (!order_number) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 })
    }

    // If document_parsed_data_id is provided, fetch the parsed data to copy to order
    let parsed_json = null
    let hts_codes: string[] = []
    let primary_hts_code = null

    if (document_parsed_data_id) {
      const { data: parsedData, error: parsedError } = await supabase
        .from("document_parsed_data")
        .select("parsed_json, hts_codes, primary_hts_code")
        .eq("id", document_parsed_data_id)
        .single()

      if (parsedError) {
        console.error("Error fetching parsed data:", parsedError)
        return NextResponse.json(
          { error: "Failed to fetch document parsed data", details: parsedError.message },
          { status: 500 },
        )
      }

      if (parsedData) {
        parsed_json = parsedData.parsed_json
        // Normalize hts_codes to array (PostgreSQL TEXT[] might be returned as string or array)
        if (Array.isArray(parsedData.hts_codes)) {
          hts_codes = parsedData.hts_codes
        } else if (typeof parsedData.hts_codes === 'string') {
          hts_codes = parsedData.hts_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
        } else {
          hts_codes = []
        }
        primary_hts_code = parsedData.primary_hts_code || null
      }
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number,
        order_name,
        status,
        document_id,
        document_parsed_data_id,
        parsed_json,
        hts_codes,
        primary_hts_code,
        order_date: order_date || new Date().toISOString().split("T")[0],
        expected_delivery_date,
        notes,
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      console.error("Order error code:", orderError.code)
      console.error("Order error message:", orderError.message)
      console.error("Order error details:", orderError.details)
      console.error("Order error hint:", orderError.hint)
      
      // Handle unique constraint violation
      if (orderError.code === "23505") {
        return NextResponse.json(
          { error: "Order number already exists for this user" },
          { status: 409 },
        )
      }

      // Handle table doesn't exist error
      if (orderError.code === "42P01" || orderError.message?.includes("does not exist")) {
        return NextResponse.json(
          { 
            error: "Orders table does not exist. Please run the migration first.",
            details: `Table 'orders' not found. Run the migration: supabase/migrations/20250116000000_create_orders_table.sql`,
            hint: "Go to Supabase Dashboard → SQL Editor and run the migration file"
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        { 
          error: "Failed to create order", 
          details: orderError.message || orderError.details || "Unknown error",
          code: orderError.code
        },
        { status: 500 },
      )
    }

    // If document_id is provided, also create an entry in order_documents
    if (document_id && order) {
      await supabase.from("order_documents").insert({
        order_id: order.id,
        document_id,
        document_parsed_data_id,
        is_primary: true,
      })
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error: any) {
    console.error("Error in POST /api/orders:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    )
  }
}
