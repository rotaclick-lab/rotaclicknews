'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Algo deu errado!</h2>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
