/**
 * Hook React para integração com ViaCEP
 * Fornece autocomplete de endereços e validação de CEPs
 */

import { useState, useCallback } from 'react'
import { buscarCEP } from '@/lib/brasilapi-integration'

export interface EnderecoViaCEP {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

export interface UseViaCEPReturn {
  buscarEndereco: (cep: string) => Promise<EnderecoViaCEP | null>
  loading: boolean
  error: string | null
  limparErro: () => void
}

export function useViaCEP(): UseViaCEPReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const limparErro = useCallback(() => {
    setError(null)
  }, [])

  const buscarEndereco = useCallback(async (cep: string): Promise<EnderecoViaCEP | null> => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      setError('CEP deve ter 8 dígitos')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const dados = await buscarCEP(cepLimpo)

      if (!dados) {
        setError('CEP não encontrado')
        return null
      }

      return {
        cep: dados.cep,
        logradouro: dados.logradouro || '',
        complemento: dados.complemento || '',
        bairro: dados.bairro || '',
        cidade: dados.localidade,
        estado: dados.uf
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err)
      setError('Erro ao buscar CEP. Tente novamente.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    buscarEndereco,
    loading,
    error,
    limparErro
  }
}
