import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleToUsersTable1749916800000 implements MigrationInterface {
  name = 'AddRoleToUsersTable1749916800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE user_role_enum AS ENUM ('admin', 'customer')
    `);

    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN role user_role_enum NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN role
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS user_role_enum
    `);
  }
}
