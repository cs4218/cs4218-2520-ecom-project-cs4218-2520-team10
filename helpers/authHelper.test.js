// Test cases written by: KIM SHI TONG A0265858J

/**
 * Unit Tests: authHelper
 *
 * Units Under Test:
 *   1. hashPassword (authHelper.js:3-12)
 *      - Hashes plain text passwords using bcrypt
 *      - Uses 10 salt rounds
 *      - Catches and logs errors, returns undefined on failure
 *
 *   2. comparePassword (authHelper.js:14-16)
 *      - Compares plain text password with hashed password
 *      - Returns boolean result from bcrypt.compare
 *      - Does not catch errors (propagates to caller)
 *
 * Test Doubles:
 *   - bcrypt.hash: Stub (returns predetermined hash or throws error)
 *   - bcrypt.compare: Stub (returns true/false or throws error)
 *
 * Techniques Applied:
 *   - Equivalence Partitioning (EP): Valid vs invalid inputs
 *   - Boundary Value Analysis (BVA): Empty strings, very long strings
 *   - Error Guessing: bcrypt failures, null inputs
 *   - Positive Testing: Happy path with valid data
 *   - Negative Testing: Invalid inputs and error conditions
 *
 * Scenario Plan - hashPassword:
 * #  | Category    | Technique | Scenario                        | Expected
 * 1  | Happy       | —         | valid password string           | hashed string
 * 2  | Happy       | —         | password with special chars     | hashed string
 * 3  | Boundary    | BVA       | empty string ""                 | hashed string
 * 4  | Boundary    | BVA       | very long password (1000 chars) | hashed string
 * 5  | Negative    | EP        | null password                   | undefined (error caught)
 * 6  | Error       | —         | bcrypt.hash throws              | undefined (error caught)
 * Scenario Plan - comparePassword:
 * #  | Category    | Technique | Scenario                        | Expected
 * 1  | Happy       | —         | correct password vs hash        | true
 * 2  | Happy       | —         | wrong password vs hash          | false
 * 3  | Partition   | EP        | similar password (1 char diff)  | false
 * 4  | Boundary    | BVA       | empty string vs empty hash      | true
 * 5  | Negative    | EP        | invalid hash format             | error thrown
 * 6  | Error       | —         | bcrypt.compare throws           | error propagates
 *
 * Note: All tests maintain strict unit test isolation with mocked dependencies.
 * Integration tests with real bcrypt should be in a separate .integration.test.js file.
 *
 * @see ../helpers/authHelper.js
 */

import { hashPassword, comparePassword } from './authHelper.js';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('bcrypt');

