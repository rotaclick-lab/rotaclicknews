import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestRntrcFromStorageAsync } from '@/lib/antt/rntrc-ingestion'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
    }

    const body = await request.json() as { storagePath?: string }
    if (!body.storagePath) {
      return NextResponse.json({ success: false, error: 'storagePath é obrigatório' }, { status: 400 })
    }

    const { jobId, error } = await ingestRntrcFromStorageAsync(body.storagePath)
    if (error || !jobId) {
      return NextResponse.json({ success: false, error: error ?? 'Erro ao iniciar job' }, { status: 500 })
    }

    return NextResponse.json({ success: true, jobId, message: 'Processamento iniciado em background' })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Erro inesperado' },
      { status: 500 }
    )
  }
}
