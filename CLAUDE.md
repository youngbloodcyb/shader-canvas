# Bash commands

- pnpm build: Build the project
- pnpm test: Run tests with vitest

# Code style

- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')
- Do not use barrel imports
- Do not use default exports when possible
- Comment functions with their purpose
  ```
  /**
    * Parses a string and turns it into a number
    * @params string: The string to parse
    * @returns number: The number parsed from the string
  */
  ```
- use kebab-case for all file names (eg. `infinite-canvas.tsx`)

# Workflow

- Be sure to typecheck when you’re done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
