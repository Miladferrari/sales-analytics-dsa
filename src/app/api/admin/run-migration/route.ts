import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { migrationFile } = await request.json()

    if (!migrationFile) {
      return NextResponse.json({ error: 'Missing migrationFile parameter' }, { status: 400 })
    }

    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile)
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('Executing migration:', migrationFile)
    console.log('SQL:', sql)

    // For ALTER TABLE, we need to use .rpc() or .from().update()
    // Since Supabase doesn't support raw SQL via client, we'll do this differently
    // We'll manually add the columns using separate operations

    // Execute via raw SQL if available
    const { data, error } = await supabase.rpc('exec', { sql_query: sql })

    if (error) {
      console.error('Migration error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Migration executed successfully',
      data
    })
  } catch (error) {
    console.error('Failed to run migration:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
