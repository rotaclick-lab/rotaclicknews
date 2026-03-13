'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Lendo estrutura do arquivo', sub: 'Identificando colunas, separadores e encoding...' , duration: 2200 },
  { id: 2, label: 'Tokenizando tabela com GPT-4o', sub: 'Convertendo conteúdo em tokens para o modelo...', duration: 2800 },
  { id: 3, label: 'Extraindo faixas de frete', sub: 'Localizando origens, destinos, pesos e preços...', duration: 3500 },
  { id: 4, label: 'Normalizando CEPs e regiões', sub: 'Padronizando códigos postais para 8 dígitos...', duration: 2000 },
  { id: 5, label: 'Consultando base de mercado', sub: 'Comparando com rotas ativas na plataforma...', duration: 2500 },
  { id: 6, label: 'Calculando benchmark de preços', sub: 'Analisando média por região origem/destino...', duration: 2200 },
  { id: 7, label: 'Sugerindo margens RotaClick', sub: 'Aplicando modelo de precificação inteligente...', duration: 2000 },
  { id: 8, label: 'Validando consistência dos dados', sub: 'Verificando integridade das faixas extraídas...', duration: 1800 },
  { id: 9, label: 'Finalizando análise', sub: 'Preparando resultado para revisão...', duration: 1200 },
]

const FLOATING_NUMBERS = [
  'R$ 2.1847', '0800-0999', 'R$ 45.00', '87%', 'SP → MG',
  'R$ 1.9230', '0100-0199', 'R$ 38.50', '92%', 'RJ → RS',
  'R$ 3.4100', '6900-6999', 'markup +22%', 'R$ 67.80', 'CE → AM',
  'R$ 1.7560', '0300-0399', '↑ 14%', 'R$ 29.90', 'PR → BA',
  '01310-100', 'R$ 1.3280', 'weight 25kg', '30140-071', 'R$ 89.00',
  'deadline 3d', 'R$ 2.6640', '↓ 8%', '88010-001', 'R$ 55.20',
]

interface FloatingItem {
  id: number
  text: string
  x: number
  y: number
  delay: number
  speed: number
  opacity: number
}

