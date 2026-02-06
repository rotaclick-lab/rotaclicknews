'use client'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl mb-4">Página não encontrada</h2>
        <a href="/" className="text-primary hover:underline">
          Voltar para o início
        </a>
      </div>
    </div>
  );
}
