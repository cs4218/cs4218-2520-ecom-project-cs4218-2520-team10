---
name: Integration Test Implementer
description: Implement integration tests following MS2 standards with proper component interaction
type: agent-implementer
test_type: integration
---

# Integration Test Implementer - MS2 Standard

**Implement integration tests for real component interactions.**

---

## Key Difference from Unit Tests

| Aspect | Unit Tests | Integration Tests |
|--------|---|---|
| Scope | 1 function | 2+ components |
| Isolation | Mock everything | Mock only external |
| Dependencies | All mocked | Some real, some mocked |
| Database | Mocked | Real (in-memory) or mocked |
| Testing | Business logic | Component interactions |
| Focus | Function behavior | Data flow between components |

---

## Prerequisites

- [ ] Planning complete (See agent.md output)
- [ ] All test scenarios planned
- [ ] Mock strategy decided
- [ ] Component pairs identified
- [ ] Ready to write code

---

## Code Quality Standards

Integration tests use **same standards as unit tests** (AAA pattern, clear naming, etc.)

### Standard: AAA Pattern (Arrange-Act-Assert)

```javascript
describe('ComponentAController and ComponentBModel integration', () => {
  it('should [action] when [components interact in this way]', () => {
    // ARRANGE: Set up both components and test data
    const componentA = new ControllerA();
    const componentB = new ModelB();
    const testData = { /* ... */ };
    const mockExternal = jest.fn();

    // ACT: Components interact
    const result = componentA.doSomething(testData, componentB, mockExternal);

    // ASSERT: Verify results AND side effects
    expect(result).toBe(expectedValue);
    expect(mockExternal).toHaveBeenCalledWith(expectedCall);
    // Verify componentB state changed
    const savedData = componentB.getData();
    expect(savedData).toEqual(expectedData);
  });
});
```

### Standard: Meaningful Test Names

**Format:** `should <outcome> when <components interact this way>`

```javascript
// ✅ GOOD: Describes interaction
it('should save user with hashed password when registerController calls userModel', () => {});
it('should return 400 error when registerController receives duplicate email', () => {});
it('should update product and reduce stock when orderController places order', () => {});

// ❌ BAD: Unclear
it('should test registration', () => {});
it('should work correctly', () => {});
it('test1', () => {});
```

### Standard: Test Organization

```javascript
describe('authController and userModel integration', () => {
  let controller;
  let model;
  let mockDatabase;

  beforeEach(() => {
    controller = new AuthController();
    model = new UserModel();
    mockDatabase = { save: jest.fn() };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register flow', () => {
    it('should ...', () => {});
    it('should ...', () => {});
  });

  describe('password handling', () => {
    it('should ...', () => {});
  });
});
```

---

## Integration Testing Patterns

### Pattern 1: High-Level + Low-Level Component Integration

**Test:** Higher component calls lower component, data flows correctly

**Template:**
```javascript
describe('[HighLevelComponent] and [LowLevelComponent] integration', () => {
  it('should [expected behavior] when [component A] calls [component B]', async () => {
    // ARRANGE
    const componentA = new HighLevelComponent();
    const componentB = new LowLevelComponent();
    const testData = { /* realistic test data */ };

    // ACT
    const result = await componentA.doSomething(
      testData,
      componentB  // Real component, not mocked
    );

    // ASSERT
    expect(result).toHaveProperty('expectedProperty');

    // Verify component B was affected
    const saved = await componentB.retrieve(testData.id);
    expect(saved).toBeDefined();
    expect(saved.someField).toBe(expectedValue);
  });
});
```

**Adapt to your project:**
- Replace `[HighLevelComponent]` with your actual component names
- Replace `testData` with realistic test data for your domain
- Adjust assertions to match what your components actually return

### Pattern 2: Multiple Components + External Library Integration

**Test:** Multiple components working together with a library

**Template:**
```javascript
describe('[ComponentA], [ComponentB], and [Library] integration', () => {
  it('should [behavior] through multiple components', async () => {
    // ARRANGE
    const componentA = new ComponentA();
    const componentB = new ComponentB();
    const inputData = 'originalData';

    // ACT
    const result = await componentA.process(
      inputData,
      componentB
    );

    // ASSERT - Check interaction
    expect(result.success).toBe(true);

    // Verify component B processed it
    const stored = await componentB.retrieve();
    expect(stored).not.toBe(inputData); // Transformed, not original

    // Verify library was used (check format/structure)
    expect(stored).toMatch(/expectedPattern/);

    // Verify transformation works both ways
    const verified = await verifyTransformation(inputData, stored);
    expect(verified).toBe(true);
  });
});
```

