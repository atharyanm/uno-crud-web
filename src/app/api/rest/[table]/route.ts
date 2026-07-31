import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    let orderCol = 'id';
    if (table === 'User') orderCol = 'id_user';
    if (table === 'Player') orderCol = 'id_player';
    if (table === 'Place') orderCol = 'id_place';
    if (table === 'Game') orderCol = 'id_game';

    let query: string;
    let queryParams: any[] = [];

    if (limitParam) {
      const limit = parseInt(limitParam);
      const offset = parseInt(offsetParam || '0');
      query = `SELECT * FROM "${table}" ORDER BY "${orderCol}" ASC LIMIT $1 OFFSET $2`;
      queryParams = [limit, offset];
    } else {
      query = `SELECT * FROM "${table}" ORDER BY "${orderCol}" ASC`;
    }

    const result = await pool.query(query, queryParams);

    return NextResponse.json(result.rows, {
      headers: {
        'Cache-Control': 'public, max-age=10, s-maxage=20, stale-while-revalidate=60',
      },
    });
  } catch (err: any) {
    console.error(`API GET error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const data = await request.json();

    const keys = Object.keys(data);
    const values = Object.values(data);

    const cols = keys.map((k) => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);

    return NextResponse.json(result.rows, { status: 201 });
  } catch (err: any) {
    console.error(`API POST error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const data = await request.json();
    const { searchParams } = new URL(request.url);

    let idField: string | null = null;
    let idVal: string | null = null;

    for (const [key, val] of searchParams.entries()) {
      if (val.startsWith('eq.')) {
        idField = key;
        idVal = val.replace('eq.', '');
        break;
      }
    }

    if (!idField || !idVal) {
      return NextResponse.json(
        { error: 'Missing filter parameter e.g. ?id_user=eq.XYZ' },
        { status: 400 }
      );
    }

    const keys = Object.keys(data);
    const values = Object.values(data);

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    values.push(idVal);
    const query = `UPDATE "${table}" SET ${setClause} WHERE "${idField}" = $${values.length} RETURNING *`;

    const result = await pool.query(query, values);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    console.error(`API PATCH error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const { searchParams } = new URL(request.url);

    let idField: string | null = null;
    let idVal: string | null = null;

    for (const [key, val] of searchParams.entries()) {
      if (val.startsWith('eq.')) {
        idField = key;
        idVal = val.replace('eq.', '');
        break;
      }
    }

    if (!idField || !idVal) {
      return NextResponse.json(
        { error: 'Missing filter parameter e.g. ?id_user=eq.XYZ' },
        { status: 400 }
      );
    }

    const query = `DELETE FROM "${table}" WHERE "${idField}" = $1`;
    await pool.query(query, [idVal]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`API DELETE error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
