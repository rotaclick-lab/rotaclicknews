/** Mapeia um CEP (somente dígitos, 8 chars) para a UF correspondente */
export function cepToUf(cep: string): string | null {
  const n = cep.replace(/\D/g, '').padStart(8, '0')
  if (n >= '01000000' && n <= '19999999') return 'SP'
  if (n >= '20000000' && n <= '28999999') return 'RJ'
  if (n >= '29000000' && n <= '29999999') return 'ES'
  if (n >= '30000000' && n <= '39999999') return 'MG'
  if (n >= '40000000' && n <= '48999999') return 'BA'
  if (n >= '49000000' && n <= '49999999') return 'SE'
  if (n >= '50000000' && n <= '56999999') return 'PE'
  if (n >= '57000000' && n <= '57999999') return 'AL'
  if (n >= '58000000' && n <= '58999999') return 'PB'
  if (n >= '59000000' && n <= '59999999') return 'RN'
  if (n >= '60000000' && n <= '63999999') return 'CE'
  if (n >= '64000000' && n <= '64999999') return 'PI'
  if (n >= '65000000' && n <= '65999999') return 'MA'
  if (n >= '66000000' && n <= '68899999') return 'PA'
  if (n >= '68900000' && n <= '68999999') return 'AP'
  if (n >= '69000000' && n <= '69299999') return 'AM'
  if (n >= '69300000' && n <= '69399999') return 'RR'
  if (n >= '69400000' && n <= '69899999') return 'AM'
  if (n >= '69900000' && n <= '69999999') return 'AC'
  if (n >= '70000000' && n <= '73699999') return 'DF'
  if (n >= '73700000' && n <= '76799999') return 'GO'
  if (n >= '76800000' && n <= '76999999') return 'RO'
  if (n >= '77000000' && n <= '77999999') return 'TO'
  if (n >= '78000000' && n <= '78999999') return 'MT'
  if (n >= '79000000' && n <= '79999999') return 'MS'
  if (n >= '80000000' && n <= '87999999') return 'PR'
  if (n >= '88000000' && n <= '89999999') return 'SC'
  if (n >= '90000000' && n <= '99999999') return 'RS'
  return null
}

const UF_TO_REGION: Record<string, string> = {
  SP: 'sudeste', RJ: 'sudeste', MG: 'sudeste', ES: 'sudeste',
  PR: 'sul',     SC: 'sul',     RS: 'sul',
  BA: 'nordeste', SE: 'nordeste', PE: 'nordeste', AL: 'nordeste',
  PB: 'nordeste', RN: 'nordeste', CE: 'nordeste', PI: 'nordeste', MA: 'nordeste',
  AM: 'norte', PA: 'norte', RR: 'norte', AP: 'norte', AC: 'norte', RO: 'norte', TO: 'norte',
  DF: 'centro-oeste', GO: 'centro-oeste', MT: 'centro-oeste', MS: 'centro-oeste',
}

export function ufToRegion(uf: string): string | null {
  return UF_TO_REGION[uf.toUpperCase()] ?? null
}

export function cepToRegion(cep: string): string | null {
  const uf = cepToUf(cep)
  return uf ? ufToRegion(uf) : null
}