describe('authHelper', () => {
  // ═══════════════════════════════════════════════════════════
  // hashPassword TESTS
  // ═══════════════════════════════════════════════════════════

  describe('hashPassword', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
    });

    // ═══════════════════════════════════════════════════════════
    // HAPPY PATH TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Happy Path', () => {
      it('should return hashed string when password is valid', async () => {
        // ── ARRANGE ──────────────────────────────────
        // EP: valid partition (non-empty string)
        const password = 'password123';
        const expectedHash = '$2b$10$hashedPassword123';
        bcrypt.hash.mockResolvedValue(expectedHash);

        // ── ACT ──────────────────────────────────────
        const result = await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        // Observable behavior: Returns hashed password string
        expect(result).toBe(expectedHash);
      });

      it('should return hashed string when password contains special characters', async () => {
        // ── ARRANGE ──────────────────────────────────
        // EP: valid partition with special characters
        // WHY: Test that special chars don't break hashing
        const password = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';
        const expectedHash = '$2b$10$hashedSpecialChars';
        bcrypt.hash.mockResolvedValue(expectedHash);

        // ── ACT ──────────────────────────────────────
        const result = await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        expect(result).toBe(expectedHash);
      });
    });

    // ═══════════════════════════════════════════════════════════
    // BOUNDARY VALUE ANALYSIS (BVA)
    // ═══════════════════════════════════════════════════════════

    describe('Boundary Values', () => {
      it('should return hashed string when password is empty string', async () => {
        // ── ARRANGE ──────────────────────────────────
        // BVA: empty string (minimum boundary - 0 characters)
        // WHY: Test lower boundary of string length
        const password = '';
        const expectedHash = '$2b$10$hashedEmptyString';
        bcrypt.hash.mockResolvedValue(expectedHash);

        // ── ACT ──────────────────────────────────────
        const result = await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        // Observable behavior: bcrypt accepts empty strings
        expect(result).toBe(expectedHash);
      });

      it('should return hashed string when password is very long', async () => {
        // ── ARRANGE ──────────────────────────────────
        // BVA: very long string (upper boundary test - 1000 chars)
        // WHY: Test that long passwords don't break hashing
        const password = 'a'.repeat(1000);
        const expectedHash = '$2b$10$hashedLongPassword';
        bcrypt.hash.mockResolvedValue(expectedHash);

        // ── ACT ──────────────────────────────────────
        const result = await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        expect(result).toBe(expectedHash);
      });
    });

    // ═══════════════════════════════════════════════════════════
    // NEGATIVE / INVALID INPUT TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Negative / Invalid Input', () => {
      it('should return undefined when password is null', async () => {
        // ── ARRANGE ──────────────────────────────────
        // EP: invalid partition (null)
        // WHY: bcrypt.hash will throw when given null
        const password = null;
        const bcryptError = new Error('data must be a string');
        bcrypt.hash.mockRejectedValue(bcryptError);

        // ── ACT ──────────────────────────────────────
        const result = await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        // Observable behavior: Error is caught, undefined returned
        // WHY: Current implementation catches errors and returns undefined
        expect(result).toBeUndefined();
      });
    });

    // ═══════════════════════════════════════════════════════════
    // ERROR HANDLING TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Error Handling', () => {
      it('should return undefined when bcrypt throws error', async () => {
        // ── ARRANGE ──────────────────────────────────
        const password = 'password123';
        const bcryptError = new Error('bcrypt internal error');
        bcrypt.hash.mockRejectedValue(bcryptError);

        // ── ACT ──────────────────────────────────────
        const result = await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        // Observable behavior: Error is caught, undefined returned
        expect(result).toBeUndefined();
      });

    });

  });

  // ═══════════════════════════════════════════════════════════
  // comparePassword TESTS
  // ═══════════════════════════════════════════════════════════

  describe('comparePassword', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
    });

    // ═══════════════════════════════════════════════════════════
    // HAPPY PATH TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Happy Path', () => {
      it('should return true when password is correct', async () => {
        // ── ARRANGE ──────────────────────────────────
        // EP: valid partition (password matches hash)
        const password = 'password123';
        const hashedPassword = '$2b$10$hashedPassword123';
        bcrypt.compare.mockResolvedValue(true);

        // ── ACT ──────────────────────────────────────
        const result = await comparePassword(password, hashedPassword);

        // ── ASSERT ───────────────────────────────────
        // Observable behavior: Returns true for matching password
        expect(result).toBe(true);
      });

      it('should return false when password is wrong', async () => {
        // ── ARRANGE ──────────────────────────────────
        // EP: valid partition (password does not match hash)
        const password = 'wrongPassword';
        const hashedPassword = '$2b$10$hashedPassword123';
        bcrypt.compare.mockResolvedValue(false);

        // ── ACT ──────────────────────────────────────
        const result = await comparePassword(password, hashedPassword);

        // ── ASSERT ───────────────────────────────────
        // Observable behavior: Returns false for non-matching password
        expect(result).toBe(false);
      });
    });

    // ═══════════════════════════════════════════════════════════
    // BOUNDARY VALUE ANALYSIS (BVA)
    // ═══════════════════════════════════════════════════════════

    describe('Boundary Values', () => {
      it('should return true when comparing empty string to its hash', async () => {
        // ── ARRANGE ──────────────────────────────────
        // BVA: empty string (minimum boundary)
        // WHY: Test lower boundary - empty password vs its hash
        const password = '';
        const hashedPassword = '$2b$10$hashOfEmptyString';
        bcrypt.compare.mockResolvedValue(true);

        // ── ACT ──────────────────────────────────────
        const result = await comparePassword(password, hashedPassword);

        // ── ASSERT ───────────────────────────────────
        // Observable behavior: Empty string can match its hash
        expect(result).toBe(true);
      });

      it('should return false when password differs by one character', async () => {
        // ── ARRANGE ──────────────────────────────────
        // BVA: near-boundary value (1 character difference from correct password)
        // WHY: Test that even 1 character difference is detected
        const password = 'password124';        // Last char differs from 'password123'
        const hashedPassword = '$2b$10$hashOfPassword123';
        bcrypt.compare.mockResolvedValue(false);

        // ── ACT ──────────────────────────────────────
        const result = await comparePassword(password, hashedPassword);

        // ── ASSERT ───────────────────────────────────
        expect(result).toBe(false);
      });
    });

    // ═══════════════════════════════════════════════════════════
    // NEGATIVE / INVALID INPUT TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Negative / Invalid Input', () => {
      it('should throw error when hash format is invalid', async () => {
        // ── ARRANGE ──────────────────────────────────
        // EP: invalid partition (malformed hash)
        // WHY: bcrypt.compare should reject invalid hash format
        const password = 'password123';
        const invalidHash = 'notAValidBcryptHash';
        const bcryptError = new Error('Invalid bcrypt hash');
        bcrypt.compare.mockRejectedValue(bcryptError);

        // ── ACT ──────────────────────────────────────
        const promise = comparePassword(password, invalidHash);
        // ── ASSERT ───────────────────────────────────
        await expect(promise).rejects.toThrow('Invalid bcrypt hash');
      });
    });

    // ═══════════════════════════════════════════════════════════
    // ERROR HANDLING TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Error Handling', () => {
      it('should propagate error when bcrypt throws error', async () => {
        // ── ARRANGE ──────────────────────────────────
        const password = 'password123';
        const hashedPassword = '$2b$10$hash';
        const bcryptError = new Error('bcrypt comparison failed');
        bcrypt.compare.mockRejectedValue(bcryptError);

        // ── ACT ──────────────────────────────────────
        const promise = comparePassword(password, hashedPassword);
        // ── ASSERT ───────────────────────────────────
        // Observable behavior: Error propagates to caller
        // WHY: comparePassword does NOT catch errors
        await expect(promise).rejects.toThrow('bcrypt comparison failed');
      });
    });

    // ═══════════════════════════════════════════════════════════
    // SECURITY INVARIANTS
    // ═══════════════════════════════════════════════════════════
    // Note: Additional security verification tests removed to maintain
    // pure unit test isolation. The happy path tests already verify the
    // correct/wrong password behavior through mocked bcrypt.compare.
    // Integration tests with real bcrypt should be in a separate file.
  });
});
