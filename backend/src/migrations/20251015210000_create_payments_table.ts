exports.shorthands = undefined;

exports.up = async function(pgm) {
  // Create payments table
  pgm.createTable('payments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    receipt_number: {
      type: 'varchar(50)',
      notNull: true,
      unique: true
    },
    loan_id: {
      type: 'uuid',
      notNull: true,
      references: 'loans',
      onDelete: 'CASCADE'
    },
    amount: {
      type: 'decimal(15,2)',
      notNull: true
    },
    payment_date: {
      type: 'date',
      notNull: true
    },
    payment_method: {
      type: 'varchar(50)',
      notNull: true,
      comment: 'cash, check, bank_transfer, gcash, paymaya'
    },
    reference_number: {
      type: 'varchar(100)',
      comment: 'Check number, transaction reference, etc.'
    },
    remarks: {
      type: 'text'
    },
    penalty_paid: {
      type: 'decimal(15,2)',
      default: 0
    },
    interest_paid: {
      type: 'decimal(15,2)',
      default: 0
    },
    principal_paid: {
      type: 'decimal(15,2)',
      default: 0
    },
    advance_paid: {
      type: 'decimal(15,2)',
      default: 0,
      comment: 'Advance payment for future installments'
    },
    collected_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      comment: 'User who collected the payment'
    },
    voided: {
      type: 'boolean',
      default: false
    },
    voided_by: {
      type: 'uuid',
      references: 'users'
    },
    voided_at: {
      type: 'timestamp'
    },
    void_reason: {
      type: 'text'
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()')
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()')
    }
  });

  // Add indexes for performance
  pgm.createIndex('payments', 'loan_id');
  pgm.createIndex('payments', 'receipt_number');
  pgm.createIndex('payments', 'payment_date');
  pgm.createIndex('payments', 'collected_by');
  pgm.createIndex('payments', 'voided');

  // Add penalty tracking to payment_schedules
  pgm.addColumns('payment_schedules', {
    penalty_amount: {
      type: 'decimal(15,2)',
      default: 0
    }
  });

  // Create index for overdue tracking
  pgm.createIndex('payment_schedules', ['loan_id', 'due_date', 'status']);
};

exports.down = async function(pgm) {
  // Drop payments table
  pgm.dropTable('payments');

  // Remove penalty tracking from payment_schedules
  pgm.dropColumns('payment_schedules', ['penalty_amount']);
};
