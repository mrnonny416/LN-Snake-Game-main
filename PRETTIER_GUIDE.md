# Prettier Configuration Guide

## 🎨 Tailwind CSS Class Sorting

The project is configured with Prettier and the `prettier-plugin-tailwindcss` plugin to automatically sort and organize your Tailwind CSS classes in a consistent, logical order.

### Class Sorting Order

Prettier will automatically organize your Tailwind classes in this logical sequence:

1. **Layout & Display** - `flex`, `grid`, `block`, `inline`, `relative`, `absolute`, etc.
2. **Sizing** - `w-*`, `h-*`, `min-w-*`, `max-w-*`, `min-h-*`, `max-h-*`
3. **Spacing** - `p-*`, `m-*`, `px-*`, `py-*`, `mx-*`, `my-*`, etc.
4. **Colors** - `bg-*`, `text-*`, `border-*`, `fill-*`, `stroke-*`
5. **Typography** - `font-*`, `text-*`, `leading-*`, `tracking-*`
6. **Borders** - `border-*`, `rounded-*`, `outline-*`
7. **Effects** - `shadow-*`, `opacity-*`, `transform-*`
8. **Animations** - `animate-*`, `transition-*`, `duration-*`, `delay-*`
9. **States** - `hover:*`, `focus:*`, `active:*`, `group-*`, etc.
10. **Responsive** - `md:*`, `lg:*`, `sm:*`, etc.

### Installation

First, install dependencies:

```bash
npm install
```

or

```bash
yarn install
```

### Usage

#### Format all files:

```bash
npm run format
```

#### Check formatting without modifying:

```bash
npm run format:check
```

#### Format specific file (in terminal):

```bash
npx prettier --write path/to/file.tsx
```

### VS Code Integration (Recommended)

1. Install the **Prettier - Code formatter** extension (`esbenp.prettier-vscode`)
2. Install the **Tailwind CSS IntelliSense** extension (`bradlc.vscode-tailwindcss`)

Then configure VS Code to format on save:

```json
// settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[tailwindcss]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Example

**Before (unsorted classes):**

```tsx
<div className="flex items-center justify-center rounded-lg bg-blue-500 p-4 text-white shadow-lg hover:bg-blue-600 md:p-8">
  Content
</div>
```

**After (Prettier formats it):**

```tsx
<div className="flex items-center justify-center rounded-lg bg-blue-500 p-4 shadow-lg hover:bg-blue-600 md:p-8">
  Content
</div>
```

### Configuration File

The `.prettierrc.json` file contains:

- **semi**: true - Require semicolons
- **singleQuote**: false - Use double quotes
- **trailingComma**: "es5" - Add trailing commas where valid
- **printWidth**: 100 - Line length limit
- **tabWidth**: 2 - Indentation size
- **plugins**: Includes `prettier-plugin-tailwindcss` for class sorting

### Ignore Files

Files listed in `.prettierignore` will be skipped during formatting:

- `node_modules`
- `.next`
- `dist`, `build`, `coverage`
- Minified files
- `public/pure-js-version`

## 💡 Tips

- Prettier should be run before committing code
- The plugin respects custom Tailwind config (`tailwind.config.ts`)
- Class sorting is deterministic - same input always produces same output
- Compatible with all Tailwind CSS utilities and custom classes
