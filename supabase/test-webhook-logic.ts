/**
 * Bank Webhook Unit Tests
 * Tests the transaction parsing and order ID extraction logic
 * Run with: npx tsx supabase/test-webhook-logic.ts
 */

// Mock transaction parsing functions (same as in bank-webhook/index.ts)

interface BankTransaction {
  id: string;
  transactionId: string;
  bankCode: string;
  accountNumber: string;
  amount: number;
  description: string;
  transactionDate: string;
  type: 'credit' | 'debit';
}

const EXPECTED_ACCOUNT = "0773702777";

// Parse transactions from various webhook formats
function parseTransactions(body: Record<string, any>): BankTransaction[] {
  const transactions: BankTransaction[] = [];

  // Format 1: Casso webhook format
  if (body.data && Array.isArray(body.data)) {
    for (const item of body.data) {
      transactions.push({
        id: item.id?.toString() || '',
        transactionId: item.tid?.toString() || item.transactionId?.toString() || '',
        bankCode: item.bankSubAccId || item.bankCode || 'MB',
        accountNumber: item.subAccId || item.accountNumber || '',
        amount: Math.abs(item.amount || 0),
        description: item.description || item.content || '',
        transactionDate: item.when || item.transactionDate || new Date().toISOString(),
        type: (item.amount > 0 || item.type === 'IN') ? 'credit' : 'debit',
      });
    }
  }
  // Format 2: SePay/PayOS format
  else if (body.content || body.transferAmount) {
    transactions.push({
      id: body.id?.toString() || '',
      transactionId: body.referenceCode?.toString() || body.transactionId?.toString() || '',
      bankCode: body.gateway || 'MB',
      accountNumber: body.accountNumber || EXPECTED_ACCOUNT,
      amount: Math.abs(body.transferAmount || body.amount || 0),
      description: body.content || body.description || '',
      transactionDate: body.transactionDate || new Date().toISOString(),
      type: 'credit',
    });
  }
  // Format 3: Simple array format
  else if (Array.isArray(body)) {
    for (const item of body) {
      transactions.push({
        id: item.id?.toString() || '',
        transactionId: item.transactionId?.toString() || item.tid?.toString() || '',
        bankCode: item.bankCode || 'MB',
        accountNumber: item.accountNumber || EXPECTED_ACCOUNT,
        amount: Math.abs(item.amount || 0),
        description: item.description || item.content || '',
        transactionDate: item.transactionDate || new Date().toISOString(),
        type: item.type === 'credit' || item.amount > 0 ? 'credit' : 'debit',
      });
    }
  }
  // Format 4: Single transaction object
  else if (body.transactionId || body.amount) {
    transactions.push({
      id: body.id?.toString() || '',
      transactionId: body.transactionId?.toString() || '',
      bankCode: body.bankCode || 'MB',
      accountNumber: body.accountNumber || EXPECTED_ACCOUNT,
      amount: Math.abs(body.amount || 0),
      description: body.description || body.content || '',
      transactionDate: body.transactionDate || new Date().toISOString(),
      type: body.type === 'credit' || body.amount > 0 ? 'credit' : 'debit',
    });
  }

  return transactions;
}

// Extract order ID from transaction description
function extractOrderId(description: string): string | null {
  if (!description) return null;

  // Pattern 1: "Thanh toan ORDER_ID"
  const pattern1 = /Thanh\s*toan\s+(\S+)/i;
  const match1 = description.match(pattern1);
  if (match1) return match1[1];

  // Pattern 2: "ORD-" prefix
  const pattern2 = /ORD-[A-Z0-9]+/i;
  const match2 = description.match(pattern2);
  if (match2) return match2[0];

  // Pattern 3: Look for UUID-like pattern
  const pattern3 = /[A-Z0-9]{8,}/i;
  const match3 = description.match(pattern3);
  if (match3) return match3[0];

  return null;
}

