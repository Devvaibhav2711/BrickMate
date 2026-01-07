
import { createClient } from '@supabase/supabase-js'

const url = 'https://gyadwqkgmsdilbzwramn.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YWR3cWtnbXNkaWxiendyYW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODM5OTEsImV4cCI6MjA4MzM1OTk5MX0.Fab4C1F1ZIbA_yhcte4vaZfoEpr6hlIAN-gTPol4v4w'

const supabase = createClient(url, key)

async function testCRUD() {
  console.log('Starting CRUD Test on customers...')
  
  // 1. INSERT
  const { data: inserted, error: insertError } = await supabase
    .from('customers')
    .insert([{ name: 'CRUD Test User', mobile: '9999999999', address: 'Test Address' }])
    .select()
    .single()

  if (insertError) {
    console.error('INSERT Failed:', insertError.message)
    return
  }
  console.log('INSERT Success:', inserted.id)

  // 2. UPDATE
  const { data: updated, error: updateError } = await supabase
    .from('customers')
    .update({ name: 'Updated CRUD User' })
    .eq('id', inserted.id)
    .select()
    .single()

  if (updateError) {
    console.error('UPDATE Failed:', updateError.message)
  } else {
    console.log('UPDATE Success:', updated.name)
  }

  // 3. DELETE
  const { error: deleteError } = await supabase
    .from('customers')
    .delete()
    .eq('id', inserted.id)

  if (deleteError) {
    console.error('DELETE Failed:', deleteError.message)
  } else {
    console.log('DELETE Success')
  }
}

testCRUD()
