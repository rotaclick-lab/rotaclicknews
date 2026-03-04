'use client'

import { useState } from 'react'
import { Download, FileText, Loader2, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProofViewerProps {
  freightId: string
  proofCount: number
}

interface SignedProof {
  path: string
  url: string | null
}

function isImage(path: string) {
  return /\.(jpg|jpeg|png|webp)$/i.test(path)
}

export function ProofViewer({ freightId, proofCount }: ProofViewerProps) {
  const [loading, setLoading] = useState(false)
  const [proofs, setProofs] = useState<SignedProof[] | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/freights/${freightId}/proof`)
      const json = await res.json()
      if (json.success) setProofs(json.proofs)
    } finally {
      setLoading(false)
    }
  }

  if (proofCount === 0) return null

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-slate-300"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightbox}
            alt="Comprovante"
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="mt-3 border-t border-slate-100 pt-3">
        {proofs === null ? (
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={load}
            className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5"
          >
            {loading ? (
              <><Loader2 className="h-3 w-3 animate-spin" />Carregando…</>
            ) : (
              <><CheckCircle2 className="h-3 w-3" />Ver comprovante{proofCount > 1 ? 's' : ''} ({proofCount})</>
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">
              Comprovante{proofs.length > 1 ? 's' : ''} de entrega:
            </p>
            <div className="flex flex-wrap gap-2">
              {proofs.map((p, i) =>
                p.url ? (
                  isImage(p.path) ? (
                    <div key={p.path} className="relative group">
                      <img
                        src={p.url}
                        alt={`Comprovante ${i + 1}`}
                        className="h-20 w-20 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightbox(p.url!)}
                      />
                      <a
                        href={p.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-1 right-1 bg-black/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Baixar"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <a
                      key={p.path}
                      href={p.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-red-500" />
                      PDF {i + 1}
                      <Download className="h-3 w-3 text-slate-400" />
                    </a>
                  )
                ) : null
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
