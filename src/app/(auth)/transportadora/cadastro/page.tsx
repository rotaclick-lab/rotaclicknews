import { redirect } from 'next/navigation'

interface CadastroTransportadoraPageProps {
  searchParams?: {
    next?: string
  }
}

export default function CadastroTransportadoraPage({ searchParams }: CadastroTransportadoraPageProps) {
  const next = searchParams?.next
  const target = next ? `/registro?next=${encodeURIComponent(next)}` : '/registro'
  redirect(target)
}
