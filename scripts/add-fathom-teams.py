#!/usr/bin/env python3
"""Add fathom_teams column to sales_reps table"""

import os
import psycopg2
from urllib.parse import urlparse

# Parse Supabase URL to get database connection
supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
if not supabase_url:
    raise Exception('NEXT_PUBLIC_SUPABASE_URL not set')

# Convert Supabase URL to PostgreSQL connection string
# https://qgqsgblputjitfwwbysi.supabase.co -> qgqsgblputjitfwwbysi
project_ref = supabase_url.replace('https://', '').replace('.supabase.co', '')

# Supabase connection string format
db_password = 'WiXL7vEjK2nDfqt8'  # Your database password
conn_string = f"postgresql://postgres.{project_ref}:{db_password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

print("🔗 Connecting to database...")
conn = psycopg2.connect(conn_string)
cur = conn.cursor()

print("📝 Adding fathom_teams column...")

# Add column
cur.execute("""
    ALTER TABLE sales_reps
    ADD COLUMN IF NOT EXISTS fathom_teams TEXT[] DEFAULT '{}';
""")

# Add index
cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_sales_reps_fathom_teams
    ON sales_reps USING GIN(fathom_teams);
""")

# Add comment
cur.execute("""
    COMMENT ON COLUMN sales_reps.fathom_teams IS
    'Array of Fathom team names to import calls from. Empty array = import from all teams. Example: ["Sales", "Marketing"]';
""")

conn.commit()

# Verify
cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'sales_reps' AND column_name = 'fathom_teams';
""")

result = cur.fetchone()
if result:
    print(f"✅ Column added successfully: {result[0]} ({result[1]})")
else:
    print("❌ Column not found after creation")

cur.close()
conn.close()

print("✅ Migration complete!")