**Adapt to your project:**
- Replace component names with your actual components
- Replace library reference with your actual library
- Adjust assertions to match your transformation logic

### Pattern 3: Component + Database Integration

**Test:** Component + Real (or In-Memory) Database

**Template:**
```javascript
describe('[Component] and database integration', () => {
  let db;
  let component;

  beforeAll(async () => {
    // Start test database (configure for your DB type)
    db = await setupTestDatabase();
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
    await db.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await db.clearCollections();
  });

  it('should save and retrieve data from database', async () => {
    // ARRANGE
    component = new YourComponent();
    const testData = {
      field1: 'value1',
      field2: 'value2'
    };

    // ACT
    const created = await component.create(testData);

    // ASSERT
    expect(created.id).toBeDefined();

    // Verify in actual database
    const retrieved = await component.retrieve(created.id);
    expect(retrieved.field1).toBe('value1');
    expect(retrieved.field2).toBe('value2');
  });
});
```

**Adapt to your project:**
- Replace `setupTestDatabase()` with your database setup (mongodb-memory-server, H2, testcontainers, etc.)
- Replace `YourComponent` with actual component name
- Adjust test data and assertions to match your schema

### Pattern 4: Error Handling Between Components

**Test:** How components handle failures in each other

**Template:**
```javascript
describe('[ComponentA] and [ComponentB] error handling', () => {
  it('should handle external service error gracefully', async () => {
    // ARRANGE
    const componentA = new YourComponent();
    const mockExternal = {
      call: jest.fn().mockRejectedValue(new Error('Service unavailable'))
    };

    // ACT
    const result = await componentA.doSomething(data, mockExternal);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.error).toContain('unavailable');
    expect(mockExternal.call).toHaveBeenCalled();
  });

  it('should reject invalid data when component validation fails', async () => {
    // ARRANGE
    const componentA = new YourComponent();
    const componentB = new AnotherComponent();
    const invalidData = { /* invalid structure */ };

    // ACT
    const result = await componentA.process(invalidData, componentB);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });
});
```

**Adapt to your project:**
- Replace component names and method names
- Define what "invalid" means for your data
- Adjust error messages to match your error handling

### Pattern 5: Data Transformation Between Components

**Test:** Data transforms correctly through components

**Template:**
```javascript
describe('[ComponentA] and [ComponentB] data transformation', () => {
  it('should transform data correctly through flow', async () => {
    // ARRANGE
    const componentA = new YourComponent();
    const mockService = {
      process: jest.fn().mockResolvedValue({ result: 'processed' })
    };
    const inputData = {
      field1: 'value1',
      field2: 'value2'
    };

    // ACT
    const result = await componentA.handleData(inputData, mockService);

    // ASSERT
    expect(result.success).toBe(true);

    // Verify data was transformed correctly
    expect(mockService.process).toHaveBeenCalledWith(
      expect.objectContaining({
        transformed: true,
        originalField: 'value1'
      })
    );

    // Verify result has expected structure
    expect(result.processed).toBe('processed');
  });
});
```

**Adapt to your project:**
- Define input data structure for your domain
- Specify how data should be transformed
- Verify both the transformation and the result

---

## Mocking Strategy for Integration Tests

### When to Mock vs Keep Real

**Keep REAL:**
- ✅ Components you're testing
- ✅ Internal interactions between them
- ✅ Database (use in-memory)
- ✅ Helpers/utilities you wrote
- ✅ Hashing, JWT (security-critical)

**Mock:**
- ❌ External APIs (Braintree, email, etc.)
- ❌ Slow services
- ❌ Third-party libraries (for specific testing)
- ❌ Non-deterministic systems

**Example:**
```javascript
// ✅ GOOD: Testing interaction
const controller = new AuthController(); // Real
const model = new UserModel();           // Real
const mockEmailService = jest.fn();      // Mock external

await controller.register(email, password, model, mockEmailService);
expect(mockEmailService).not.toHaveBeenCalled(); // Unit test, not sending emails

// ❌ BAD: Mocking too much (not testing integration)
const mockModel = jest.fn();  // Don't mock - you want to test the interaction!
const mockController = jest.fn();
```

