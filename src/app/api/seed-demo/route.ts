import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { DEMO_USERS } from '@/lib/demo-users'

export async function POST() {
  try {
    console.log('Starting aggressive demo seed...')
    const allUsers = [DEMO_USERS.manager, ...DEMO_USERS.executives]
    
    // 1. Get current users to find IDs for deletion
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    // 2. Delete existing demo users to ensure clean state
    for (const demoUser of allUsers) {
      const existing = listData.users.filter(u => u.email === demoUser.email)
      for (const u of existing) {
        console.log(`Deleting existing user: ${u.email} (${u.id})`)
        await supabaseAdmin.auth.admin.deleteUser(u.id)
      }
    }

    // 3. Recreate users fresh
    for (const user of allUsers) {
      console.log(`Creating user: ${user.email}`)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role
        }
      })

      if (createError) {
        console.error(`Error creating user ${user.email}:`, createError)
        continue
      }

      if (newUser?.user) {
        console.log(`Successfully created ${user.email}, updating profile...`)
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
          id: newUser.user.id,
          full_name: user.full_name,
          role: user.role
        })
        if (profileError) console.error(`Error updating profile for ${user.email}:`, profileError)
      }
    }

    return NextResponse.json({ success: true, message: 'Demo users re-seeded aggressively' })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
