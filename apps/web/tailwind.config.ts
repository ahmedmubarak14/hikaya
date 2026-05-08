import type { Config } from 'tailwindcss';

import preset from '@hikaya/config/tailwind/preset';

const config: Config = {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx,mdx}',
    // Pull classes from the shared UI package source so its components don't
    // get tree-shaken out at build.
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
