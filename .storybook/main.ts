import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.js',
    },
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  webpackFinal: async (config) => {
    // Handle path aliases
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../'),
      };
    }

    // Handle CSS modules
    const cssRule = config.module?.rules?.find((rule) => {
      if (typeof rule !== 'object' || !rule) return false;
      if (rule.test && rule.test.toString().includes('css')) return true;
      return false;
    });

    if (cssRule && typeof cssRule === 'object' && cssRule.use) {
      const cssLoaders = Array.isArray(cssRule.use) ? cssRule.use : [cssRule.use];
      cssLoaders.forEach((loader) => {
        if (typeof loader === 'object' && loader.loader?.includes('css-loader')) {
          loader.options = {
            ...loader.options,
            modules: {
              auto: true,
              localIdentName: '[name]__[local]--[hash:base64:5]',
            },
          };
        }
      });
    }

    return config;
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  staticDirs: ['../public'],
  features: {
    experimentalRSC: true,
  },
};

export default config;
