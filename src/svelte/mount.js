import { mount, unmount } from 'svelte';
import { Mounter } from '../shared/mounter.js';

class SvelteMounter extends Mounter {
  prepareElement(element) {
    element.innerHTML = '';
  }

  async createInstance(Component, element, props) {
    return mount(Component, { target: element, props });
  }

  async unmountInstance(instance) {
    unmount(instance);
  }
}

export default new SvelteMounter();
