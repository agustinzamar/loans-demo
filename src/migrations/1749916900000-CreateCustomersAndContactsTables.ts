import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomersAndContactsTables1749916900000 implements MigrationInterface {
  name = 'CreateCustomersAndContactsTables1749916900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE document_type_enum AS ENUM ('dni', 'cuil', 'cuit', 'passport')
    `);

    await queryRunner.query(`
      CREATE TYPE contact_type_enum AS ENUM ('email', 'phone', 'address')
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        document_type document_type_enum NOT NULL,
        document_number VARCHAR(50) NOT NULL UNIQUE,
        user_id INTEGER NULL UNIQUE REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_customers_document 
      ON customers(document_type, document_number) 
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_customers_user_id ON customers(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_customers_deleted_at ON customers(deleted_at)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_contacts (
        id SERIAL PRIMARY KEY,
        type contact_type_enum NOT NULL,
        value VARCHAR(500) NOT NULL,
        label VARCHAR(100) NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_customer_contacts_customer_id ON customer_contacts(customer_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS customer_contacts`);
    await queryRunner.query(`DROP TABLE IF EXISTS customers`);
    await queryRunner.query(`DROP TYPE IF EXISTS contact_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS document_type_enum`);
  }
}
