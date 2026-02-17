import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, In } from 'typeorm';
import { Loan } from './entities/loan.entity';
import { LoanInstallment } from './entities/loan-installment.entity';
import { LoanPayment } from './entities/loan-payment.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { LoanStatus } from './enums/loan-status.enum';
import { PaymentFrequency } from './enums/payment-frequency.enum';
import { InstallmentStatus } from './enums/installment-status.enum';
import { Customer } from '../customers/entities/customer.entity';
import { Role } from '../../common/enums/role.enum';
import { ContactType } from '../customers/enums/contact-type.enum';
import { MailService } from '../mail/mail.service';

@Injectable()
export class LoansService {
  private readonly logger = new Logger(LoansService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanInstallment)
    private readonly installmentRepository: Repository<LoanInstallment>,
    @InjectRepository(LoanPayment)
    private readonly paymentRepository: Repository<LoanPayment>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new loan (simulation or active)
   */
  async create(createLoanDto: CreateLoanDto): Promise<Loan> {
    const {
      customerId,
      principalAmount,
      annualInterestRate,
      paymentFrequency,
      totalPeriods,
      overdueInterestRate = 1, // Default 1% daily
      simulate = true,
    } = createLoanDto;

    // Verify customer exists
    const customer = await this.dataSource
      .getRepository(Customer)
      .findOne({ where: { id: customerId } });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate French amortization schedule
    const schedule = this.calculateFrenchAmortization(
      principalAmount,
      annualInterestRate,
      paymentFrequency,
      totalPeriods,
    );

    const totalAmount = schedule.reduce((sum, s) => sum + s.totalAmount, 0);

    // Calculate dates
    const simulatedAt = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let activatedAt: Date | null = null;

    if (!simulate) {
      startDate = new Date();
      endDate = this.calculateEndDate(
        startDate,
        paymentFrequency,
        totalPeriods,
      );
      activatedAt = new Date();
    }

    const status = simulate ? LoanStatus.SIMULATED : LoanStatus.ACTIVE;

    // Create loan and installments in transaction
    return this.dataSource.transaction(async (manager) => {
      const loanRepo = manager.getRepository(Loan);
      const installmentRepo = manager.getRepository(LoanInstallment);

      const loan = loanRepo.create({
        customerId,
        principalAmount,
        annualInterestRate,
        paymentFrequency,
        totalPeriods,
        totalAmount,
        status,
        overdueInterestRate,
        startDate,
        endDate,
        simulatedAt,
        activatedAt,
      });

      const savedLoan = await loanRepo.save(loan);

      // Only create installments for non-simulated loans
      if (!simulate) {
        const installments = schedule.map((s, index) => {
          const dueDate = this.calculateDueDate(
            startDate!,
            paymentFrequency,
            index + 1,
          );

          return installmentRepo.create({
            loanId: savedLoan.id,
            installmentNumber: s.installmentNumber,
            dueDate,
            principalAmount: s.principalAmount,
            interestAmount: s.interestAmount,
            totalAmount: s.totalAmount,
            remainingAmount: s.totalAmount,
            status: InstallmentStatus.PENDING,
          });
        });

        await installmentRepo.save(installments);
      }

      return loanRepo.findOne({
        where: { id: savedLoan.id },
        relations: ['installments'],
      }) as Promise<Loan>;
    });
  }

