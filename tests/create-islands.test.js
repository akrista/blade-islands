import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createIslands } from '../src/shared/create-islands.js';

function renderElement(attributes) {
  const element = document.createElement('div');

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }

  document.body.replaceChildren(element);

  return element;
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('createIslands', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'complete',
    });
  });

  it('mounts a component from the default islands root', async () => {
    const mount = vi.fn();
    const islands = createIslands({
      type: 'react',
      selector: '[data-island="react"]',
      mounter: { mount },
      components: {
        '/resources/js/islands/Support/Map.jsx': async () => ({ default: 'MapComponent' }),
      },
    });

    renderElement({
      'data-island': 'react',
      'data-component': 'Support/Map',
      'data-props': JSON.stringify({ zoom: 11 }),
    });

    islands();
    await flush();

    expect(mount).toHaveBeenCalledWith(
      'MapComponent',
      expect.any(HTMLElement),
      { zoom: 11 },
      { preserve: false },
    );
  });

  it('supports a custom root when resolving component names', async () => {
    const mount = vi.fn();
    const islands = createIslands({
      type: 'vue',
      selector: '[data-island="vue"]',
      mounter: { mount },
      components: {
        '/resources/js/widgets/Support/Map.vue': async () => ({ default: 'MapWidget' }),
      },
    });

    renderElement({
      'data-island': 'vue',
      'data-component': 'Support/Map',
      'data-props': '{}',
    });

    islands({
      root: '/resources/js/widgets',
    });

    await flush();

    expect(mount).toHaveBeenCalledWith(
      'MapWidget',
      expect.any(HTMLElement),
      {},
      { preserve: false },
    );
  });

  it('skips remounting preserved islands on later boot passes', async () => {
    const mount = vi.fn();
    const islands = createIslands({
      type: 'svelte',
      selector: '[data-island="svelte"]',
      mounter: { mount },
      components: {
        '/resources/js/islands/CartDrawer.svelte': async () => ({ default: 'CartDrawer' }),
      },
    });

    renderElement({
      'data-island': 'svelte',
      'data-component': 'CartDrawer',
      'data-props': '{}',
      'data-preserve': 'true',
    });

    islands();
    await flush();

    islands();
    await flush();

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount).toHaveBeenCalledWith(
      'CartDrawer',
      expect.any(HTMLElement),
      {},
      { preserve: true },
    );
  });

  it('remounts non-preserved islands on later boot passes', async () => {
    const mount = vi.fn();
    const islands = createIslands({
      type: 'react',
      selector: '[data-island="react"]',
      mounter: { mount },
      components: {
        '/resources/js/islands/Dashboard.jsx': async () => ({ default: 'DashboardComponent' }),
      },
    });

    renderElement({
      'data-island': 'react',
      'data-component': 'Dashboard',
      'data-props': '{}',
    });

    islands();
    await flush();

    islands();
    await flush();

    expect(mount).toHaveBeenCalledTimes(2);
  });
});
