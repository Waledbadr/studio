import { NextRequest, NextResponse } from 'next/server';

// Temporary simple implementation for testing
export async function GET(request: NextRequest) {
  try {
    // Return mock data for testing
    const mockData = [
      {
        id: '1',
        name: 'Test Item 1',
        category: 'Test Category',
        quantity: 10,
        unit_of_measure: 'pcs',
        minimum_stock: 5,
        condition_status: 'new'
      },
      {
        id: '2',
        name: 'Test Item 2',
        category: 'Test Category',
        quantity: 20,
        unit_of_measure: 'pcs',
        minimum_stock: 10,
        condition_status: 'good'
      }
    ];

    return NextResponse.json(mockData);
  } catch (err: any) {
    console.error("/api/inventory GET failed", err);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

// POST /api/inventory - Create inventory item
export async function POST(request: NextRequest) {
  try {
    const body: Record<string, any> = await request.json();

    // Basic validation
    const required = ["name", "category", "quantity", "unit_of_measure", "minimum_stock", "condition_status"];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 });
      }
    }

    // Return mock response
    const id = crypto.randomUUID();
    return NextResponse.json({ id, created_at: new Date().toISOString() }, { status: 201 });
  } catch (err: any) {
    console.error("/api/inventory POST failed", err);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}