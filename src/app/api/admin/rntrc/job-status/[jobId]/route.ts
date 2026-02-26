import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { jobId } = await params
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('antt_ingestion_runs')
      .select('id, status, records_imported, error_message, created_at, metadata')
      .eq('id', jobId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro inesperado' }, { status: 500 })
  }
}
