import { NextRequest, NextResponse } from 'next/server';

// GET /api/transactions - List transactions with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") || 50)));
    const offset = Math.max(0, Number(searchParams.get("offset") || 0));
    const itemId = searchParams.get("itemId") || undefined;
    const residenceId = searchParams.get("residenceId") || undefined;
    const referenceDocId = searchParams.get("referenceDocId") || undefined;

    // Return mock data for now to test the API connection
    const mockTransactions = [
      {
        id: 'tx-001',
        itemId: 'inv-001',
        itemNameEn: 'Test Item 1',
        itemNameAr: 'عنصر تجريبي 1',
        residenceId: 'res-001',
        date: '2025-01-15',
        type: 'OUT',
        quantity: 5,
        referenceDocId: 'MRV-001',
        relatedResidenceId: null,
        locationName: 'Main Warehouse',
        notes: 'Test transaction',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z'
      },
      {
        id: 'tx-002',
        itemId: 'inv-002',
        itemNameEn: 'Test Item 2',
        itemNameAr: 'عنصر تجريبي 2',
        residenceId: 'res-002',
        date: '2025-01-16',
        type: 'IN',
        quantity: 10,
        referenceDocId: 'MIV-001',
        relatedResidenceId: null,
        locationName: 'Secondary Warehouse',
        notes: 'Another test transaction',
        created_at: '2025-01-16T11:00:00Z',
        updated_at: '2025-01-16T11:00:00Z'
      }
    ];

    let transactions = mockTransactions;

    // Apply filters
    if (referenceDocId) {
      transactions = transactions.filter(tx => tx.referenceDocId === referenceDocId);
    }
    if (itemId) {
      transactions = transactions.filter(tx => tx.itemId === itemId);
    }
    if (residenceId) {
      transactions = transactions.filter(tx => tx.residenceId === residenceId);
    }

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    transactions = transactions.slice(startIndex, endIndex);

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, any>;

    // Basic validation
    const required = ["itemId", "itemNameEn", "residenceId", "date", "type", "quantity"];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 });
      }
    }

    // Mock response for now
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    return NextResponse.json({ id, created_at: now }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error.message },
      { status: 500 }
    );
  }
}