export function AnalyzingOverlay({ filename }: { filename: string }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [progress, setProgress] = useState(0)
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([])
  const [scanLine, setScanLine] = useState(0)
  const [glitchActive, setGlitchActive] = useState(false)
  const [tick, setTick] = useState(0)
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setFloatingItems(
      FLOATING_NUMBERS.map((text, i) => ({
        id: i,
        text,
        x: Math.random() * 88 + 4,
        y: Math.random() * 85 + 5,
        delay: Math.random() * 4,
        speed: 7 + Math.random() * 9,
        opacity: 0.08 + Math.random() * 0.16,
      }))
    )
  }, [])

  useEffect(() => {
    const raf = setInterval(() => {
      setScanLine(prev => (prev >= 100 ? 0 : prev + 0.5))
      setTick(prev => prev + 1)
    }, 30)
    return () => clearInterval(raf)
  }, [])

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 160)
    }, 3200 + Math.random() * 2400)
    return () => clearInterval(glitchInterval)
  }, [])

  useEffect(() => {
    const totalDuration = STEPS.reduce((a, s) => a + s.duration, 0)
    let stepIdx = 0
    let elapsed = 0

    const advance = () => {
      if (stepIdx >= STEPS.length) return
      const step = STEPS[stepIdx]
      if (!step) return
      setCurrentStep(stepIdx)
      const prevElapsed = elapsed
      elapsed += step.duration
      const progressStart = Math.round((prevElapsed / totalDuration) * 100)
      const progressEnd = Math.round((elapsed / totalDuration) * 100)
      const delta = progressEnd - progressStart
      if (delta > 0) {
        let p = progressStart
        const inc = setInterval(() => {
          p = Math.min(p + 1, progressEnd)
          setProgress(p)
          if (p >= progressEnd) clearInterval(inc)
        }, step.duration / delta)
      }
      stepTimerRef.current = setTimeout(() => {
        setCompletedSteps(prev => [...prev, stepIdx])
        stepIdx++
        if (stepIdx < STEPS.length) advance()
      }, step.duration)
    }

    advance()
    return () => { if (stepTimerRef.current) clearTimeout(stepTimerRef.current) }
  }, [])

  const orbs = [
    { angle: (tick * 0.8) % 360, color: 'bg-orange-500', glow: '0 0 10px 4px rgba(249,115,22,0.7)', r: 108 },
    { angle: ((tick * 0.5) + 120) % 360, color: 'bg-amber-400', glow: '0 0 8px 3px rgba(251,191,36,0.6)', r: 108 },
    { angle: ((tick * 0.3) + 240) % 360, color: 'bg-orange-300', glow: '0 0 7px 2px rgba(253,186,116,0.5)', r: 108 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/96 backdrop-blur-sm overflow-hidden">

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
        }}
      />

      {/* Floating numbers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingItems.map(item => (
          <span
            key={item.id}
            className="absolute font-mono text-orange-400 select-none"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              opacity: item.opacity,
              fontSize: '11px',
              letterSpacing: '0.06em',
              animation: `floatUp ${item.speed}s ${item.delay}s ease-in-out infinite alternate`,
            }}
          >
            {item.text}
          </span>
        ))}
      </div>

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          top: `${scanLine}%`,
          background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.35), rgba(249,115,22,0.6), rgba(249,115,22,0.35), transparent)',
          boxShadow: '0 0 8px rgba(249,115,22,0.3)',
          transition: 'top 0.03s linear',
        }}
      />

      {/* Main container */}
      <div className="relative w-full max-w-lg mx-4 z-10">

        {/* Orbiting dots */}
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none" style={{ top: '-30px' }}>
          {orbs.map((orb, i) => {
            const rad = (orb.angle * Math.PI) / 180
            const x = Math.cos(rad) * orb.r
            const y = Math.sin(rad) * orb.r
            return (
              <div
                key={i}
                className={cn('absolute w-2.5 h-2.5 rounded-full', orb.color)}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  boxShadow: orb.glow,
                  transition: 'transform 0.03s linear',
                }}
              />
            )
          })}
        </div>

        {/* Card */}
        <div
          className={cn(
            'relative rounded-2xl border bg-gray-900/95 shadow-2xl overflow-hidden p-8 transition-transform duration-75',
            glitchActive ? 'translate-x-[2px]' : 'translate-x-0',
          )}
          style={{
            borderColor: 'rgba(249,115,22,0.25)',
            boxShadow: '0 0 70px rgba(249,115,22,0.12), 0 0 140px rgba(249,115,22,0.05), inset 0 0 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* Top line */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #f97316, #fbbf24, #f97316, transparent)' }} />

          {/* Header */}
          <div className="text-center mb-7">
            <div className="relative inline-flex items-center justify-center mb-5">
              <div className="absolute w-24 h-24 rounded-full bg-orange-500/8 animate-ping" style={{ animationDuration: '2.2s' }} />
              <div className="absolute w-18 h-18 rounded-full bg-orange-500/12 animate-ping" style={{ animationDuration: '2.8s', animationDelay: '0.5s' }} />
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #fbbf24)',
                  boxShadow: '0 0 30px rgba(249,115,22,0.55), 0 0 60px rgba(249,115,22,0.2)',
                }}
              >
                <svg
                  className="w-8 h-8 text-white"
                  style={{ animation: 'spin 3s linear infinite' }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
            </div>

            <h2
              className={cn(
                'text-2xl font-bold text-white mb-1.5 transition-colors duration-75',
                glitchActive && 'text-orange-300',
              )}
              style={{ textShadow: '0 0 24px rgba(249,115,22,0.45)' }}
            >
              IA Analisando Tabela
            </h2>
            <p className="text-gray-500 text-xs font-mono truncate max-w-[300px] mx-auto" title={filename}>
              {filename}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-mono uppercase tracking-widest">Progresso</span>
              <span className="text-sm font-bold font-mono text-orange-400">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #ea580c, #f97316, #fbbf24)',
                  boxShadow: '0 0 12px rgba(249,115,22,0.7)',
                  transition: 'width 0.3s ease',
                }}
              >
                <div
                  className="absolute inset-0 bg-white/25"
                  style={{ animation: 'shimmer 1.6s ease-in-out infinite' }}
                />
              </div>
            </div>
          </div>

          {/* Steps list */}
          <div className="space-y-1.5">
            {STEPS.map((step, idx) => {
              const isCompleted = completedSteps.includes(idx)
              const isCurrent = currentStep === idx && !isCompleted
              const isPending = !isCompleted && !isCurrent

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-400',
                    isCurrent && 'bg-orange-500/10 border border-orange-500/20',
                    isCompleted && 'opacity-40',
                    isPending && 'opacity-15',
                  )}
                >
                  {/* Icon */}
                  <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent"
                        style={{ animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-700 flex items-center justify-center">
                        <span className="text-[9px] text-gray-700 font-mono">{idx + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'text-sm font-medium leading-snug',
                      isCompleted ? 'text-gray-600' : isCurrent ? 'text-white' : 'text-gray-700',
                    )}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[11px] text-orange-400/60 mt-0.5 font-mono" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                        {step.sub}
                      </p>
                    )}
                  </div>

                  {/* Bounce dots */}
                  {isCurrent && (
                    <div className="shrink-0 flex gap-0.5 items-center">
                      {[0, 1, 2].map(d => (
                        <div
                          key={d}
                          className="w-1 h-1 rounded-full bg-orange-400"
                          style={{ animation: `bounce 0.9s ${d * 0.15}s ease-in-out infinite` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span className="text-[11px] text-gray-600 font-mono">GPT-4o conectado</span>
            </div>
            <span className="text-[11px] text-gray-700 font-mono tabular-nums">
              {(tick % 200 + 800).toFixed(0)} tokens/s
            </span>
          </div>

          {/* Bottom line */}
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent)' }} />
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0px)   translateX(0px);  }
          33%  { transform: translateY(-14px) translateX(5px);  }
          66%  { transform: translateY(-6px)  translateX(-4px); }
          100% { transform: translateY(-20px) translateX(3px);  }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(220%);  }
        }
        @keyframes spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);    }
          50%       { transform: translateY(-4px); }
        }
        @keyframes ping {
          0%   { transform: scale(1);    opacity: 0.75; }
          75%, 100% { transform: scale(2); opacity: 0;    }
        }
      `}</style>
    </div>
  )
}
