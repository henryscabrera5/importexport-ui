import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""

/**
 * GET /api/orders/[id]
 * Fetch a single order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
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

    const { data: order, error: orderError } = await supabase
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
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      console.error("Error fetching order:", orderError)
      return NextResponse.json(
        { error: "Failed to fetch order", details: orderError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error("Error in GET /api/orders/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/orders/[id]
 * Update an order
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
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
    const updateData: any = {}

    // Only include fields that are provided
    if (body.order_number !== undefined) updateData.order_number = body.order_number
    if (body.order_name !== undefined) updateData.order_name = body.order_name
    if (body.status !== undefined) updateData.status = body.status
    if (body.order_date !== undefined) updateData.order_date = body.order_date
    if (body.expected_delivery_date !== undefined)
      updateData.expected_delivery_date = body.expected_delivery_date
    if (body.notes !== undefined) updateData.notes = body.notes

    // If updating document assignment, fetch and copy parsed data
    if (body.document_parsed_data_id !== undefined) {
      updateData.document_parsed_data_id = body.document_parsed_data_id

      if (body.document_parsed_data_id) {
        const { data: parsedData, error: parsedError } = await supabase
          .from("document_parsed_data")
          .select("parsed_json, hts_codes, primary_hts_code")
          .eq("id", body.document_parsed_data_id)
          .single()

        if (!parsedError && parsedData) {
          updateData.parsed_json = parsedData.parsed_json
          updateData.hts_codes = parsedData.hts_codes || []
          updateData.primary_hts_code = parsedData.primary_hts_code || null
        }
      }
    }

    if (body.document_id !== undefined) {
      updateData.document_id = body.document_id
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      console.error("Error updating order:", {
        error: orderError,
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        updateData,
        orderId: id,
        userId: user.id,
      })
      return NextResponse.json(
        { 
          error: "Failed to update order", 
          details: orderError.message,
          code: orderError.code,
          hint: orderError.hint,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error("Error in PUT /api/orders/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/orders/[id]
 * Delete an order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
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

    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Error deleting order:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete order", details: deleteError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/orders/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    )
  }
}
