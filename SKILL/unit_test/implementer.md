# Unit Test Implementer - Code Quality Standards

**Implement tests based on the plan. Focus on code quality and correctness.**

---

## Prerequisites

- [ ] Planner phase complete (See agent.md output)
- [ ] All test scenarios planned
- [ ] Test doubles strategy decided
- [ ] Ready to write code

---

## Code Quality Standards (Rubric: 1%)

Your unit tests must follow AAA/Given-When-Then pattern and be highly readable.

### Standard: AAA Pattern (Arrange-Act-Assert)

```javascript
describe('unitName', () => {
  it('should <verb> <outcome> when <condition>', () => {
    // ARRANGE: Set up test data and dependencies
    const input = 'test data';
    const mockDependency = jest.fn();

    // ACT: Call the unit under test
    const result = unitUnderTest(input, mockDependency);

    // ASSERT: Verify the outcome
    expect(result).toBe(expectedValue);
    expect(mockDependency).toHaveBeenCalledWith(expectedParameter);
  });
});
```

### Standard: Readable Test Names

**Pattern:** `should <action/outcome> when <condition>`

```javascript
// ✅ GOOD - Describes behavior
it('should return hashed password when given valid plaintext', () => {});
it('should throw error when password is less than 8 characters', () => {});
it('should return user object when database query succeeds', () => {});

// ❌ BAD - Unclear what's being tested
it('test password hashing', () => {});
it('test login', () => {});
it('test error case', () => {});
```

### Standard: One Assertion Per Test (Ideally)

```javascript
// ✅ GOOD - Each test has single focus
it('should return hashed password', () => {
  const result = hashPassword('test123');
  expect(result).not.toBe('test123');
});

it('should return different hash for same input (bcrypt salting)', () => {
  const hash1 = hashPassword('test123');
  const hash2 = hashPassword('test123');
  expect(hash1).not.toBe(hash2);
});

// ❌ BAD - Multiple assertions, multiple concerns
it('should hash password', () => {
  const result = hashPassword('test123');
  expect(result).not.toBe('test123');
  expect(result.length).toBe(60);
  expect(result).toMatch(/^\$2/); // bcrypt prefix
});
```

**Exception:** Related assertions verifying the same behavior are OK:
```javascript
it('should save user with hashed password', () => {
  const result = saveUser(email, plainPassword);

  expect(result.success).toBe(true);      // Primary assertion
  expect(result.user.password).not.toBe(plainPassword); // Related verification
  expect(result.user.email).toBe(email);  // Related verification
});
```

---

## Structure: Organize with describe() Blocks

```javascript
describe('authHelper', () => {

  describe('hashPassword', () => {
    // Tests specifically for hashPassword()
    it('should return hashed password when given valid plaintext', () => {});
    it('should throw error when given empty string', () => {});
  });

  describe('comparePassword', () => {
    // Tests specifically for comparePassword()
    it('should return true when password matches hash', () => {});
    it('should return false when password does not match hash', () => {});
  });

});
```

---

## Setup and Teardown

### Before/After Each Test

```javascript
describe('userModel', () => {
  let mockConnection;

  beforeEach(() => {
    // SETUP: Run before EACH test
    mockConnection = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // CLEANUP: Run after EACH test
    mockConnection.mockClear();
  });

  it('test 1', () => {
    // Uses fresh mockConnection
  });

  it('test 2', () => {
    // Gets fresh mockConnection again
  });
});
```

### Before/After Suite

```javascript
describe('Database tests', () => {
  let db;

  beforeAll(async () => {
    // SETUP: Run once before ALL tests in this suite
    db = await connectToTestDatabase();
  });

  afterAll(async () => {
    // CLEANUP: Run once after ALL tests
    await db.disconnect();
  });

  // All tests use same db connection
});
```

---

## Test Doubles Implementation

### 1. Mock (Verify calls were made)

```javascript
// Mock for verifying interactions
const mockUserModel = {
  create: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' })
};

it('should call userModel.create with correct data', () => {
  registerUser('test@example.com', 'password123', mockUserModel);

  expect(mockUserModel.create).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: expect.any(String) // Will be hashed
  });
});
```

### 2. Stub (Return fake data)

```javascript
// Stub for returning data without complex logic
const stubLogger = {
  info: jest.fn(),
  error: jest.fn()
};

it('should log when user registers', () => {
  registerUser('test@example.com', 'password123', { logger: stubLogger });

  expect(stubLogger.info).toHaveBeenCalled();
});
```

### 3. Fake (Working implementation but simplified)

