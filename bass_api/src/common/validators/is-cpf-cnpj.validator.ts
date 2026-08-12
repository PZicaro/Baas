import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Valida o dígito verificador de CPF (11) ou CNPJ (14). "Fictício" no
 * sandbox do gateway (ver desafio) significa uma entidade que não existe
 * de verdade — não uma sequência de dígitos qualquer: o gateway valida o
 * checksum e rejeita documentos com dígito verificador incorreto (com um
 * 400 genérico, sem detalhar o motivo).
 */
function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;

  const nums = digits.split('').map(Number);
  const calcDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += nums[i] * (length + 1 - i);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calcDigit(9) === nums[9] && calcDigit(10) === nums[10];
}

function isValidCnpj(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;

  const nums = digits.split('').map(Number);
  const calcDigit = (length: number): number => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = nums.slice(0, length).reduce((acc, digit, i) => acc + digit * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calcDigit(12) === nums[12] && calcDigit(13) === nums[13];
}

export function isValidCpfOrCnpj(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}

/** Aplique depois de @Transform(digitsOnly) — espera receber só dígitos. */
export function IsCpfOrCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCpfOrCnpj',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: isValidCpfOrCnpj,
        defaultMessage: () =>
          'document deve ser um CPF ou CNPJ válido (dígito verificador incorreto)',
      },
    });
  };
}
