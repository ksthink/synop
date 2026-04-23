import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createJotting } from '@/lib/jottings'

export default async function NewJotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const jotting = await createJotting(user.id, supabase)
  redirect(`/jot/${jotting.id}`)
}
