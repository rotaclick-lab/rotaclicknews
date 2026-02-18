'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

export default function RegistroSucessoPage() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || ''
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login'
  const [countdown, setCountdown] = useState(15)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = loginHref
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [loginHref])

  return (
    <div className="min-h-screen flex items-center justify-center font-display antialiased" style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)' }}>
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-10 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="RotaClick" width={180} height={57} priority />
          </div>

          {/* Ícone de sucesso */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="material-icons-round text-emerald-500 text-5xl">check_circle</span>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Cadastro Realizado com Sucesso!
          </h1>

          {/* Mensagem */}
          <p className="text-slate-600 mb-8 leading-relaxed">
            Enviamos um <strong>email de confirmação</strong> para o endereço informado. 
            Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
          </p>

          {/* Dicas */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left">
            <div className="flex items-start gap-3">
              <span className="material-icons-round text-amber-500 text-xl mt-0.5">info</span>
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-2">Não recebeu o email?</p>
                <ul className="text-sm text-amber-700 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="material-icons-round text-xs mt-1">arrow_right</span>
                    Verifique a pasta de <strong>spam</strong> ou <strong>lixo eletrônico</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-icons-round text-xs mt-1">arrow_right</span>
                    Aguarde alguns minutos para o email chegar
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-icons-round text-xs mt-1">arrow_right</span>
                    Certifique-se de que o email informado está correto
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botão de ir para login */}
          <Link
            href={loginHref}
            className="inline-flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-[#13b9a5] hover:bg-[#0fa899] text-white font-semibold text-lg transition-all shadow-lg shadow-[#13b9a5]/25"
          >
            <span className="material-icons-round">login</span>
            <span>Ir para o Login</span>
          </Link>

          {/* Countdown */}
          <p className="text-sm text-slate-400 mt-4">
            Redirecionando para o login em <strong className="text-slate-600">{countdown}s</strong>
          </p>

          {/* Suporte */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Precisa de ajuda? Entre em contato: <a href="mailto:suporte@rotaclick.com.br" className="text-[#13b9a5] hover:underline">suporte@rotaclick.com.br</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
