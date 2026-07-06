import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Mounter } from '../shared/mounter.js';

class ReactMounter extends Mounter {
  async createInstance(Component, element, props) {
    const root = createRoot(element);
    root.render(createElement(Component, props));

    return root;
  }
}

export default new ReactMounter();
