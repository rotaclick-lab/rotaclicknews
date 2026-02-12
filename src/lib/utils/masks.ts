/**
 * Máscaras e validações para formulários
 */

// Máscara de CPF: 000.000.000-00
export const maskCPF = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

// Máscara de CNPJ: 00.000.000/0000-00
export const maskCNPJ = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

// Máscara de Telefone: (00) 00000-0000
export const maskPhone = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
}

// Máscara de CEP: 00000-000
export const maskCEP = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1')
}

// Máscara de Inscrição Estadual (genérica, varia por UF)
export const maskIE = (value: string, uf?: string): string => {
  const cleaned = value.replace(/\D/g, '')
  
  // Formatos específicos por UF (exemplos principais)
  switch (uf?.toUpperCase()) {
    case 'SP':
      // São Paulo: 000.000.000.000
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .substring(0, 15)
    
    case 'RJ':
      // Rio de Janeiro: 00.000.00-0
      return cleaned
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{2})(\d)/, '$1-$2')
        .substring(0, 11)
    
    case 'MG':
      // Minas Gerais: 000.000.000/0000
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .substring(0, 17)
    
    default:
      // Formato genérico
      return cleaned.substring(0, 14)
  }
}

// Máscara de RNTRC: 00000000 a 000000000000
export const maskRNTRC = (value: string): string => {
  return value.replace(/\D/g, '').substring(0, 12)
}

// Remove máscara (apenas números)
export const removeMask = (value: string): string => {
  return value.replace(/\D/g, '')
}

// Validação de CPF
export const validateCPF = (cpf: string): boolean => {
  const cleaned = removeMask(cpf)
  
  if (cleaned.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleaned)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(10))) return false
  
  return true
}

// Validação de CNPJ
export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = removeMask(cnpj)
  
  if (cleaned.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleaned)) return false
  
  let length = cleaned.length - 2
  let numbers = cleaned.substring(0, length)
  const digits = cleaned.substring(length)
  let sum = 0
  let pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false
  
  length = length + 1
  numbers = cleaned.substring(0, length)
  sum = 0
  pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false
  
  return true
}

// Validação de telefone celular brasileiro
export const validatePhone = (phone: string): boolean => {
  const cleaned = removeMask(phone)
  // Formato: DDD (2 dígitos) + 9 (celular) + 8 dígitos
  return /^[1-9]{2}9[0-9]{8}$/.test(cleaned)
}

// Formatar moeda brasileira
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Máscara de moeda para input
export const maskCurrency = (value: string): string => {
  const cleaned = value.replace(/\D/g, '')
  const number = parseFloat(cleaned) / 100
  return formatCurrency(number)
}

// Máscara de decimal (para consumo de diesel, por exemplo)
export const maskDecimal = (value: string, decimals: number = 2): string => {
  const cleaned = value.replace(/\D/g, '')
  const number = parseFloat(cleaned) / Math.pow(10, decimals)
  return number.toFixed(decimals)
}

// Validar email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Obter UF do CEP (primeiros 2 dígitos indicam a região)
export const getUFFromCEP = (cep: string): string | null => {
  const cleaned = removeMask(cep)
  if (cleaned.length < 2) return null
  
  const prefix = parseInt(cleaned.substring(0, 2))
  
  // Mapeamento aproximado (simplificado)
  if (prefix >= 1 && prefix <= 19) return 'SP'
  if (prefix >= 20 && prefix <= 28) return 'RJ'
  if (prefix >= 30 && prefix <= 39) return 'MG'
  if (prefix >= 40 && prefix <= 48) return 'BA'
  if (prefix >= 49 && prefix <= 49) return 'SE'
  if (prefix >= 50 && prefix <= 56) return 'PE'
  if (prefix >= 57 && prefix <= 57) return 'AL'
  if (prefix >= 58 && prefix <= 58) return 'PB'
  if (prefix >= 59 && prefix <= 59) return 'RN'
  if (prefix >= 60 && prefix <= 63) return 'CE'
  if (prefix >= 64 && prefix <= 64) return 'PI'
  if (prefix >= 65 && prefix <= 65) return 'MA'
  if (prefix >= 66 && prefix <= 68) return 'PA'
  if (prefix >= 69 && prefix <= 69) return 'AC'
  if (prefix >= 70 && prefix <= 72) return 'DF'
  if (prefix >= 73 && prefix <= 76) return 'GO'
  if (prefix >= 77 && prefix <= 77) return 'TO'
  if (prefix >= 78 && prefix <= 78) return 'MT'
  if (prefix >= 79 && prefix <= 79) return 'MS'
  if (prefix >= 80 && prefix <= 87) return 'PR'
  if (prefix >= 88 && prefix <= 89) return 'SC'
  if (prefix >= 90 && prefix <= 99) return 'RS'
  
  return null
}
