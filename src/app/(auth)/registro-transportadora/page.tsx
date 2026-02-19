import { redirect } from 'next/navigation'

interface RegistroTransportadoraPageProps {
  searchParams?: {
    next?: string
  }
}

export default function RegistroTransportadoraPage({ searchParams }: RegistroTransportadoraPageProps) {
  const next = searchParams?.next
  const target = next ? `/transportadora?next=${encodeURIComponent(next)}` : '/transportadora'
  redirect(target)
}
