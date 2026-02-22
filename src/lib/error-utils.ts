/**
 * Tratamento amigável de erros para server actions
 * Converte erros técnicos em mensagens compreensíveis para o usuário
 */

export function getFriendlyError(error: any, context: string): string {
  if (!error) return 'Erro desconhecido'
  
  // Database constraint errors
  if (error.code === '23505') {
    return 'Este registro já existe. Verifique os dados ou use outra informação.'
  }
  if (error.code === '23514') {
    return 'Dados inválidos. Verifique se todos os campos obrigatórios foram preenchidos corretamente.'
  }
  if (error.code === '23503') {
    return 'Referência inválida. Verifique se os dados relacionados existem.'
  }
  if (error.code === '42501') {
    return 'Você não tem permissão para realizar esta operação.'
  }
  if (error.code === '23502') {
    return 'Campo obrigatório não preenchido. Verifique todos os campos marcados como *.'
  }
  
  // Supabase Auth errors
  if (error.message?.includes('already been registered') || error.message?.includes('already registered')) {
    return 'Este email já está cadastrado. Tente fazer login.'
  }
  if (error.message?.includes('password')) {
    return 'A senha deve ter pelo menos 8 caracteres.'
  }
  if (error.message?.includes('email')) {
    return 'Email inválido. Verifique o endereço digitado.'
  }
  if (error.message?.includes('Invalid login')) {
    return 'Email ou senha incorretos. Verifique seus dados e tente novamente.'
  }
  if (error.message?.includes('Email not confirmed')) {
    return 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.'
  }
  
  // Storage errors
  if (error.message?.includes('bucket') || error.message?.includes('storage')) {
    return 'Erro ao fazer upload de arquivo. Tente novamente com um arquivo menor ou formato diferente.'
  }
  if (error.message?.includes('file size') || error.message?.includes('too large')) {
    return 'Arquivo muito grande. O tamanho máximo permitido é 10MB.'
  }
  if (error.message?.includes('format') || error.message?.includes('mime')) {
    return 'Formato de arquivo não suportado. Use PDF, PNG ou JPG.'
  }
  
  // Network/timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('network')) {
    return 'Conexão instável. Verifique sua internet e tente novamente.'
  }
  if (error.message?.includes('fetch') || error.message?.includes('ENOTFOUND')) {
    return 'Erro de conexão com o servidor. Tente novamente em alguns instantes.'
  }
  
  // Validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return 'Dados inválidos. Verifique as informações e tente novamente.'
  }
  
  // Rate limiting
  if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
  }
  
  // Default with context
  const contextMessages: Record<string, string> = {
    'auth': 'Erro na autenticação',
    'login': 'Erro ao fazer login',
    'register': 'Erro no cadastro',
    'profile': 'Erro ao atualizar perfil',
    'password': 'Erro ao alterar senha',
    'company': 'Erro ao cadastrar empresa',
    'carrier': 'Erro ao cadastrar transportadora',
    'freight': 'Erro ao processar frete',
    'quote': 'Erro na cotação',
    'payment': 'Erro no pagamento',
    'stripe': 'Erro no processamento do pagamento',
    'upload': 'Erro ao fazer upload de arquivo',
    'terms': 'Erro ao registrar termos',
    'notification': 'Erro ao enviar notificação',
    'email': 'Erro ao enviar email',
    'audit': 'Erro ao registrar auditoria',
    'rntrc': 'Erro ao consultar RNTRC',
    'address': 'Erro ao buscar endereço',
    'cep': 'Erro ao consultar CEP'
  }
  
  const prefix = contextMessages[context] || 'Erro'
  return `${prefix}: ${error.message || 'Tente novamente.'}`
}

/**
 * Wrapper para server actions com tratamento de erro padrão
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error: any) {
      console.error(`[${context}] Error:`, error)
      throw new Error(getFriendlyError(error, context))
    }
  }
}
