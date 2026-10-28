import { fileURLToPath } from 'node:url';

// Keep these aliases aligned with the ~paths resolved by scripts/scssAlias.js.
export default {
  resolve: {
    alias: {
      '~assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '~styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
    },
  },
};
