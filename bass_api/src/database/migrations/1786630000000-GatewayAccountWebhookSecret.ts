import { MigrationInterface, QueryRunner } from 'typeorm';

export class GatewayAccountWebhookSecret1786630000000 implements MigrationInterface {
  name = 'GatewayAccountWebhookSecret1786630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`gateway_accounts\` ADD \`webhook_secret_encrypted\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`gateway_accounts\` DROP COLUMN \`webhook_secret_encrypted\``,
    );
  }
}
