import { describe, expect, it, vi } from 'vitest';

import { Mounter } from '../src/shared/mounter.js';

class FakeMounter extends Mounter {
  constructor() {
    super();
    this.events = [];
  }

  prepareElement(element) {
    this.events.push(['prepare', element.dataset.id]);
  }

  async createInstance(Component, element, props) {
    const instance = {
      id: `${Component}:${props.value}`,
      unmount: vi.fn(),
    };

    this.events.push(['create', element.dataset.id, Component, props.value]);

    return instance;
  }

  async unmountInstance(instance, element) {
    this.events.push(['unmount', element.dataset.id, instance.id]);
    instance.unmount();
  }
}

describe('Mounter', () => {
  it('reuses preserved instances', async () => {
    const mounter = new FakeMounter();
    const element = document.createElement('div');
    element.dataset.id = 'alpha';

    await mounter.mount('Widget', element, { value: 1 }, { preserve: true });
    await mounter.mount('Widget', element, { value: 1 }, { preserve: true });

    expect(mounter.events).toEqual([
      ['prepare', 'alpha'],
      ['create', 'alpha', 'Widget', 1],
    ]);
  });

  it('unmounts before remounting non-preserved instances', async () => {
    const mounter = new FakeMounter();
    const element = document.createElement('div');
    element.dataset.id = 'beta';

    await mounter.mount('Widget', element, { value: 1 });
    await mounter.mount('Widget', element, { value: 2 });

    expect(mounter.events).toEqual([
      ['prepare', 'beta'],
      ['create', 'beta', 'Widget', 1],
      ['unmount', 'beta', 'Widget:1'],
      ['prepare', 'beta'],
      ['create', 'beta', 'Widget', 2],
    ]);
  });
});
