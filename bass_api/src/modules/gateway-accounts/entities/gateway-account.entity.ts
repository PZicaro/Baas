import { Exclude } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Vínculo seguro entre um usuário do BaaS e a conta correspondente no
 * gateway Lera Box. Guarda as credenciais recebidas no cadastro
 * (CodigoCliente, ChaveLoja) e o Bearer token da sessão ativa.
 *
 * Nunca exposta ao frontend (campos sensíveis marcados com @Exclude);
 * toda comunicação com o gateway a partir do BaaS deve passar por aqui.
 */
@Entity('gateway_accounts')
export class GatewayAccount extends BaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index({ unique: true })
  @Column({ name: 'user_id' })
  userId: string;

  /** CPF ou CNPJ usado no cadastro do gateway (pode ser fictício no sandbox). */
  @Column({ length: 20 })
  documento: string;

  /** E-mail usado no cadastro público (POST /api/users) do gateway. */
  @Column({ name: 'gateway_email', length: 180 })
  gatewayEmail: string;

  @Column({ name: 'gateway_phone', length: 20 })
  gatewayPhone: string;

  /** CodigoCliente recebido por e-mail após o cadastro no gateway. */
  @Column({ name: 'codigo_cliente', length: 100 })
  codigoCliente: string;

  /** ChaveLoja recebida por e-mail após o cadastro no gateway. */
  @Column({ name: 'chave_loja', length: 100 })
  @Exclude()
  chaveLoja: string;

  /**
   * Senha do gateway, armazenada apenas para permitir novo login quando o
   * token expirar. Deve ser persistida cifrada (ver `EncryptionService`,
   * a implementar) — nunca em texto puro em produção.
   */
  @Column({ name: 'password_encrypted', type: 'text' })
  @Exclude()
  passwordEncrypted: string;

  /** Bearer token vigente, obtido em POST /api/auth/login. */
  @Column({ name: 'access_token', type: 'text', nullable: true })
  @Exclude()
  accessToken: string | null;

  @Column({ name: 'token_expires_at', type: 'datetime', nullable: true })
  tokenExpiresAt: Date | null;

  @Column({ default: true })
  active: boolean;
}
