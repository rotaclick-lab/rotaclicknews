import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestRntrcFromCkanApi } from '@/lib/antt/rntrc-ingestion'

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

    const result = await ingestRntrcFromCkanApi()

    return NextResponse.json({
      success: result.success,
      recordsImported: result.recordsImported,
      errors: result.errors.slice(0, 20),
    })
  } catch (error) {
    console.error('Erro ao buscar RNTRC da ANTT:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro inesperado' },
      { status: 500 }
    )
  }
}
