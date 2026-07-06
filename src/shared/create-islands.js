const mounted = new WeakSet();

function normalizeRoot(root) {
  return `${root.replace(/\/+$/, '')}/`;
}

function createRegistry(components, root) {
  const normalizedRoot = normalizeRoot(root);
  const registry = {};

  for (const filePath in components) {
    const name = filePath.replace(normalizedRoot, '').replace(/\.[^.]+$/, '');

    registry[name] = async () => (await components[filePath]()).default;
  }

  return registry;
}

function createMountError(type) {
  return new Error(
    `[blade-islands] ${type} support is not available. Install the ${type} runtime to mount these islands.`,
  );
}

function isPreserved(element) {
  return element.dataset.preserve === 'true';
}

function getProps(element) {
  return JSON.parse(element.dataset.props || '{}');
}

function markMounted(element) {
  if (isPreserved(element)) {
    mounted.add(element);
  }
}

export function createIslands({ type, selector, mounter, components: defaultComponents }) {
  return function islands({ components = defaultComponents, root = '/resources/js/islands' } = {}) {
    async function mountAll() {
      const elements = [...document.querySelectorAll(selector)];

      if (elements.length === 0) {
        return;
      }

      if (!components) {
        console.error(`[blade-islands] No component loaders were configured for ${type}`);
        return;
      }

      const registry = createRegistry(components, root);

      if (Object.keys(registry).length === 0) {
        console.error(`[blade-islands] No ${type} islands were found`);
        return;
      }

      if (!mounter) {
        console.error('[blade-islands] Failed to mount:', createMountError(type));
        return;
      }

      await Promise.all(
        elements.map(async (element) => {
          if (isPreserved(element) && mounted.has(element)) {
            return;
          }

          const name = element.dataset.component;
          const props = getProps(element);
          const loadComponent = registry[name];

          if (!loadComponent) {
            console.error(`[blade-islands] ${type} island "${name}" was not found`);
            return;
          }

          try {
            const component = await loadComponent();
            await mounter.mount(component, element, props, {
              preserve: isPreserved(element),
            });
            markMounted(element);
          } catch (error) {
            console.error('[blade-islands] Failed to mount:', error);
          }
        }),
      );
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountAll, { once: true });
      return;
    }

    void mountAll();
  };
}
