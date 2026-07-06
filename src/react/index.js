import { createEntry } from '../shared/create-entry.js';
import mounter from './mount.js';

const components = import.meta.glob('/resources/js/islands/**/*.{jsx,tsx}');

export default createEntry({
  type: 'react',
  components,
  mounter,
});
