import { TransformFnParams } from 'class-transformer';


export function digitsOnly({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.replace(/\D/g, '') : value;
}


export function upperTrim({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}
