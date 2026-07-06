export class Mounter {
  constructor() {
    this.instances = new WeakMap();
  }

  async mount(Component, element, props, { preserve = false } = {}) {
    const instance = this.instances.get(element);

    if (instance && preserve) {
      return;
    }

    if (instance) {
      await this.unmountInstance(instance, element);
      this.instances.delete(element);
    }

    this.prepareElement(element);

    const nextInstance = await this.createInstance(Component, element, props);

    this.instances.set(element, nextInstance);
  }

  prepareElement() {}

  async unmountInstance(instance) {
    instance.unmount?.();
  }
}
