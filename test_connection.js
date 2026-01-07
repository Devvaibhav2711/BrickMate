
import { createClient } from '@supabase/supabase-js'

const url = 'https://gyadwqkgmsdilbzwramn.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YWR3cWtnbXNkaWxiendyYW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODM5OTEsImV4cCI6MjA4MzM1OTk5MX0.Fab4C1F1ZIbA_yhcte4vaZfoEpr6hlIAN-gTPol4v4w'

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
