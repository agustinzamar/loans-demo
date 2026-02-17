import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameLoanInterestColumns1749920400000
  implements MigrationInterface
{
  name = 'RenameLoanInterestColumns1749920400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename annual_interest_rate_bps to annual_interest_rate
    await queryRunner.query(`
      ALTER TABLE loans 
      RENAME COLUMN annual_interest_rate_bps TO annual_interest_rate
    `);

    // Rename overdue_interest_rate_bps to overdue_interest_rate
    await queryRunner.query(`
      ALTER TABLE loans 
      RENAME COLUMN overdue_interest_rate_bps TO overdue_interest_rate
    `);

    // Update default value for overdue_interest_rate from 5 to 1
    await queryRunner.query(`
      ALTER TABLE loans 
      ALTER COLUMN overdue_interest_rate SET DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert column names
    await queryRunner.query(`
      ALTER TABLE loans 
      RENAME COLUMN annual_interest_rate TO annual_interest_rate_bps
    `);

    await queryRunner.query(`
      ALTER TABLE loans 
      RENAME COLUMN overdue_interest_rate TO overdue_interest_rate_bps
    `);

    // Revert default value
    await queryRunner.query(`
      ALTER TABLE loans 
      ALTER COLUMN overdue_interest_rate_bps SET DEFAULT 5
    `);
  }
}
