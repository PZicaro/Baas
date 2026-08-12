/**
 * Máscara progressiva de CPF/CNPJ — troca de formato sozinha conforme a
 * quantidade de dígitos (até 11 vira CPF, acima disso vira CNPJ). O valor
 * mascarado é só visual: o backend normaliza (remove pontuação) antes de
 * validar/enviar ao gateway, então tanto faz o formato exato que sobra aqui.
 */
export function maskCpfCnpj(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}
