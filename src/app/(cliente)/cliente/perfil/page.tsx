import { getClienteProfile } from '@/app/actions/cliente-profile-actions'
import { ProfileForm } from './profile-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Meu Perfil | RotaClick',
}

export default async function PerfilPage() {
  const result = await getClienteProfile()

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/cliente" className="text-slate-400 hover:text-brand-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Meu Perfil</h1>
            <p className="text-sm text-slate-500">Gerencie seus dados cadastrais</p>
          </div>
        </div>

        {result.error ? (
          <Card className="border-red-100">
            <CardContent className="py-8 text-center text-red-500">{result.error}</CardContent>
          </Card>
        ) : (
          <>
            {/* Avatar / identificação */}
            <Card className="border-0 shadow-sm">
              <CardContent className="py-5 flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center">
                  <UserCircle className="h-9 w-9 text-brand-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{result.data!.full_name || '—'}</p>
                  <p className="text-sm text-slate-500">{result.data!.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cliente desde {new Date(result.data!.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <ProfileForm initialData={result.data!} />
          </>
        )}
      </div>
    </div>
  )
}
