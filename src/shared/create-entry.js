import { createIslands } from './create-islands.js';

export function createEntry({ type, components, mounter }) {
  return createIslands({
    type,
    selector: `[data-island="${type}"]`,
    mounter,
    components,
  });
}