```javascript
// Fake implementation - works like real but simpler
class FakeUserRepository {
  constructor() {
    this.users = [];
  }
  save(user) {
    this.users.push(user);
    return Promise.resolve(user);
  }
  findById(id) {
    return Promise.resolve(this.users.find(u => u.id === id));
  }
}

it('should save and retrieve user', async () => {
  const fakeRepo = new FakeUserRepository();
  await registerUser('test@example.com', 'password123', fakeRepo);

  const user = await fakeRepo.findById(1);
  expect(user.email).toBe('test@example.com');
});
```

### 4. Real (Keep actual implementation)

```javascript
// For security-critical or pure functions
it('should create valid bcrypt hash', () => {
  const plainPassword = 'MyPassword123!';
  const hash = hashPassword(plainPassword); // Real bcrypt.hash()

  expect(hash).toMatch(/^\$2/); // Bcrypt starts with $2
  expect(hash.length).toBe(60);
  expect(comparePassword(plainPassword, hash)).toBe(true); // Real bcrypt.compare()
});
```

---

## Testing Different Scenarios

### Scenario 1: Happy Path (Happy Day Test)

```javascript
it('should successfully register user with valid data', () => {
  // ARRANGE
  const email = 'newuser@example.com';
  const password = 'ValidPassword123!';
  const mockUserModel = {
    findOne: jest.fn().mockResolvedValue(null), // No existing user
    create: jest.fn().mockResolvedValue({ id: 1, email })
  };

  // ACT
  const result = await registerController(email, password, mockUserModel);

  // ASSERT
  expect(result.success).toBe(true);
  expect(result.userId).toBe(1);
});
```

### Scenario 2: Boundary Value Tests

```javascript
describe('validatePassword', () => {
  it('should reject password with less than 8 characters (below boundary)', () => {
    expect(() => validatePassword('Pass123')).toThrow('Password too short');
  });

  it('should accept password with exactly 8 characters (at boundary)', () => {
    expect(() => validatePassword('Pass1234')).not.toThrow();
  });

  it('should accept password with 128 characters (at upper boundary)', () => {
    const longPassword = 'A'.repeat(128);
    expect(() => validatePassword(longPassword)).not.toThrow();
  });

  it('should reject password with 129 characters (above boundary)', () => {
    const tooLongPassword = 'A'.repeat(129);
    expect(() => validatePassword(tooLongPassword)).toThrow('Password too long');
  });
});
```

### Scenario 3: Error Handling Tests

```javascript
it('should throw error when email already exists', async () => {
  // ARRANGE
  const mockUserModel = {
    findOne: jest.fn().mockResolvedValue({ id: 1, email: 'existing@example.com' })
  };

  // ACT & ASSERT
  await expect(registerUser('existing@example.com', 'Password123!', mockUserModel))
    .rejects.toThrow('Email already registered');
});

it('should return error object when database fails', async () => {
  // ARRANGE
  const mockUserModel = {
    create: jest.fn().mockRejectedValue(new Error('Connection failed'))
  };

  // ACT
  const result = await registerUser('test@example.com', 'Password123!', mockUserModel);

  // ASSERT
  expect(result.success).toBe(false);
  expect(result.error).toContain('Connection failed');
});
```

### Scenario 4: Edge Cases and Invalid Inputs

```javascript
describe('calculateDiscount', () => {
  it('should handle null price gracefully', () => {
    expect(() => calculateDiscount(null, 10)).toThrow('Price required');
  });

  it('should handle undefined discount', () => {
    expect(() => calculateDiscount(100, undefined)).toThrow('Discount required');
  });

  it('should handle special characters in inputs', () => {
    expect(() => calculateDiscount('$100.00', 10)).toThrow('Invalid price format');
  });

  it('should handle negative numbers', () => {
    expect(() => calculateDiscount(-100, 10)).toThrow('Price cannot be negative');
  });

  it('should handle very large numbers', () => {
    const result = calculateDiscount(999999999.99, 50);
    expect(result).toBe(499999999.995);
  });
});
```

### Scenario 5: State Verification Tests

```javascript
it('should add item to cart and update total', () => {
  // ARRANGE
  const cart = { items: [], total: 0 };
  const product = { id: 1, price: 50 };

  // ACT
  addToCart(cart, product);

  // ASSERT - Verify state changed
  expect(cart.items.length).toBe(1);
  expect(cart.items[0].id).toBe(1);
  expect(cart.total).toBe(50);
});
```

### Scenario 6: Interaction/Communication Tests

