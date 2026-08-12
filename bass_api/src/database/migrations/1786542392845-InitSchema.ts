import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1786542392845 implements MigrationInterface {
  name = 'InitSchema1786542392845';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`webhook_events\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`event_type\` enum ('PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL') NOT NULL, \`external_event_id\` varchar(150) NULL, \`payload_hash\` varchar(64) NOT NULL, \`signature\` varchar(255) NULL, \`signature_valid\` tinyint NULL, \`payload\` json NOT NULL, \`processed\` tinyint NOT NULL DEFAULT 0, \`processed_at\` datetime NULL, \`error\` text NULL, INDEX \`IDX_e96e7e870c7183b7b601359a07\` (\`external_event_id\`), INDEX \`IDX_9a211cd477d8cc321cc318de65\` (\`payload_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(150) NOT NULL, \`email\` varchar(180) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`role\` enum ('admin', 'user') NOT NULL DEFAULT 'user', \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`withdrawals\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NOT NULL, \`gateway_withdrawal_id\` varchar(100) NULL, \`amount\` int NOT NULL, \`pix_key\` varchar(150) NULL, \`destination_account\` json NULL, \`status\` enum ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED') NOT NULL DEFAULT 'PENDING', \`requested_at\` datetime NOT NULL, \`processed_at\` datetime NULL, \`raw_response\` json NULL, INDEX \`IDX_0bd35ddb3acfb323ae3e024d2f\` (\`user_id\`), UNIQUE INDEX \`IDX_7461ce97d1b45857d4ac88a99f\` (\`gateway_withdrawal_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`checkout_links\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NOT NULL, \`slug\` varchar(40) NOT NULL, \`method\` enum ('pix', 'card') NOT NULL, \`amount\` int NOT NULL, \`description\` varchar(255) NULL, \`payer_name\` varchar(150) NULL, \`payer_email\` varchar(180) NULL, \`payer_phone\` varchar(20) NULL, \`installments\` int NULL, \`fee_percent\` decimal(5,2) NULL, \`external_reference\` varchar(100) NOT NULL, \`status\` enum ('ACTIVE', 'EXPIRED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE', \`expires_at\` datetime NULL, INDEX \`IDX_bb1de397a5896527ac6336b6cd\` (\`user_id\`), UNIQUE INDEX \`IDX_0286203fdc3f8109a3f3f4b167\` (\`slug\`), UNIQUE INDEX \`IDX_9964632142499d5ca4fde5c292\` (\`external_reference\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`orders\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`checkout_link_id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`method\` enum ('pix', 'card') NOT NULL, \`amount\` int NOT NULL, \`installments\` int NULL, \`fee_percent\` decimal(5,2) NULL, \`status\` enum ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING', \`external_reference\` varchar(100) NOT NULL, \`gateway_payment_id\` varchar(100) NULL, \`gateway_txid\` varchar(100) NULL, \`qr_code_base64\` longtext NULL, \`emv\` text NULL, \`raw_response\` json NULL, \`paid_at\` datetime NULL, INDEX \`IDX_d0603b3a3b68935fdfbfc45af7\` (\`checkout_link_id\`), INDEX \`IDX_a922b820eeef29ac1c6800e826\` (\`user_id\`), INDEX \`IDX_329868121e92be672262efea85\` (\`external_reference\`), INDEX \`IDX_20240295c7bdb45e9203747c99\` (\`gateway_payment_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`gateway_accounts\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NOT NULL, \`documento\` varchar(20) NOT NULL, \`gateway_email\` varchar(180) NOT NULL, \`gateway_phone\` varchar(20) NOT NULL, \`codigo_cliente\` varchar(100) NOT NULL, \`chave_loja\` varchar(100) NOT NULL, \`password_encrypted\` text NOT NULL, \`access_token\` text NULL, \`token_expires_at\` datetime NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_a2c3e2b592f5d648852e92644c\` (\`user_id\`), UNIQUE INDEX \`REL_a2c3e2b592f5d648852e92644c\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`transactions\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NOT NULL, \`order_id\` varchar(36) NULL, \`gateway_transaction_id\` varchar(100) NOT NULL, \`type\` enum ('PIX', 'CARD', 'WITHDRAWAL', 'FEE', 'OTHER') NOT NULL, \`status\` enum ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED', 'CANCELLED') NOT NULL, \`amount\` int NOT NULL, \`external_reference\` varchar(100) NULL, \`raw_payload\` json NULL, \`occurred_at\` datetime NULL, INDEX \`IDX_e9acc6efa76de013e8c1553ed2\` (\`user_id\`), UNIQUE INDEX \`IDX_16a92060f6215782287f05453f\` (\`gateway_transaction_id\`), INDEX \`IDX_4ef0fc5306621274956d163a17\` (\`external_reference\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`withdrawals\` ADD CONSTRAINT \`FK_0bd35ddb3acfb323ae3e024d2f8\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`checkout_links\` ADD CONSTRAINT \`FK_bb1de397a5896527ac6336b6cdd\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_d0603b3a3b68935fdfbfc45af7b\` FOREIGN KEY (\`checkout_link_id\`) REFERENCES \`checkout_links\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_a922b820eeef29ac1c6800e826a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gateway_accounts\` ADD CONSTRAINT \`FK_a2c3e2b592f5d648852e92644c5\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_e9acc6efa76de013e8c1553ed2b\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_3cb0558ed36997f1d9ecc1118e7\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_3cb0558ed36997f1d9ecc1118e7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_e9acc6efa76de013e8c1553ed2b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`gateway_accounts\` DROP FOREIGN KEY \`FK_a2c3e2b592f5d648852e92644c5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_a922b820eeef29ac1c6800e826a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_d0603b3a3b68935fdfbfc45af7b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`checkout_links\` DROP FOREIGN KEY \`FK_bb1de397a5896527ac6336b6cdd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`withdrawals\` DROP FOREIGN KEY \`FK_0bd35ddb3acfb323ae3e024d2f8\``,
    );
    await queryRunner.query(`DROP INDEX \`IDX_4ef0fc5306621274956d163a17\` ON \`transactions\``);
    await queryRunner.query(`DROP INDEX \`IDX_16a92060f6215782287f05453f\` ON \`transactions\``);
    await queryRunner.query(`DROP INDEX \`IDX_e9acc6efa76de013e8c1553ed2\` ON \`transactions\``);
    await queryRunner.query(`DROP TABLE \`transactions\``);
    await queryRunner.query(
      `DROP INDEX \`REL_a2c3e2b592f5d648852e92644c\` ON \`gateway_accounts\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a2c3e2b592f5d648852e92644c\` ON \`gateway_accounts\``,
    );
    await queryRunner.query(`DROP TABLE \`gateway_accounts\``);
    await queryRunner.query(`DROP INDEX \`IDX_20240295c7bdb45e9203747c99\` ON \`orders\``);
    await queryRunner.query(`DROP INDEX \`IDX_329868121e92be672262efea85\` ON \`orders\``);
    await queryRunner.query(`DROP INDEX \`IDX_a922b820eeef29ac1c6800e826\` ON \`orders\``);
    await queryRunner.query(`DROP INDEX \`IDX_d0603b3a3b68935fdfbfc45af7\` ON \`orders\``);
    await queryRunner.query(`DROP TABLE \`orders\``);
    await queryRunner.query(`DROP INDEX \`IDX_9964632142499d5ca4fde5c292\` ON \`checkout_links\``);
    await queryRunner.query(`DROP INDEX \`IDX_0286203fdc3f8109a3f3f4b167\` ON \`checkout_links\``);
    await queryRunner.query(`DROP INDEX \`IDX_bb1de397a5896527ac6336b6cd\` ON \`checkout_links\``);
    await queryRunner.query(`DROP TABLE \`checkout_links\``);
    await queryRunner.query(`DROP INDEX \`IDX_7461ce97d1b45857d4ac88a99f\` ON \`withdrawals\``);
    await queryRunner.query(`DROP INDEX \`IDX_0bd35ddb3acfb323ae3e024d2f\` ON \`withdrawals\``);
    await queryRunner.query(`DROP TABLE \`withdrawals\``);
    await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP INDEX \`IDX_9a211cd477d8cc321cc318de65\` ON \`webhook_events\``);
    await queryRunner.query(`DROP INDEX \`IDX_e96e7e870c7183b7b601359a07\` ON \`webhook_events\``);
    await queryRunner.query(`DROP TABLE \`webhook_events\``);
  }
}
