import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ihnxdlgriotukqwunlxj.supabase.co'
const supabaseKey = 'sb_publishable_8YCft8yMiQuMc8VGcYWBEw_NtNJhjzc'

export const supabase = createClient(supabaseUrl, supabaseKey)