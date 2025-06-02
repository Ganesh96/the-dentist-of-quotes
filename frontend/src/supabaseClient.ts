import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sqwlmdkclamurfirzfju.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxd2xtZGtjbGFtdXJmaXJ6Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3OTQyMDEsImV4cCI6MjA2NDM3MDIwMX0.8pqewUKUPTNYwTEdpncLHZrA3MYIAjz133tHgVIfzAQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
