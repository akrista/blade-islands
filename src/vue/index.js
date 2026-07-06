import { createEntry } from '../shared/create-entry.js';
import mounter from './mount.js';

const components = import.meta.glob('/resources/js/islands/**/*.vue');

export default createEntry({
  type: 'vue',
  components,
  mounter,
});
