'use client'

import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: '6rem',
    }}>
      <button
        onClick={() => router.back()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'transparent',
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 700,
          fontSize: '1rem',
          padding: '0.875rem 2rem',
          borderRadius: '9999px',
          border: '2px solid rgba(255,255,255,0.5)',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'opacity 0.15s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.7')}
        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
      >
        ← Voltar
      </button>
    </div>
  )
}
