/**
 * Componente de Input CEP com autocomplete ViaCEP
 * Formata automaticamente e busca endereço completo
 */

'use client'

import { useState, useEffect } from 'react'
import { Input } from './input'
import { useViaCEP, type EnderecoViaCEP } from '@/hooks/useViaCEP'

interface CepInputProps {
  value: string
  onChange: (value: string) => void
  onAddressFound?: (endereco: EnderecoViaCEP) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  name?: string
  required?: boolean
}

export function CepInput({
  value,
  onChange,
  onAddressFound,
  placeholder = '00000-000',
  disabled = false,
  className = '',
  id,
  name,
  required = false
}: CepInputProps) {
  const { buscarEndereco, loading, error, limparErro } = useViaCEP()
  const [buscaFeita, setBuscaFeita] = useState(false)

  // Formatar CEP enquanto digita
  const formatarCEP = (valor: string) => {
    const numeros = valor.replace(/\D/g, '')
    if (numeros.length <= 5) {
      return numeros
    }
    return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`
  }

  // Lidar com mudança no valor
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarCEP(e.target.value)
    onChange(valorFormatado)
    
    // Limpar estado de busca se o CEP mudar
    if (buscaFeita && valorFormatado.length < 9) {
      setBuscaFeita(false)
      limparErro()
    }
  }

  // Buscar endereço quando CEP estiver completo
  useEffect(() => {
    const cepLimpo = value.replace(/\D/g, '')
    
    if (cepLimpo.length === 8 && !buscaFeita && !disabled) {
      setBuscaFeita(true)
      
      buscarEndereco(value).then(endereco => {
        if (endereco && onAddressFound) {
          onAddressFound(endereco)
        }
      })
    }
  }, [value, buscaFeita, disabled, onAddressFound, buscarEndereco])

  return (
    <div className="space-y-2">
      <Input
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        maxLength={9}
        required={required}
      />
      
      {loading && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          Buscando endereço...
        </p>
      )}
      
      {error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  )
}
