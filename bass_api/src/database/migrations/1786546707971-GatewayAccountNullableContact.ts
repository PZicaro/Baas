import { MigrationInterface, QueryRunner } from 'typeorm';

export class GatewayAccountNullableContact1786546707971 implements MigrationInterface {
  name = 'GatewayAccountNullableContact1786546707971';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`gateway_accounts\` CHANGE \`gateway_email\` \`gateway_email\` varchar(180) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gateway_accounts\` CHANGE \`gateway_phone\` \`gateway_phone\` varchar(20) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`gateway_accounts\` CHANGE \`gateway_phone\` \`gateway_phone\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gateway_accounts\` CHANGE \`gateway_email\` \`gateway_email\` varchar(180) NOT NULL`,
    );
  }
}
