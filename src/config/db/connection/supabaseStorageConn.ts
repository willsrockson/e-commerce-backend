import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://giukqbonzinrabejotuk.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default supabase;