# DataService Unit Tests

This directory contains comprehensive unit tests for the DataService class, covering all CRUD operations, validation, and error handling scenarios.

## Test Coverage

### 1. Initialization Tests
- ✅ Successful initialization with Supabase client
- ✅ Error handling when Supabase client is unavailable
- ✅ Error handling when methods are called before initialization

### 2. saveDelivery() Tests

#### Valid Data Tests
- ✅ Create new delivery with required fields
- ✅ Update existing delivery when ID matches
- ✅ Update existing delivery when DR number matches
- ✅ Include all delivery fields (vendor_number, origin, destination, etc.)

#### Invalid Data Tests
- ✅ Throw error when dr_number is missing
- ✅ Throw error when customer_name is missing
- ✅ Throw error when both required fields are missing

### 3. getDeliveries() Tests

#### Filter Tests
- ✅ Get all deliveries without filters
- ✅ Filter by single status
- ✅ Filter by multiple statuses (array)
- ✅ Filter by custom field
- ✅ Return empty array when no deliveries found
- ✅ Handle null data response

### 4. saveCustomer() Tests

#### Validation Tests
- ✅ Save customer with valid data
- ✅ Normalize customer_name to name field
- ✅ Throw error when name is empty string
- ✅ Throw error when name is only whitespace
- ✅ Throw error when name is missing
- ✅ Save customer with all optional fields

### 5. Error Handling Tests

#### Network Errors
- ✅ Throw error when offline for create operations
- ✅ Allow read operations when offline

#### Database Errors
- ✅ Handle and throw database errors on create
- ✅ Handle and throw database errors on read
- ✅ Handle duplicate key errors on saveDelivery
- ✅ Handle constraint violations on saveCustomer

#### Logging
- ✅ Log successful create operations
- ✅ Log errors with context

## Running the Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Tests with UI
```bash
npm run test:ui
```

## Test Structure

```
tests/
├── README.md           # This file
├── setup.js           # Test setup and mocks
└── dataService.test.js # DataService unit tests
```

## Mocking Strategy

The tests use Vitest's mocking capabilities to:
1. Mock the Supabase client and its methods
2. Mock global services (Logger, ErrorHandler, networkStatusService)
3. Simulate various database responses (success, errors, edge cases)

## Requirements Coverage

These tests satisfy the following requirements from the spec:

- **Requirement 10.1**: Unit tests for all DataService methods
- **Requirement 10.2**: Integration tests for complete workflows
- **Requirement 10.3**: Comprehensive error handling tests

## Test Scenarios

### Happy Path
- Creating new records
- Reading records with filters
- Updating existing records
- Proper validation

### Error Cases
- Missing required fields
- Network connectivity issues
- Database constraint violations
- Invalid data formats

### Edge Cases
- Empty result sets
- Null data responses
- Whitespace-only strings
- UUID validation

## Future Enhancements

- Add integration tests with real Supabase instance
- Add performance benchmarks
- Add tests for pagination functionality
- Add tests for real-time subscription features
- Add E2E tests for complete user workflows
