'use client'

interface BackButtonProps {
  color?: string
  borderColor?: string
}

export function BackButton({ color = 'rgba(255,255,255,0.9)', borderColor = 'rgba(255,255,255,0.5)' }: BackButtonProps) {
  return (
    <button
      onClick={() => window.history.back()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'transparent',
        color,
        fontWeight: 700,
        fontSize: '1rem',
        padding: '0.875rem 2rem',
        borderRadius: '9999px',
        border: `2px solid ${borderColor}`,
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      ← Voltar
    </button>
  )
}