```javascript
it('should call bcrypt.hash when registering user', async () => {
  // ARRANGE
  const mockBcrypt = {
    hash: jest.fn().mockResolvedValue('hashed_password')
  };

  // ACT
  await registerUser('test@example.com', 'password123', mockBcrypt);

  // ASSERT - Verify the call
  expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', expect.any(Number));
});

it('should not call external email service during unit test', () => {
  // ARRANGE
  const mockEmailService = { send: jest.fn() };

  // ACT
  registerUser('test@example.com', 'password123', { emailService: mockEmailService });

  // ASSERT - Verify email was NOT sent (unit test should not send emails)
  expect(mockEmailService.send).not.toHaveBeenCalled();
});
```

---

## Best Practices

### ✅ DO

- [ ] **Write descriptive names** - Test name should explain what/why
- [ ] **Use AAA pattern** - Clear Arrange, Act, Assert sections
- [ ] **Test one thing** - Single responsibility per test
- [ ] **Use realistic test data** - Not just "test", use "user@example.com"
- [ ] **Verify behavior, not implementation** - Test what it does, not how
- [ ] **Keep tests independent** - Tests should not depend on each other
- [ ] **Use jest.fn() for mocks** - Consistent mocking approach
- [ ] **Expect specific values** - Not just truthy/falsy
- [ ] **Test error paths** - Not just happy path
- [ ] **Comment author on each test** - "// Kim Shi Tong, A0265858J"

### ❌ DON'T

- [ ] **Test private methods** - Only test public interface
- [ ] **Test implementation details** - Test behavior
- [ ] **Create test interdependencies** - Each test must be independent
- [ ] **Use generic test names** - "test1", "test case 2"
- [ ] **Mock everything** - Only mock external dependencies
- [ ] **Write overly complex tests** - Keep them readable
- [ ] **Test multiple things in one test** - Violates single responsibility
- [ ] **Use vague assertions** - Be specific with expect()
- [ ] **Skip error cases** - Important part of testing
- [ ] **Forget to clean up** - Use afterEach() for cleanup

---

## Assertion Examples (Jest/Expect)

```javascript
// Basic assertions
expect(result).toBe(5);                           // Exact equality
expect(result).toEqual({ name: 'John' });        // Deep equality
expect(result).not.toBe(null);                   // Negation

// Truthiness
expect(result).toBeTruthy();
expect(result).toBeFalsy();
expect(result).toBeDefined();
expect(result).toBeNull();

// Numbers
expect(result).toBeGreaterThan(10);
expect(result).toBeLessThan(20);
expect(result).toBeCloseTo(3.14, 2);             // Floating point

// Strings
expect(email).toMatch(/@example\.com/);          // Regex
expect(message).toContain('Error');              // Substring

// Arrays
expect(items).toHaveLength(3);
expect(items).toContain('apple');
expect(items).toEqual(expect.arrayContaining(['apple', 'banana']));

// Objects
expect(user).toHaveProperty('email');
expect(user).toEqual(expect.objectContaining({ email: 'test@example.com' }));

// Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('param1', 'param2');
expect(mockFn).toHaveBeenCalledTimes(1);

// Errors
expect(() => throwError()).toThrow();
expect(() => throwError()).toThrow('Error message');
await expect(asyncFn()).rejects.toThrow();
```

---

## File Organization

```javascript
// test-file.test.js

/**
 * Unit Tests for [ComponentName]
 * Author: [Your Name, Student ID]
 * Date: [Date]
 */

describe('ComponentName', () => {
  let dependency1, dependency2;

  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName1', () => {
    it('should ...', () => {});
    it('should ...', () => {});
  });

  describe('methodName2', () => {
    it('should ...', () => {});
    it('should ...', () => {});
  });
});
```

---

## Rubric Alignment Checklist

Before submitting, verify:

- [ ] **Correctness of Unit Tests (2%)**
  - [ ] Each test tests a single unit in isolation
  - [ ] Dependencies properly mocked/stubbed (not testing them)
  - [ ] Tests can run in any order (no interdependencies)
  - [ ] All tests pass
  - [ ] Real vs Mock decisions made intentionally

- [ ] **Code Quality (1%)**
  - [ ] AAA pattern used consistently
  - [ ] Meaningful test names (describe behavior)
  - [ ] Easy to read and understand
  - [ ] Assertions are specific and clear
  - [ ] Proper setup and cleanup

---

## Next Steps

1. Write tests according to this standard
2. Ensure all tests pass
3. Check coverage meets target (80%)
4. Move to reviewer.md for quality verification

