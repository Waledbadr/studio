// GET /api/residences - list residences from D1
import { json } from './auth/_utils';

export const onRequestGet = async (context: any) => {
  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, address, building_name, floor_number, property_type, status, created_at, updated_at
       FROM residences
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(200, 0).all();
    return json({ residences: results || [] });
  } catch (err) {
    console.error('CF residences list error:', err);
    return json({ error: 'Failed to list residences' }, { status: 500 });
  }
};