  /**
   * Activate a simulated loan
   */
  async activate(id: number): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== LoanStatus.SIMULATED) {
      throw new BadRequestException('Only simulated loans can be activated');
    }

    const startDate = new Date();
    const endDate = this.calculateEndDate(
      startDate,
      loan.paymentFrequency,
      loan.totalPeriods,
    );

    // Update loan status
    loan.status = LoanStatus.ACTIVE;
    loan.startDate = startDate;
    loan.endDate = endDate;
    loan.activatedAt = new Date();

    // Calculate and create installments
    const schedule = this.calculateFrenchAmortization(
      loan.principalAmount,
      loan.annualInterestRate,
      loan.paymentFrequency,
      loan.totalPeriods,
    );

    await this.dataSource.transaction(async (manager) => {
      const loanRepo = manager.getRepository(Loan);
      const installmentRepo = manager.getRepository(LoanInstallment);

      // Create installments with actual start date
      const installments = schedule.map((s, index) => {
        const dueDate = this.calculateDueDate(
          startDate,
          loan.paymentFrequency,
          index + 1,
        );

        return installmentRepo.create({
          loanId: id,
          installmentNumber: s.installmentNumber,
          dueDate,
          principalAmount: s.principalAmount,
          interestAmount: s.interestAmount,
          totalAmount: s.totalAmount,
          remainingAmount: s.totalAmount,
          status: InstallmentStatus.PENDING,
        });
      });

      await installmentRepo.save(installments);
      await loanRepo.save(loan);
    });

    return this.findOne(id);
  }

  /**
   * Update a simulated loan
   */
  async update(id: number, updateLoanDto: UpdateLoanDto): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== LoanStatus.SIMULATED) {
      throw new BadRequestException('Only simulated loans can be updated');
    }

    // Apply updates
    if (updateLoanDto.principalAmount !== undefined) {
      loan.principalAmount = updateLoanDto.principalAmount;
    }
    if (updateLoanDto.annualInterestRate !== undefined) {
      loan.annualInterestRate = updateLoanDto.annualInterestRate;
    }
    if (updateLoanDto.totalPeriods !== undefined) {
      loan.totalPeriods = updateLoanDto.totalPeriods;
    }
    if (updateLoanDto.overdueInterestRate !== undefined) {
      loan.overdueInterestRate = updateLoanDto.overdueInterestRate;
    }
    if (updateLoanDto.paymentFrequency !== undefined) {
      loan.paymentFrequency = updateLoanDto.paymentFrequency;
    }

    // Recalculate total amount (installments will be created on activation)
    const schedule = this.calculateFrenchAmortization(
      loan.principalAmount,
      loan.annualInterestRate,
      loan.paymentFrequency,
      loan.totalPeriods,
    );

    loan.totalAmount = schedule.reduce((sum, s) => sum + s.totalAmount, 0);

    await this.loanRepository.save(loan);

    return this.findOne(id);
  }

  /**
   * Delete a simulated loan
   */
  async remove(id: number): Promise<void> {
    const loan = await this.loanRepository.findOne({ where: { id } });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== LoanStatus.SIMULATED) {
      throw new BadRequestException('Only simulated loans can be deleted');
    }

    await this.loanRepository.softDelete(id);
  }

  /**
   * Find all loans (for admin)
   */
  async findAll(): Promise<Loan[]> {
    return this.loanRepository.find({
      relations: ['customer', 'installments'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find loans for a customer (excluding simulations)
   */
  async findByCustomer(customerId: number): Promise<Loan[]> {
    return this.loanRepository.find({
      where: {
        customerId,
        status: In([
          LoanStatus.ACTIVE,
          LoanStatus.OVERDUE,
          LoanStatus.PAID,
          LoanStatus.DEFAULTED,
        ]),
      },
      relations: ['installments'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find one loan by ID with access control
   */
  async findOne(
    id: number,
    user?: { userId: number; role: Role; customerId?: number },
  ): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id },
      relations: ['customer', 'installments', 'installments.payments'],
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Access control
    if (user) {
      if (user.role !== Role.ADMIN) {
        // Customer can only see their own effective loans
        if (loan.customerId !== user.customerId) {
          throw new ForbiddenException('You do not have access to this loan');
        }
        if (loan.status === LoanStatus.SIMULATED) {
          throw new ForbiddenException('You do not have access to this loan');
        }
      }
    }

    return loan;
  }

  /**
   * Record a payment for a loan
   */
  async recordPayment(
    loanId: number,
    dto: RecordPaymentDto,
  ): Promise<LoanPayment[]> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['installments'],
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status === LoanStatus.SIMULATED) {
      throw new BadRequestException(
        'Cannot record payments for simulated loans',
      );
    }

    if (loan.status === LoanStatus.PAID) {
      throw new BadRequestException('Loan is already fully paid');
    }

    const paymentDate = dto.paymentDate
      ? new Date(dto.paymentDate)
      : new Date();

    // Get ordered installments (pending and partial only)
    const pendingInstallments = loan.installments
      .filter(
        (i) =>
          i.status === InstallmentStatus.PENDING ||
          i.status === InstallmentStatus.PARTIAL,
      )
      .sort((a, b) => a.installmentNumber - b.installmentNumber);

    if (pendingInstallments.length === 0) {
      throw new BadRequestException('No pending installments found');
    }

    // Calculate total remaining balance
    const totalRemaining = pendingInstallments.reduce(
      (sum, i) =>
        sum +
        parseFloat(i.totalAmount.toString()) +
        parseFloat(i.penaltyAmount.toString()) -
        parseFloat(i.paidAmount.toString()),
      0,
    );

    // Check for overpayment
    if (dto.amount > totalRemaining) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds total remaining balance (${totalRemaining.toFixed(2)})`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(LoanPayment);
      const installmentRepo = manager.getRepository(LoanInstallment);
      const loanRepo = manager.getRepository(Loan);

      const payments: LoanPayment[] = [];
      let remainingPayment = dto.amount;

      // Distribute payment across installments
      for (const installment of pendingInstallments) {
        if (remainingPayment <= 0) break;

        const installmentRemaining =
          parseFloat(installment.totalAmount.toString()) +
          parseFloat(installment.penaltyAmount.toString()) -
          parseFloat(installment.paidAmount.toString());

        const amountToApply = Math.min(remainingPayment, installmentRemaining);

        // Create payment record
        const payment = paymentRepo.create({
          installmentId: installment.id,
          amount: amountToApply,
          paymentDate,
          paymentMethod: dto.paymentMethod || null,
          notes: dto.notes || null,
        });

        await paymentRepo.save(payment);
        payments.push(payment);

        // Update installment
        installment.paidAmount =
          parseFloat(installment.paidAmount.toString()) + amountToApply;
        installment.remainingAmount = Math.max(
          0,
          installmentRemaining - amountToApply,
        );

        if (installment.remainingAmount <= 0) {
          installment.status = InstallmentStatus.PAID;
          installment.paidAt = paymentDate;
        } else {
          installment.status = InstallmentStatus.PARTIAL;
        }

        await installmentRepo.save(installment);

        remainingPayment -= amountToApply;
      }

      // Check if loan is fully paid
      const updatedLoan = await loanRepo.findOne({
        where: { id: loanId },
        relations: ['installments'],
      });

      const allPaid = updatedLoan!.installments.every(
        (i) => i.status === InstallmentStatus.PAID,
      );

      if (allPaid) {
        updatedLoan!.status = LoanStatus.PAID;
        updatedLoan!.paidAt = paymentDate;
        await loanRepo.save(updatedLoan!);
      }

      return payments;
    });
  }

  /**
   * Mark a loan as defaulted
   */
  async markAsDefaulted(id: number): Promise<Loan> {
    const loan = await this.loanRepository.findOne({ where: { id } });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.OVERDUE
    ) {
      throw new BadRequestException(
        'Only active or overdue loans can be marked as defaulted',
      );
    }

    loan.status = LoanStatus.DEFAULTED;
    loan.defaultedAt = new Date();

    return this.loanRepository.save(loan);
  }

  /**
   * Cancel a simulated loan
   */
  async cancel(id: number): Promise<Loan> {
    const loan = await this.loanRepository.findOne({ where: { id } });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== LoanStatus.SIMULATED) {
      throw new BadRequestException('Only simulated loans can be cancelled');
    }

    loan.status = LoanStatus.CANCELLED;

    return this.loanRepository.save(loan);
  }

  /**
   * Check and update overdue installments (to be called by cron job)
   * Logs failures and continues processing other installments
   * Sends email notifications to customers with overdue installments
   */
  async checkOverdueInstallments(mailService: MailService): Promise<{
    processed: number;
    failed: number;
    emailsSent: number;
    errors: Array<{ installmentId: number; error: string }>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueInstallments = await this.installmentRepository.find({
      where: {
        status: InstallmentStatus.PENDING,
        dueDate: LessThan(today),
      },
      relations: ['loan', 'loan.customer', 'loan.customer.contacts'],
    });

    const results = {
      processed: 0,
      failed: 0,
      emailsSent: 0,
      errors: [] as Array<{ installmentId: number; error: string }>,
    };

    this.logger.log(
      `Found ${overdueInstallments.length} overdue installments to process`,
    );

    for (const installment of overdueInstallments) {
      try {
        const overdueDays = Math.floor(
          (today.getTime() - new Date(installment.dueDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        installment.overdueDays = overdueDays;
        installment.status = InstallmentStatus.OVERDUE;

        // Calculate penalty
        const remainingAmount = parseFloat(
          installment.remainingAmount.toString(),
        );
        // Convert percentage (e.g., 2 = 2% = 0.02)
        const overdueRatePercent = parseFloat(
          installment.loan.overdueInterestRate.toString(),
        );
        const overdueRate = overdueRatePercent / 100;
        installment.penaltyAmount = remainingAmount * overdueRate * overdueDays;

        await this.installmentRepository.save(installment);

        // Update loan status to overdue
        if (installment.loan.status === LoanStatus.ACTIVE) {
          installment.loan.status = LoanStatus.OVERDUE;
          await this.loanRepository.save(installment.loan);
        }

        // Send email notification
        const customer = installment.loan.customer;
        if (customer && customer.contacts) {
          const primaryEmail = customer.contacts.find(
            (c) => c.type === ContactType.EMAIL && c.isPrimary,
          );

          if (primaryEmail) {
            try {
              await mailService.sendMail({
                to: primaryEmail.value,
                subject: 'Payment Overdue Notification',
                text: `Dear ${customer.firstName} ${customer.lastName},

This is a notification that your payment for loan #${installment.loanId} is now overdue.

Installment Details:
- Installment Number: ${installment.installmentNumber}
- Due Date: ${new Date(installment.dueDate).toLocaleDateString()}
- Days Overdue: ${overdueDays}
- Remaining Amount: $${remainingAmount.toFixed(2)}
- Penalty Amount: $${installment.penaltyAmount.toFixed(2)}

Please make your payment as soon as possible to avoid additional penalties.

If you have any questions, please contact us.

Best regards,
Loans Team`,
              });
              results.emailsSent++;
              this.logger.log(
                `Overdue notification email sent to ${primaryEmail.value} for installment ${installment.id}`,
              );
            } catch (emailError) {
              this.logger.error(
                `Failed to send email to ${primaryEmail.value}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`,
              );
            }
          } else {
            this.logger.warn(
              `No primary email found for customer ${customer.id}, skipping notification`,
            );
          }
        }

        results.processed++;
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          installmentId: installment.id,
          error: errorMessage,
        });
        this.logger.error(
          `Failed to process installment ${installment.id}: ${errorMessage}`,
          error instanceof Error ? error.stack : undefined,
        );
        // Continue with next installment
      }
    }

    this.logger.log(
      `Overdue processing completed: ${results.processed} processed, ${results.failed} failed, ${results.emailsSent} emails sent`,
    );

    return results;
  }

  /**
   * Calculate French amortization schedule
   */
  private calculateFrenchAmortization(
    principal: number,
    annualRatePercent: number,
    frequency: PaymentFrequency,
    periods: number,
  ): Array<{
    installmentNumber: number;
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
  }> {
    const periodsPerYear = this.getPeriodsPerYear(frequency);
    // Convert percentage (e.g., 10 = 10% = 0.10)
    const annualRate = annualRatePercent / 100;
    const periodicRate = annualRate / periodsPerYear;

    // Calculate fixed payment amount using French amortization formula
    // P = (PV * r * (1 + r)^n) / ((1 + r)^n - 1)
    const paymentAmount =
      (principal * periodicRate * Math.pow(1 + periodicRate, periods)) /
      (Math.pow(1 + periodicRate, periods) - 1);

    const schedule: Array<{
      installmentNumber: number;
      principalAmount: number;
      interestAmount: number;
      totalAmount: number;
    }> = [];

    let remainingBalance = principal;

    for (let i = 1; i <= periods; i++) {
      const interestAmount = remainingBalance * periodicRate;
      let principalAmount = paymentAmount - interestAmount;

      // Adjust last payment to avoid rounding errors
      if (i === periods) {
        principalAmount = remainingBalance;
      }

      remainingBalance -= principalAmount;

      schedule.push({
        installmentNumber: i,
        principalAmount: Math.round(principalAmount * 100) / 100,
        interestAmount: Math.round(interestAmount * 100) / 100,
        totalAmount: Math.round((principalAmount + interestAmount) * 100) / 100,
      });
    }

    return schedule;
  }

  /**
   * Get number of periods per year based on frequency
   */
  private getPeriodsPerYear(frequency: PaymentFrequency): number {
    switch (frequency) {
      case PaymentFrequency.WEEKLY:
        return 52;
      case PaymentFrequency.BIWEEKLY:
        return 26;
      case PaymentFrequency.MONTHLY:
        return 12;
      default:
        return 12;
    }
  }

  /**
   * Calculate due date for a specific installment
   */
  private calculateDueDate(
    startDate: Date,
    frequency: PaymentFrequency,
    installmentNumber: number,
  ): Date {
    const date = new Date(startDate);

    switch (frequency) {
      case PaymentFrequency.WEEKLY:
        date.setDate(date.getDate() + 7 * installmentNumber);
        break;
      case PaymentFrequency.BIWEEKLY:
        date.setDate(date.getDate() + 14 * installmentNumber);
        break;
      case PaymentFrequency.MONTHLY:
        date.setMonth(date.getMonth() + installmentNumber);
        break;
    }

    return date;
  }

  /**
   * Calculate end date for a loan
   */
  private calculateEndDate(
    startDate: Date,
    frequency: PaymentFrequency,
    totalPeriods: number,
  ): Date {
    return this.calculateDueDate(startDate, frequency, totalPeriods);
  }

  /**
   * Calculate and return amortization schedule on-the-fly (for simulations)
   */
  async calculateSchedule(
    id: number,
    user?: { userId: number; role: Role; customerId?: number },
  ): Promise<
    Array<{
      installmentNumber: number;
      dueDate: Date;
      principalAmount: number;
      interestAmount: number;
      totalAmount: number;
    }>
  > {
    const loan = await this.findOne(id, user);

    const schedule = this.calculateFrenchAmortization(
      loan.principalAmount,
      loan.annualInterestRate,
      loan.paymentFrequency,
      loan.totalPeriods,
    );

    // Calculate due dates based on start date or simulated date
    const baseDate = loan.startDate || loan.simulatedAt || new Date();

    return schedule.map((s) => ({
      ...s,
      dueDate: this.calculateDueDate(
        baseDate,
        loan.paymentFrequency,
        s.installmentNumber,
      ),
    }));
  }
}
