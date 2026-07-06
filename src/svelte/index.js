import { createEntry } from '../shared/create-entry.js';
import mounter from './mount.js';

const components = import.meta.glob('/resources/js/islands/**/*.svelte');

export default createEntry({
  type: 'svelte',
  components,
  mounter,
});
