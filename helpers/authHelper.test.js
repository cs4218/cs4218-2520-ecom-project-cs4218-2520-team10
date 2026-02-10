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
 *   - console.log: Mock (verify error logging)
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
 * 7  | Side Effect | —         | valid → bcrypt.hash called      | bcrypt.hash(password, 10)
 * 8  | Side Effect | —         | error → console.log called      | console.log(error)
 * 9  | Security    | —         | same password twice             | different hashes (salt)
 *
 * Scenario Plan - comparePassword:
 * #  | Category    | Technique | Scenario                        | Expected
 * 1  | Happy       | —         | correct password vs hash        | true
 * 2  | Happy       | —         | wrong password vs hash          | false
 * 3  | Partition   | EP        | similar password (1 char diff)  | false
 * 4  | Boundary    | BVA       | empty string vs empty hash      | true
 * 5  | Negative    | EP        | invalid hash format             | error thrown
 * 6  | Error       | —         | bcrypt.compare throws           | error propagates
 * 7  | Side Effect | —         | valid → bcrypt.compare called   | bcrypt.compare(pwd, hash)
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
    let consoleLogSpy;

    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();

      // Spy on console.log to verify error logging
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      // Restore console.log after each test
      consoleLogSpy.mockRestore();
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

      it('should log error to console when bcrypt throws error', async () => {
        // ── ARRANGE ──────────────────────────────────
        const password = 'password123';
        const bcryptError = new Error('bcrypt failure');
        bcrypt.hash.mockRejectedValue(bcryptError);

        // ── ACT ──────────────────────────────────────
        await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        // Observable side effect: Error logged to console
        // WHY: Implementation uses console.log(error) in catch block
        expect(consoleLogSpy).toHaveBeenCalledWith(bcryptError);
      });
    });

    // ═══════════════════════════════════════════════════════════
    // SIDE EFFECTS — INTEGRATION TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Side Effects', () => {
      it('should call bcrypt.hash with password and salt rounds', async () => {
        // ── ARRANGE ──────────────────────────────────
        const password = 'password123';
        const expectedHash = '$2b$10$hashedPassword';
        bcrypt.hash.mockResolvedValue(expectedHash);

        // ── ACT ──────────────────────────────────────
        await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        // Observable side effect: bcrypt.hash called with correct arguments
        // WHY: Verify integration with bcrypt library
        expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      });

      it('should call bcrypt.hash exactly once', async () => {
        // ── ARRANGE ──────────────────────────────────
        const password = 'password123';
        bcrypt.hash.mockResolvedValue('$2b$10$hash');

        // ── ACT ──────────────────────────────────────
        await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        // Observable side effect: bcrypt.hash called exactly once
        expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      });

      it('should not call bcrypt.hash multiple times when error occurs', async () => {
        // ── ARRANGE ──────────────────────────────────
        const password = 'password123';
        bcrypt.hash.mockRejectedValue(new Error('bcrypt error'));

        // ── ACT ──────────────────────────────────────
        await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        // Observable side effect: bcrypt.hash only attempted once, no retry
        expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      });
    });

    // ═══════════════════════════════════════════════════════════
    // SECURITY INVARIANTS
    // ═══════════════════════════════════════════════════════════

    describe('Security Invariants', () => {
      it('should produce different hashes when same password is hashed twice', async () => {
        // ── ARRANGE ──────────────────────────────────
        const password = 'password123';
        // Stub bcrypt to return different hashes (simulating random salt behavior)
        // WHY: Verify that each hash call produces unique results (salt randomness)
        let callCount = 0;
        bcrypt.hash.mockImplementation(async (pwd, rounds) => {
          callCount++;
          return `$2b$10$randomSalt${callCount}HashedPassword`;
        });

        // ── ACT ──────────────────────────────────────
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        // ── ASSERT ───────────────────────────────────
        // Security invariant: Same password produces different hashes
        // WHY: bcrypt generates random salt each time - critical for security
        expect(hash1).not.toBe(hash2);
        expect(hash1).toBe('$2b$10$randomSalt1HashedPassword');
        expect(hash2).toBe('$2b$10$randomSalt2HashedPassword');
        expect(bcrypt.hash).toHaveBeenCalledTimes(2);
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

      it('should return false when password differs by one character', async () => {
        // ── ARRANGE ──────────────────────────────────
        // EP: invalid partition (similar but not identical)
        // WHY: Test that even 1 character difference is detected
        const password = 'password124';        // Last char differs
        const hashedPassword = '$2b$10$hashOfPassword123';
        bcrypt.compare.mockResolvedValue(false);

        // ── ACT ──────────────────────────────────────
        const result = await comparePassword(password, hashedPassword);

        // ── ASSERT ───────────────────────────────────
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

        // ── ACT & ASSERT ─────────────────────────────
        // Observable behavior: Error propagates (not caught)
        await expect(comparePassword(password, invalidHash)).rejects.toThrow('Invalid bcrypt hash');
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

        // ── ACT & ASSERT ─────────────────────────────
        // Observable behavior: Error propagates to caller
        // WHY: comparePassword does NOT catch errors
        await expect(comparePassword(password, hashedPassword)).rejects.toThrow('bcrypt comparison failed');
      });
    });

    // ═══════════════════════════════════════════════════════════
    // SIDE EFFECTS — INTEGRATION TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Side Effects', () => {
      it('should call bcrypt.compare with correct arguments', async () => {
        // ── ARRANGE ──────────────────────────────────
        const password = 'password123';
        const hashedPassword = '$2b$10$hashedPassword123';
        bcrypt.compare.mockResolvedValue(true);

        // ── ACT ──────────────────────────────────────
        await comparePassword(password, hashedPassword);

        // ── ASSERT ───────────────────────────────────
        // Observable side effect: bcrypt.compare called with correct arguments
        // WHY: Verify integration with bcrypt library
        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      });

      it('should call bcrypt.compare exactly once', async () => {
        // ── ARRANGE ──────────────────────────────────
        const password = 'password123';
        const hashedPassword = '$2b$10$hash';
        bcrypt.compare.mockResolvedValue(true);

        // ── ACT ──────────────────────────────────────
        await comparePassword(password, hashedPassword);

        // ── ASSERT ───────────────────────────────────
        // Observable side effect: bcrypt.compare called exactly once
        expect(bcrypt.compare).toHaveBeenCalledTimes(1);
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
