# Cross-Module Patterns

Shared learnings that apply across all modules. Updated by experience_consolidate after each module.

---

## Validation Patterns

_Add effective validation test cases here as they're discovered._

<!--
Example format:
### Email Validation
- Boundary: TLD length 2/3/4 catches regex errors (found in auth)
- Always test: missing @, spaces, plus addressing
- High-value: test at min TLD length (user@example.c → should fail)
-->

## Mocking Strategies

_Add mock vs real decisions here as they're discovered._

<!--
Example format:
### When to Use REAL Dependencies
- bcrypt/JWT: Always real (security-critical, mocks hide bugs)
- Helpers: Real unless testing caller in isolation

### When to MOCK
- External APIs (email, payment): Always mock (slow, unreliable)
- Database: Mock in unit tests, real (mongodb-memory-server) in integration
-->

## Test Data Patterns

_Add effective boundary values and edge cases here._

<!--
Example format:
### Password Fields
- Boundary: min-1 (7 chars), min (8 chars), min+1 (9 chars)
- Edge: null, undefined, empty string (test separately)
- Edge: very long input (128+ chars)
-->

## Jest / Playwright Conventions

_Add patterns that worked well across modules._

<!--
Example format:
- Test naming: "should <action> when <condition>"
- AAA pattern: Arrange → Act → Assert (always)
- Selectors: data-testid preferred over CSS selectors
- Waits: waitForNavigation after form submissions
-->

## Preferences & Conventions

_Team preferences discovered during testing._

<!--
Example format:
- Author attribution: // Kim Shi Tong, A0265858J
- Coverage target: 80%+
- Integration approach preference: bottom-up for this codebase
- mongodb-memory-server: needs 45s first download, plan for it
-->
