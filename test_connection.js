
import { createClient } from '@supabase/supabase-js'

const url = 'https://rfyqhhctzaukizavwcbr.supabase.co'
const key = 'sb_publishable_fC5EN1-jLjHsWZ0YMic0BA_YMC0dlsj'

console.log('Testing connection with:')
console.log('URL:', url)
console.log('Key:', key)

const supabase = createClient(url, key)

async function test() {
  try {
    const { data, error } = await supabase.from('labour').select('count', { count: 'exact', head: true })
    if (error) {
      console.error('Connection Failed:', error.message)
    } else {
      console.log('Connection Successful! count:', data)
    }
  } catch (err) {
    console.error('Unexpected Error:', err.message)
  }
}

test()
