import { createApp } from 'vue';
import { Mounter } from '../shared/mounter.js';

class VueMounter extends Mounter {
  prepareElement(element) {
    element.innerHTML = '';
  }

  async createInstance(Component, element, props) {
    const app = createApp(Component, props);

    app.mount(element);

    return app;
  }
}

export default new VueMounter();
