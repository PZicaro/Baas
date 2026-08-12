import { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckoutLinkPayerDocument1786557751960 implements MigrationInterface {
  name = 'CheckoutLinkPayerDocument1786557751960';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`checkout_links\` ADD \`payer_document\` varchar(14) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`checkout_links\` DROP COLUMN \`payer_document\``);
  }
}