// Test runner
function runTests() {
  console.log('=== Bank Webhook Logic Tests ===\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => boolean) {
    try {
      if (fn()) {
        console.log(`✅ PASSED: ${name}`);
        passed++;
      } else {
        console.log(`❌ FAILED: ${name}`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ ERROR: ${name} - ${e}`);
      failed++;
    }
  }

  // Test parseTransactions - Casso format
  test('Parse Casso format webhook', () => {
    const payload = {
      data: [
        {
          tid: "CASSO001",
          amount: 150000,
          description: "Thanh toan ORD-ABC123",
          when: "2025-12-31T10:00:00Z",
          subAccId: "0773702777",
          bankSubAccId: "MB"
        }
      ]
    };
    const transactions = parseTransactions(payload);
    return transactions.length === 1 &&
           transactions[0].transactionId === "CASSO001" &&
           transactions[0].amount === 150000 &&
           transactions[0].type === "credit" &&
           transactions[0].accountNumber === "0773702777";
  });

  // Test parseTransactions - SePay format
  test('Parse SePay format webhook', () => {
    const payload = {
      referenceCode: "SEPAY001",
      transferAmount: 200000,
      content: "Thanh toan ORD-XYZ789",
      transactionDate: "2025-12-31T11:00:00Z",
      accountNumber: "0773702777",
      gateway: "MB"
    };
    const transactions = parseTransactions(payload);
    return transactions.length === 1 &&
           transactions[0].transactionId === "SEPAY001" &&
           transactions[0].amount === 200000 &&
           transactions[0].description === "Thanh toan ORD-XYZ789";
  });

  // Test parseTransactions - Simple format
  test('Parse simple transaction format', () => {
    const payload = {
      transactionId: "SIMPLE001",
      amount: 100000,
      description: "Thanh toan ORD-TEST123",
      type: "credit",
      accountNumber: "0773702777"
    };
    const transactions = parseTransactions(payload);
    return transactions.length === 1 &&
           transactions[0].transactionId === "SIMPLE001" &&
           transactions[0].amount === 100000;
  });

  // Test parseTransactions - Array format
  test('Parse array format with multiple transactions', () => {
    const payload = [
      { transactionId: "TX001", amount: 50000, description: "Test 1", type: "credit" },
      { transactionId: "TX002", amount: 75000, description: "Test 2", type: "credit" }
    ];
    const transactions = parseTransactions(payload as any);
    return transactions.length === 2 &&
           transactions[0].transactionId === "TX001" &&
           transactions[1].transactionId === "TX002";
  });

  // Test parseTransactions - Negative amount (debit)
  test('Handle negative amount as debit', () => {
    const payload = {
      data: [{ tid: "DEBIT001", amount: -50000, description: "Rut tien" }]
    };
    const transactions = parseTransactions(payload);
    return transactions.length === 1 &&
           transactions[0].type === "debit" &&
           transactions[0].amount === 50000; // Should be absolute
  });

  // Test extractOrderId - "Thanh toan" pattern
  test('Extract order ID from "Thanh toan ORD-XXX" format', () => {
    const orderId = extractOrderId("Thanh toan ORD-ABC123XYZ");
    return orderId === "ORD-ABC123XYZ";
  });

  // Test extractOrderId - ORD- prefix anywhere
  test('Extract order ID with ORD- prefix in middle of text', () => {
    const orderId = extractOrderId("CK tu NGUYEN VAN A - ORD-XYZ789 - Mua khoa hoc");
    return orderId === "ORD-XYZ789";
  });

  // Test extractOrderId - UUID-like pattern
  test('Extract UUID-like order ID', () => {
    const orderId = extractOrderId("Payment for ABCD1234EFGH5678");
    return orderId === "ABCD1234EFGH5678";
  });

  // Test extractOrderId - Case insensitivity
  test('Extract order ID case insensitively', () => {
    const orderId = extractOrderId("thanh TOAN ord-lowercase123");
    return orderId === "ord-lowercase123";
  });

  // Test extractOrderId - No clear order ID (fallback pattern may still match)
  test('Fallback pattern may match long strings', () => {
    const orderId = extractOrderId("Random bank transfer note");
    // Pattern 3 matches 'transfer' (8 chars) as fallback
    return orderId === "transfer";
  });

  // Test extractOrderId - Short random text
  test('Return null when no pattern matches', () => {
    const orderId = extractOrderId("CK ABC");
    return orderId === null;
  });

  // Test extractOrderId - Empty description
  test('Handle empty description', () => {
    const orderId = extractOrderId("");
    return orderId === null;
  });

  // Summary
  console.log(`\n=== Test Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);

  return failed === 0;
}

// Run the tests
const success = runTests();
process.exit(success ? 0 : 1);

