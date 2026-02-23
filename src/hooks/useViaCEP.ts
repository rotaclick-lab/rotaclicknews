/**
 * Hook React para integração com ViaCEP
 * Fornece autocomplete de endereços e validação de CEPs
 */

import { useState, useCallback } from 'react'
import { buscarCEP } from '@/lib/viacep'

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
    // TEMPORARIAMENTE DESABILITADO ATÉ DEPLOY
    console.log('ViaCEP temporariamente desabilitado - aguardando deploy')
    return null
    
    // Validar formato do CEP
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      setError('CEP deve ter 8 dígitos')
      return null
    }

    setLoading(true)
    
    try {
      const dados = await buscarCEP(cep)
      
      if (!dados) {
        setError('CEP não encontrado')
        return null
      }

      // Converter para formato do nosso sistema
      const endereco: EnderecoViaCEP = {
        cep: dados.cep,
        logradouro: dados.logradouro || '',
        complemento: dados.complemento || '',
        bairro: dados.bairro || '',
        cidade: dados.localidade,
        estado: dados.uf
      }

      return endereco
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
