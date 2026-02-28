# Unit Testing Framework

## Setup

Install dependencies:
```bash
npm install
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Writing Tests

Tests use Jest with ES modules. Place test files in `tests/` directory with `.test.mjs` extension.

Example:
```javascript
import { jest } from '@jest/globals';
import './setup.mjs';
import { YourClass } from '../src/module/path/to/file.mjs';

describe('YourClass', () => {
  it('does something', () => {
    expect(YourClass.method()).toBe(expected);
  });
});
```

## Mocked Globals

The `setup.mjs` file provides mocks for Foundry VTT globals:
- `game` (packs, i18n)
- `ui.notifications`
- `ChatMessage`
- `Item`
- `foundry.utils`
