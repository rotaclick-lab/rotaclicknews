'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { updateClienteAvatar } from '@/app/actions/cliente-profile-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, CheckCircle2, Loader2, UserCircle } from 'lucide-react'

const PRESET_AVATARS = [
  '/avatars/avatar-1.svg',
  '/avatars/avatar-2.svg',
  '/avatars/avatar-3.svg',
  '/avatars/avatar-4.svg',
  '/avatars/avatar-5.svg',
  '/avatars/avatar-6.svg',
]

interface Props {
  currentAvatar: string
  userName: string
}

export function AvatarPicker({ currentAvatar, userName }: Props) {
  const [selected, setSelected] = useState(currentAvatar)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handlePreset = async (url: string) => {
    setSelected(url)
    setSaving(true)
    const result = await updateClienteAvatar(url)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Avatar atualizado!')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.')
      return
    }

    setUploading(true)
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/cliente/avatar', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json.error ?? 'Erro ao enviar foto.')
      } else {
        setSelected(json.url)
        toast.success('Foto de perfil atualizada!')
      }
    } catch {
      toast.error('Erro de conexão ao enviar foto.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const isPreset = PRESET_AVATARS.includes(selected)
  const isUpload = selected && !isPreset

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
          <Camera className="h-4 w-4 text-brand-500" />
          Foto de Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Avatar atual */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {selected ? (
              <Image
                src={selected}
                alt="Avatar"
                width={72}
                height={72}
                className="w-18 h-18 rounded-full object-cover border-2 border-brand-200"
                unoptimized={selected.startsWith('http')}
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-brand-100 flex items-center justify-center border-2 border-brand-200">
                {initials ? (
                  <span className="text-xl font-bold text-brand-600">{initials}</span>
                ) : (
                  <UserCircle className="h-10 w-10 text-brand-400" />
                )}
              </div>
            )}
            {(saving || uploading) && (
              <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-brand-200 text-brand-700 hover:bg-brand-50 text-xs"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || saving}
            >
              {uploading ? (
                <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Enviando...</>
              ) : (
                <><Camera className="mr-1.5 h-3 w-3" />Enviar foto</>
              )}
            </Button>
            <p className="text-[11px] text-slate-400">JPG, PNG ou WebP · máx. 5MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Avatares pré-definidos */}
        <div>
          <p className="text-xs text-slate-500 mb-3 font-medium">Ou escolha um avatar:</p>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_AVATARS.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => handlePreset(url)}
                disabled={saving || uploading}
                className={`relative rounded-full overflow-hidden transition-all ring-2 ${
                  selected === url
                    ? 'ring-brand-500 scale-110'
                    : 'ring-transparent hover:ring-brand-200 hover:scale-105'
                }`}
                title={`Avatar ${i + 1}`}
              >
                <Image
                  src={url}
                  alt={`Avatar ${i + 1}`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
                {selected === url && (
                  <div className="absolute bottom-0 right-0 bg-brand-500 rounded-full p-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {isUpload && (
          <p className="text-xs text-brand-600 font-medium">
            ✓ Usando sua foto personalizada
          </p>
        )}
      </CardContent>
    </Card>
  )
}