---

## Test Assertions for Integration

### Assert on Multiple Levels

```javascript
it('should process order through multiple components', async () => {
  // Setup
  const orderController = new OrderController();
  const inventoryService = new InventoryService();
  const mockPayment = { process: jest.fn() };

  // Execute
  const result = await orderController.checkout(order, inventoryService, mockPayment);

  // ASSERT: Multiple levels

  // 1. Response level
  expect(result.success).toBe(true);
  expect(result.orderId).toBeDefined();

  // 2. Component interaction level
  expect(mockPayment.process).toHaveBeenCalledWith(expectedAmount);

  // 3. State change level
  const inventory = await inventoryService.getStock(productId);
  expect(inventory).toBe(previousStock - quantity);

  // 4. Data flow level
  const order = await Order.findById(result.orderId);
  expect(order.status).toBe('completed');
  expect(order.items).toEqual(expectedItems);
});
```

---

## Setup/Teardown for Integration

```javascript
describe('Integration tests', () => {
  let db;

  // Run once before all tests
  beforeAll(async () => {
    db = await MongoMemoryServer.create();
    await mongoose.connect(db.getUri());
  });

  // Run after all tests
  afterAll(async () => {
    await mongoose.disconnect();
    await db.stop();
  });

  // Clear database before each test
  beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    jest.clearAllMocks();
  });

  // Cleanup after each test (optional if beforeEach clears)
  afterEach(async () => {
    // Cleanup if needed
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

---

## Best Practices

### ✅ DO

- [ ] Test real component interactions
- [ ] Use AAA pattern
- [ ] Clear test names describe the interaction
- [ ] Setup realistic test data
- [ ] Assert on both response AND side effects
- [ ] Mock only external dependencies
- [ ] Keep tests independent
- [ ] Use in-memory database
- [ ] Comment author on each test file
- [ ] Verify data flows correctly

### ❌ DON'T

- [ ] Mock components you're testing
- [ ] Skip error scenarios
- [ ] Use vague assertions (just truthy/falsy)
- [ ] Create test interdependencies
- [ ] Test at wrong level (not true integration)
- [ ] Forget cleanup (beforeEach/afterEach)
- [ ] Over-mock (mock everything just because)
- [ ] Ignore database state
- [ ] Test implementation details
- [ ] Skip author attribution

---

## Assertion Examples

```javascript
// Component interaction
expect(mockService).toHaveBeenCalledWith(expectedParam);
expect(result).toEqual(expectedObject);

// Data state
const user = await User.findById(userId);
expect(user.status).toBe('active');

// Error handling
expect(() => action()).toThrow('Error message');
await expect(asyncAction()).rejects.toThrow();

// Multiple assertions per test (OK for integration)
expect(result.success).toBe(true);
expect(result.data).toBeDefined();
expect(savedObject.state).toBe('updated');
```

---

## File Organization

**Follow your project's conventions:**

```javascript
/**
 * Integration Tests: [ComponentA]-[ComponentB]
 * Author: [Your Name], [Your ID/Email]
 * Tests: [ComponentA] + [ComponentB] interaction
 */

describe('[ComponentA] and [ComponentB] integration', () => {
  // Setup
  // Tests
});
```

**Adapt to your project's style:**
- Use your project's file naming convention
- Use your project's comment/documentation format
- Match existing test file structure

---

## MS2 Correctness Checklist

Before submitting, verify:

- [ ] **Real Interaction (1%)**
  - [ ] 2+ components actually interact
  - [ ] Not everything mocked
  - [ ] Data flows between components
  - [ ] Both components' behavior verified

- [ ] **Appropriate Mocking**
  - [ ] External dependencies mocked (APIs, etc.)
  - [ ] Internal components NOT mocked
  - [ ] Mocks return realistic data
  - [ ] No over-mocking

- [ ] **Code Quality**
  - [ ] AAA pattern used
  - [ ] Clear test names
  - [ ] Organized with describe blocks
  - [ ] Setup/cleanup proper
  - [ ] Author attribution present

---

## Next Steps

1. Write tests according to this standard
2. Ensure all tests pass
3. Move to reviewer.md for quality verification

