import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoansTables1749920000000 implements MigrationInterface {
  name = 'CreateLoansTables1749920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE loan_status_enum AS ENUM (
        'simulated', 'active', 'overdue', 'paid', 'defaulted', 'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE payment_frequency_enum AS ENUM (
        'weekly', 'biweekly', 'monthly'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE installment_status_enum AS ENUM (
        'pending', 'paid', 'partial', 'overdue'
      )
    `);

    // Create loans table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        principal_amount DECIMAL(15, 2) NOT NULL,
        annual_interest_rate INTEGER NOT NULL,
        payment_frequency payment_frequency_enum NOT NULL,
        total_periods INTEGER NOT NULL,
        total_amount DECIMAL(15, 2) NOT NULL,
        status loan_status_enum NOT NULL DEFAULT 'simulated',
        overdue_interest_rate INTEGER NOT NULL DEFAULT 1,
        start_date DATE NULL,
        end_date DATE NULL,
        simulated_at TIMESTAMP NOT NULL,
        activated_at TIMESTAMP NULL,
        paid_at TIMESTAMP NULL,
        defaulted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      )
    `);

    // Create indexes for loans
    await queryRunner.query(`
      CREATE INDEX idx_loans_customer_id ON loans(customer_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_loans_status ON loans(status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_loans_deleted_at ON loans(deleted_at)
    `);

    // Create loan installments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS loan_installments (
        id SERIAL PRIMARY KEY,
        loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
        installment_number INTEGER NOT NULL,
        due_date DATE NOT NULL,
        principal_amount DECIMAL(15, 2) NOT NULL,
        interest_amount DECIMAL(15, 2) NOT NULL,
        total_amount DECIMAL(15, 2) NOT NULL,
        paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        remaining_amount DECIMAL(15, 2) NOT NULL,
        status installment_status_enum NOT NULL DEFAULT 'pending',
        overdue_days INTEGER NOT NULL DEFAULT 0,
        penalty_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      )
    `);

    // Create indexes for loan installments
    await queryRunner.query(`
      CREATE INDEX idx_loan_installments_loan_id ON loan_installments(loan_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_loan_installments_status ON loan_installments(status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_loan_installments_due_date ON loan_installments(due_date)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_loan_installments_deleted_at ON loan_installments(deleted_at)
    `);

    // Create loan payments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS loan_payments (
        id SERIAL PRIMARY KEY,
        installment_id INTEGER NOT NULL REFERENCES loan_installments(id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method VARCHAR(50) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for loan payments
    await queryRunner.query(`
      CREATE INDEX idx_loan_payments_installment_id ON loan_payments(installment_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_loan_payments_payment_date ON loan_payments(payment_date)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS loan_payments`);
    await queryRunner.query(`DROP TABLE IF EXISTS loan_installments`);
    await queryRunner.query(`DROP TABLE IF EXISTS loans`);
    await queryRunner.query(`DROP TYPE IF EXISTS installment_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_frequency_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS loan_status_enum`);
  }
}
