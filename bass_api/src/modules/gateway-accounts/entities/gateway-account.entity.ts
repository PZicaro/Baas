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
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  /** CPF ou CNPJ usado no cadastro do gateway (pode ser fictício no sandbox). */
  @Column({ length: 20 })
  documento: string;

  /**
   * E-mail/telefone usados no cadastro público (POST /api/users) do gateway.
   * Nullable porque o login (POST /api/auth/login) pode acontecer numa
   * sessão separada do cadastro, sem esses dados à mão.
   */
  @Column({ name: 'gateway_email', type: 'varchar', length: 180, nullable: true })
  gatewayEmail: string | null;

  @Column({ name: 'gateway_phone', type: 'varchar', length: 20, nullable: true })
  gatewayPhone: string | null;

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

  /**
   * Segredo usado no cadastro dos webhooks (POST /api/webhooks) deste
   * lojista no gateway — gerado uma vez por conta e cifrado do mesmo jeito
   * que `passwordEncrypted`. É com ele que validamos X-Lera-Box-Signature
   * nos callbacks recebidos.
   */
  @Column({ name: 'webhook_secret_encrypted', type: 'text', nullable: true })
  @Exclude()
  webhookSecretEncrypted: string | null;
}
