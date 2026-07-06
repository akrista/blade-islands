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

This package provides the browser runtime. The Blade directives that render island placeholders live in the companion Laravel package [`akrista/blade-islands`](https://github.com/akrista/laravel-blade-islands).

## Contents

- [Why Blade Islands?](#why-blade-islands)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [DOM Contract](#dom-contract)
- [Entry Points](#entry-points)
- [Vite Setup](#vite-setup)
- [Component Resolution](#component-resolution)
- [Custom Root](#custom-root)
- [Preserve Mounted Islands](#preserve-mounted-islands)
- [Multiple Frameworks](#multiple-frameworks)
- [Props](#props)
- [Options](#options)
- [API Reference](#api-reference)
- [SSR &amp; No-JavaScript](#ssr--no-javascript)
- [Requirements](#requirements)
- [Companion Package](#companion-package)
- [Blade Islands vs X](#blade-islands-vs-x)
- [Troubleshooting](#troubleshooting)
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

## DOM Contract

The companion Laravel package renders placeholder elements that this runtime looks for. Each placeholder is a `<div>` with a set of `data-*` attributes:

| Attribute       | Always emitted | Description                                                                                              |
| --------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `data-island`   | yes            | Framework marker. One of `react`, `vue`, or `svelte`. Matches the entry point you import.                |
| `data-component`| yes            | Component name, relative to your island root. Nested folders use `/` (for example `Billing/Invoices/Table`). |
| `data-props`    | yes            | JSON-encoded props object. The value is HTML-escaped; the runtime decodes it transparently via `element.dataset.props`. |
| `data-preserve` | when preserved | `true` if the island was rendered with `preserve: true`. Tells the runtime to keep the mounted instance across repeat boot passes. |
| `data-key`      | when preserved | Stable identifier for the island. Defaults to `{framework}:{component}` (lowercased) when not provided. Used to keep the DOM identity stable across renders. |

A placeholder rendered by `@react('Account/UsageChart', ['stats' => $stats], preserve: true, key: 'usage-chart')` looks like:

```html
<div
    data-island="react"
    data-component="Account/UsageChart"
    data-props="&quot;stats&quot;:{&quot;revenue&quot;:4200}"
    data-preserve="true"
    data-key="usage-chart"
></div>
```

This runtime only scans elements whose `data-island` matches the framework you imported. The placeholders themselves contain no rendered output until JavaScript runs, so they degrade gracefully — see [SSR &amp; No-JavaScript](#ssr--no-javascript).

## Entry Points

Blade Islands provides framework-specific entry points:

```js
import islands from 'blade-islands/react';
import islands from 'blade-islands/vue';
import islands from 'blade-islands/svelte';
```

Each entry point mounts only its own island type and ignores the others, so you can ship more than one framework in the same app — see [Multiple Frameworks](#multiple-frameworks).

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

Use `preserve: true` when the same DOM is processed more than once and you want Blade Islands to keep an existing island mounted instead of unmounting and remounting it.

This is useful when the page or a DOM fragment is recalculated and your frontend boot logic runs again — for example, after a Livewire or Turbo update re-runs your entry script.

```php
@react('Dashboard/RevenueChart', ['stats' => $stats], preserve: true)
@vue('Dashboard/RevenueChart', ['stats' => $stats], preserve: true)
@svelte('Dashboard/RevenueChart', ['stats' => $stats], preserve: true)
```

When `preserve` is `true`:

- on the first mount, the island is mounted and tracked by element reference
- on subsequent boot passes, the same element is detected and skipped

When `preserve` is `false` (the default), the previous instance is unmounted and a new one is created with the latest props. This is the right behavior when props change but the element identity does not.

The Laravel package also emits a `data-key` attribute for preserved islands. By default it is `{framework}:{component}` (lowercased), but you can pass an explicit `key` argument so each instance is uniquely identifiable — important when you reuse the same component in a loop:

```php
@foreach ($products as $product)
    @react('Product/Card', ['product' => $product], preserve: true, key: "product-{$product->id}")
@endforeach
```

The runtime tracks preserved instances by DOM element reference, so the explicit key keeps the HTML stable across server-side re-renders and prevents the runtime from remounting a freshly-emitted placeholder.

## Multiple Frameworks

Each entry point scans only for its own `data-island` value, so you can mix frameworks in the same app. Call each entry's default export once:

```js
// resources/js/app.js
import reactIslands from 'blade-islands/react';
import vueIslands from 'blade-islands/vue';

reactIslands();
vueIslands();
```

Keep the components glob for each framework in its own call when you need custom roots:

```js
import reactIslands from 'blade-islands/react';
import vueIslands from 'blade-islands/vue';

reactIslands({
  root: '/resources/js/react-islands',
  components: import.meta.glob('/resources/js/react-islands/**/*.{jsx,tsx}'),
});

vueIslands({
  root: '/resources/js/vue-islands',
  components: import.meta.glob('/resources/js/vue-islands/**/*.vue'),
});
```

## Props

Props are passed from Blade as a PHP array and serialized into the `data-props` attribute as JSON. Anything that round-trips through `json_encode` / `JSON.parse` is supported, including:

- strings, numbers, booleans, `null`
- arrays and nested objects
- ISO date strings (parse them on the frontend)

These are **not** supported because they cannot survive JSON serialization:

- closures, functions, or any callable
- PHP resources
- live Eloquent model instances (use the array or a DTO instead)

Example with a complex prop:

```php
@react('Orders/Table', [
    'orders' => $orders->map(fn ($order) => [
        'id' => $order->id,
        'total' => $order->total,
        'placedAt' => $order->placed_at->toIso8601String(),
    ])->all(),
    'currency' => 'USD',
])
```

On the frontend:

```jsx
export default function OrdersTable({ orders, currency }) {
  // ...
}
```

## Options

Each entry point exports a default `islands()` function:

```js
islands({
  root: '/resources/js/islands',
  components: import.meta.glob('/resources/js/islands/**/*.{jsx,tsx}'),
});
```

- `root` — component root used to derive names such as `Billing/Invoices/Table`. Trailing slashes are ignored. Defaults to `/resources/js/islands`.
- `components` — Vite `import.meta.glob(...)` map for the current framework. The default entry points ship a glob that matches the default root; you only need to override this when you change the root or limit the file extensions you want to match.

The function is idempotent. Calling it again with the same options is safe — preserved islands stay mounted, non-preserved islands are remounted with their latest props.

## API Reference

```js
import islands from 'blade-islands/react'; // or /vue, /svelte

islands(options?);
```

**Parameters**

- `options` _(optional)_
  - `root` _(`string`, default `'/resources/js/islands'`)_ — base path used to compute component names. The `data-component` value on a placeholder is resolved relative to this root.
  - `components` _(`Record<string, () => Promise<{ default: Component }>>`, default `import.meta.glob(...)` from the matching entry point)_ — map of file paths to dynamic imports. The key must include the leading `/` and the full file extension.

**Returns** — `void`.

**Side effects**

- Scans `document` for elements matching the framework's selector (`[data-island="react"]`, `[data-island="vue"]`, or `[data-island="svelte"]`).
- If called before `DOMContentLoaded`, waits for the event before scanning.
- Mounts each matching component. Errors are caught and logged via `console.error`; one failing island does not block the others.

## SSR &amp; No-JavaScript

The placeholders emitted by the Laravel package are empty `<div>` elements, so a Blade page with islands renders the same way with JavaScript disabled as it would on the server side of a typical island-architecture site. The placeholders take no visual space until the runtime mounts the component.

If you want progressive enhancement, render a server-side fallback in a sibling element and remove it once the island is mounted, or use CSS to hide the placeholder until JavaScript runs:

```html
<style>
    [data-island] { visibility: hidden; }
    [data-island]:empty { display: none; }
</style>
```

If you need fully styled no-JS fallbacks, render them manually around the directive:

```blade
<button type="button" data-js-required>
    {{ $cart->count() }} items in cart
</button>
@react('Cart/Button', ['count' => $cart->count()])
```

…and let the component replace the static markup once it boots. The placeholder itself is always an empty `<div>`.

## Requirements

- Vite
- React 18+ for `blade-islands/react`
- Vue 3+ for `blade-islands/vue`
- Svelte 5+ for `blade-islands/svelte`

## Companion Package

This runtime expects Blade placeholders generated by the Laravel package:

- Composer package: `akrista/blade-islands`
- Repository: [github.com/akrista/laravel-blade-islands](https://github.com/akrista/laravel-blade-islands)

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

## Troubleshooting

**`[blade-islands] No react islands were found`**

The `data-island` attribute on the placeholder does not match the framework you imported, or the placeholder was not emitted by the Laravel package. Inspect the rendered HTML and confirm `<div data-island="react" ...>` is present.

**`[blade-islands] react island "Account/UsageChart" was not found`**

The component name in `data-component` has no matching file under the configured `root`. Check that the file exists and matches the glob you provided. Names use `/` for nested folders and must omit the file extension.

**`[blade-islands] No component loaders were configured for react`**

You passed an explicit `components` map that was empty or falsy. If you are overriding the default, double-check the `import.meta.glob(...)` pattern.

**`[blade-islands] Failed to mount: react support is not available. Install the react runtime to mount these islands.`**

The framework peer dependency is not installed. Run `npm install react react-dom` (or the equivalent for your framework) and make sure it is reachable from your build.

**My component mounts but its state resets on every page navigation**

You are not preserving the instance. Mark the island as `preserve: true` and give it a stable `key` so the runtime can recognize the same element across re-renders.

**My Vite build is large even though I only use a few islands**

Vite splits the chunks, but every import.meta.glob path is included in the bundle. Use a more specific glob (for example `/resources/js/islands/**/*.jsx` instead of `**/*`) and confirm your islands live under the configured root, not elsewhere in the project.

**Props arrive as strings**

`data-props` is a JSON object; the runtime parses it with `JSON.parse`. If you see a string, your custom Blade wrapper likely re-encoded the value twice (for example, calling `e()` after the directive output), or you rendered the JSON inside `{{ }}` instead of `{!! !!}`. The companion Laravel package handles encoding for you — render it as-is from the directive.

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
