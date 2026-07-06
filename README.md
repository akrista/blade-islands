# 🏝️ Blade Islands For Laravel

<p align="center">
  <img src="art/header.png" alt="Blade Islands for Laravel" width="1024">
</p>

[![NPM Version](https://img.shields.io/npm/v/blade-islands)](https://www.npmjs.com/package/blade-islands)
[![NPM Downloads](https://img.shields.io/npm/dm/blade-islands)](https://www.npmjs.com/package/blade-islands)
[![License](https://img.shields.io/npm/l/blade-islands)](LICENSE)

> **Fork notice:** This is a maintained fork of [`eznix86/blade-islands`](https://github.com/eznix86/blade-islands). The original implementation was created by **Bruno Bernard** ([github.com/eznix86](https://github.com/eznix86)). All credit for the original design goes to him. This fork is maintained by [Akrista](https://github.com/akrista) under the same MIT license.

Client-side island runtime for Blade.

Blade Islands lets you render small React, Vue, or Svelte components inside Laravel Blade views without turning your application into a full single-page app.

This package provides the browser runtime. The Blade directives that render island placeholders live in the companion Laravel package [`akrista/blade-islands`](https://github.com/akrista/blade-islands).

## Contents

- [Why Blade Islands?](#why-blade-islands)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Entry Points](#entry-points)
- [Vite Setup](#vite-setup)
- [Component Resolution](#component-resolution)
- [Custom Root](#custom-root)
- [Preserve Mounted Islands](#preserve-mounted-islands)
- [Options](#options)
- [Requirements](#requirements)
- [Companion Package](#companion-package)
- [Blade Islands vs X](#blade-islands-vs-x)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Why Blade Islands?

Blade Islands works well when your application is mostly server-rendered but still needs interactive UI in places such as:

- search inputs
- dashboards
- maps
- counters
- filters
- dialogs

Instead of building entire pages in a frontend framework, you can keep Blade as your primary rendering layer and hydrate only the parts of the page that need JavaScript.

## Installation

Install Blade Islands, your frontend framework, and the matching Vite plugin.

### React

```bash
npm install blade-islands react react-dom @vitejs/plugin-react
```

### Vue

```bash
npm install blade-islands vue @vitejs/plugin-vue
```

### Svelte

```bash
npm install blade-islands svelte @sveltejs/vite-plugin-svelte
```

## Quick Start

Add the runtime to `resources/js/app.js`, load that entry from your Blade layout, and render an island from Blade.

### React

`resources/js/app.js`

```js
import islands from 'blade-islands/react';

islands();
```

Blade layout:

```php
<head>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

```php
@react('ProfileCard', ['user' => $user])
```

Resolves to `resources/js/islands/ProfileCard.jsx`.

### Vue

`resources/js/app.js`

```js
import islands from 'blade-islands/vue';

islands();
```

Blade layout:

```php
<head>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

```php
@vue('ProfileCard', ['user' => $user])
```

Resolves to `resources/js/islands/ProfileCard.vue`.

### Svelte

`resources/js/app.js`

```js
import islands from 'blade-islands/svelte';

islands();
```

Blade layout:

```php
<head>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

```php
@svelte('ProfileCard', ['user' => $user])
```

Resolves to `resources/js/islands/ProfileCard.svelte`.

## How It Works

Blade Islands has two parts:

- the Laravel package renders island placeholders from Blade
- this package scans the DOM and mounts the matching frontend component

For example:

```php
@react('Account/UsageChart', ['stats' => $stats])
```

mounts:

```text
resources/js/islands/Account/UsageChart.jsx
```

## Entry Points

Blade Islands provides framework-specific entry points:

```js
import islands from 'blade-islands/react';
import islands from 'blade-islands/vue';
import islands from 'blade-islands/svelte';
```

Each entry point mounts only its own island type.

## Vite Setup

Register the plugin for the framework you use.

### React

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

If your Laravel layout loads a React entrypoint in development, include:

```php
@viteReactRefresh
```

### Vue

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
```

### Svelte

```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
});
```

## Component Resolution

By default, Blade Islands looks for components in `resources/js/islands`.

Nested folders work automatically. For example:

```php
@react('Billing/Invoices/Table', [...])
@vue('Billing/Invoices/Table', [...])
@svelte('Billing/Invoices/Table', [...])
```

These resolve to:

```text
resources/js/islands/Billing/Invoices/Table.jsx
resources/js/islands/Billing/Invoices/Table.vue
resources/js/islands/Billing/Invoices/Table.svelte
```

## Custom Root

If your components live outside the default root, pass both `root` and `components`:

```js
import islands from 'blade-islands/vue';

islands({
  root: '/resources/js/widgets',
  components: import.meta.glob('/resources/js/widgets/**/*.vue'),
});
```

Then:

```php
@vue('Dashboard', [...])
```

resolves to `resources/js/widgets/Dashboard.vue`.

## Preserve Mounted Islands

Use `preserve: true` when the same DOM is processed more than once and you want Blade Islands to keep an existing island mounted instead of mounting it again.

This is useful when the page or a DOM fragment is recalculated and your frontend boot logic runs again.

```php
@react('Dashboard/RevenueChart', ['stats' => $stats], preserve: true)
@vue('Dashboard/RevenueChart', ['stats' => $stats], preserve: true)
@svelte('Dashboard/RevenueChart', ['stats' => $stats], preserve: true)
```

If you reuse a preserved component in a loop, give each island a unique key on the Blade side so the runtime can distinguish them correctly:

```php
@foreach ($products as $product)
    @react('Product/Card', ['product' => $product], preserve: true, key: "product-{$product->id}")
@endforeach
```

## Options

Each entry point exports a default `islands()` function:

```js
islands({
  root: '/resources/js/islands',
  components: import.meta.glob('/resources/js/islands/**/*.{jsx,tsx}'),
});
```

- `root` - component root used to derive names such as `Billing/Invoices/Table`
- `components` - Vite `import.meta.glob(...)` map for the current framework

## Requirements

- Vite
- React 18+ for `blade-islands/react`
- Vue 3+ for `blade-islands/vue`
- Svelte 5+ for `blade-islands/svelte`

## Companion Package

This runtime expects Blade placeholders generated by the Laravel package:

- Composer package: `akrista/blade-islands`
- Repository: [github.com/akrista/blade-islands](https://github.com/akrista/blade-islands)

## Blade Islands vs X

### Inertia.js

Inertia is a better fit when your application wants React, Vue, or Svelte to render full pages with a JavaScript-first page architecture.

Blade Islands is a better fit when your application is already Blade-first and you want to keep server-rendered pages while hydrating only selected components.

### MingleJS

MingleJS is often used in Laravel applications that embed React or Vue components, especially in Livewire-heavy codebases.

Blade Islands is more naturally suited to Blade-first applications that want progressive enhancement with minimal architectural change. It does not depend on Livewire, and it may also be used alongside Livewire when that fits your application.

### Laravel UI

Laravel UI is a legacy scaffolding package for frontend presets and authentication views.

Blade Islands solves a different problem: adding targeted client-side interactivity to server-rendered Blade pages.

## Testing

```bash
npm install
npm test
npm run lint
```

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a focused branch
3. Add or update tests
4. Run `npm test`
5. Open a pull request with a clear summary

## License

MIT. See [LICENSE](LICENSE) for the full text. Copyright (c) 2026 Bruno Bernard. Copyright (c) 2026 Akrista.
