import {
  dinero,
  toUnits,
  add,
  subtract,
  multiply,
  greaterThan,
  greaterThanOrEqual,
  lessThan,
  lessThanOrEqual,
  equal,
  minimum,
  maximum,
  Dinero,
} from 'dinero.js';
import { USD } from '@dinero.js/currencies';

/**
 * Utility class for handling monetary calculations with precision
 * Using dinero.js v2 to avoid floating-point arithmetic errors
 */
export class Money {
  private d: Dinero<number>;

  constructor(amount: number) {
    // Store as cents (multiply by 100 to avoid decimals)
    this.d = dinero({
      amount: Math.round(amount * 100),
      currency: USD,
    });
  }

  private static fromDinero(d: Dinero<number>): Money {
    const m = Object.create(Money.prototype) as Money;
    m.d = d;
    return m;
  }

  /**
   * Create a Money instance from a number amount
   */
  static create(amount: number): Money {
    return new Money(amount);
  }

  /**
   * Add another Money or number to this Money
   */
  add(other: Money | number): Money {
    if (other instanceof Money) {
      return Money.fromDinero(add(this.d, other.d));
    }
    return Money.fromDinero(add(this.d, Money.create(other).d));
  }

  /**
   * Subtract another Money or number from this Money
   */
  subtract(other: Money | number): Money {
    if (other instanceof Money) {
      return Money.fromDinero(subtract(this.d, other.d));
    }
    return Money.fromDinero(subtract(this.d, Money.create(other).d));
  }

  /**
   * Multiply this Money by a factor
   */
  multiply(factor: number): Money {
    return Money.fromDinero(multiply(this.d, factor));
  }

  /**
   * Divide this Money by a divisor
   * Note: Uses multiply by inverse for simplicity
   */
  divide(divisor: number): Money {
    // For division, we multiply by the inverse
    // This maintains precision with dinero.js
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return Money.fromDinero(multiply(this.d, 1 / divisor));
  }

  /**
   * Check if this Money is greater than another
   */
  greaterThan(other: Money | number): boolean {
    if (other instanceof Money) {
      return greaterThan(this.d, other.d);
    }
    return greaterThan(this.d, Money.create(other).d);
  }

  /**
   * Check if this Money is greater than or equal to another
   */
  greaterThanOrEqual(other: Money | number): boolean {
    if (other instanceof Money) {
      return greaterThanOrEqual(this.d, other.d);
    }
    return greaterThanOrEqual(this.d, Money.create(other).d);
  }

  /**
   * Check if this Money is less than another
   */
  lessThan(other: Money | number): boolean {
    if (other instanceof Money) {
      return lessThan(this.d, other.d);
    }
    return lessThan(this.d, Money.create(other).d);
  }

  /**
   * Check if this Money is less than or equal to another
   */
  lessThanOrEqual(other: Money | number): boolean {
    if (other instanceof Money) {
      return lessThanOrEqual(this.d, other.d);
    }
    return lessThanOrEqual(this.d, Money.create(other).d);
  }

  /**
   * Check if this Money equals another
   */
  equals(other: Money | number): boolean {
    if (other instanceof Money) {
      return equal(this.d, other.d);
    }
    return equal(this.d, Money.create(other).d);
  }

  /**
   * Returns the minimum of two Money values
   */
  static min(a: Money, b: Money): Money {
    return Money.fromDinero(minimum([a.d, b.d]));
  }

  /**
   * Returns the maximum of two Money values
   */
  static max(a: Money, b: Money): Money {
    return Money.fromDinero(maximum([a.d, b.d]));
  }

  /**
   * Sum an array of Money objects or numbers
   */
  static sum(items: (Money | number)[]): Money {
    const dineroItems = items.map((item) =>
      item instanceof Money ? item.d : Money.create(item).d,
    );
    return Money.fromDinero(dineroItems.reduce((acc, curr) => add(acc, curr)));
  }

  /**
   * Get the amount as a number (for database storage, etc.)
   */
  toNumber(): number {
    const units = toUnits(this.d);
    return units[0] + units[1] / 100;
  }

  /**
   * Get the underlying dinero object
   */
  getDinero(): Dinero<number> {
    return this.d;
  }

  /**
   * Format for display with 2 decimal places
   */
  toString(): string {
    return this.toNumber().toFixed(2);
  }
}
