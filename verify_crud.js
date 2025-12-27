
import { createClient } from '@supabase/supabase-js'

const url = 'https://rfyqhhctzaukizavwcbr.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXFoaGN0emF1a2l6YXZ3Y2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2Nzg2MDUsImV4cCI6MjA4MjI1NDYwNX0.8_W75NjH5qsoXSlZjVNnXeEcpKEiw9YBoFzJV8e_jnA'

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
