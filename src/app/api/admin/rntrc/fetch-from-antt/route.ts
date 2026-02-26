import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestRntrcFromCkanApiAsync } from '@/lib/antt/rntrc-ingestion'

export const maxDuration = 60

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
    }

    const { jobId, error } = await ingestRntrcFromCkanApiAsync()

    if (error || !jobId) {
      return NextResponse.json({ success: false, error: error ?? 'Erro ao iniciar job' }, { status: 500 })
    }

    return NextResponse.json({ success: true, jobId, message: 'Importação iniciada em background' })
  } catch (error) {
    console.error('Erro ao iniciar importação RNTRC:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro inesperado' },
      { status: 500 }
    )
  }
}
