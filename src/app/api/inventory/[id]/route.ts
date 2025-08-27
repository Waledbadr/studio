import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/[id] - Get single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Return mock data for testing
    const mockItem = {
      id,
      name: `Test Item ${id}`,
      category: 'Test Category',
      quantity: 10,
      unit_of_measure: 'pcs',
      minimum_stock: 5,
      condition_status: 'new'
    };

    return NextResponse.json(mockItem);
  } catch (err: any) {
    console.error("/api/inventory/[id] GET failed", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body: Record<string, any> = await request.json();
    // Return mock response
    return NextResponse.json({ id, updated: true });
  } catch (err: any) {
    console.error("/api/inventory/[id] PUT failed", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Return mock response
    return NextResponse.json({ id, deleted: true });
  } catch (err: any) {
    console.error("/api/inventory/[id] DELETE failed", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}