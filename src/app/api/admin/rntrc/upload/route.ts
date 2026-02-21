import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestRntrcFromCsv } from '@/lib/antt/rntrc-ingestion'

export async function POST(request: Request) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ success: false, error: 'Apenas arquivos CSV são aceitos' }, { status: 400 })
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 50MB.' },
        { status: 400 }
      )
    }

    const csvText = await file.text()
    const result = await ingestRntrcFromCsv(csvText, `upload_manual_${file.name}`)

    return NextResponse.json({
      success: result.success,
      recordsImported: result.recordsImported,
      errors: result.errors.slice(0, 20),
    })
  } catch (error) {
    console.error('Erro no upload RNTRC:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro inesperado' },
      { status: 500 }
    )
  }
}
