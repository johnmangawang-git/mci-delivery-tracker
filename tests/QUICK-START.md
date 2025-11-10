# DataService Tests - Quick Start Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```

That's it! You should see 30 tests pass.

## 📊 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode (auto-rerun) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ui` | Run tests with interactive UI |

## ✅ What's Tested

- **Initialization** (3 tests)
  - Service setup and error handling
  
- **saveDelivery()** (7 tests)
  - Creating new deliveries
  - Updating existing deliveries
  - Validation of required fields
  
- **getDeliveries()** (6 tests)
  - Filtering by status
  - Custom field filters
  - Empty results handling
  
- **saveCustomer()** (6 tests)
  - Customer validation
  - Name normalization
  - Required field checks
  
- **Error Handling** (8 tests)
  - Network errors
  - Database errors
  - Logging verification

## 🔍 Verify Setup

```bash
node verify-dataservice-tests.js
```

This will check:
- ✅ All test files exist
- ✅ Dependencies are installed
- ✅ Scripts are configured
- ✅ Requirements are covered

## 📖 More Information

See [tests/README.md](./README.md) for detailed documentation.

## 🐛 Troubleshooting

### Tests won't run
```bash
# Make sure dependencies are installed
npm install

# Try running with npx
npx vitest run
```

### Import errors
The tests use ES modules. Make sure your Node.js version is 14+.

### Mock issues
Check that `tests/setup.js` is being loaded correctly in `vitest.config.js`.

## 💡 Tips

1. **Watch mode** is great for development - tests rerun automatically
2. **Coverage report** shows which code paths need more tests
3. **UI mode** provides a visual interface for debugging tests
4. Tests run fast - no need for a real database!

## 📝 Example Test Output

```
✓ tests/dataService.test.js (30)
  ✓ DataService (30)
    ✓ Initialization (3)
    ✓ saveDelivery() (7)
    ✓ getDeliveries() (6)
    ✓ saveCustomer() (6)
    ✓ Error Handling (8)

Test Files  1 passed (1)
     Tests  30 passed (30)
  Duration  1.23s
```

## 🎯 Next Steps

After running these tests successfully:
1. Review the test coverage report
2. Add more tests for edge cases if needed
3. Proceed to Task 17: Integration tests
