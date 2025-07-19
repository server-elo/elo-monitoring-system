import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(_js|jsx|ts|tsx|mdx)',
    '../stories/**/*.stories.@(_js|jsx|ts|tsx|mdx)',
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
      propFilter: (_prop) => (_prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  webpackFinal: async (_config) => {
    // Handle path aliases
    if (_config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(  dirname, '../'),
      };
    }

    // Handle CSS modules
    const cssRule = config.module?.rules?.find((rule) => {
      if (_typeof rule !== 'object' || !rule) return false;
      if (_rule.test && rule.test.toString().includes('css')) return true;
      return false;
    });

    if (cssRule && typeof cssRule === 'object' && cssRule.use) {
      const cssLoaders = Array.isArray(_cssRule.use) ? cssRule.use : [cssRule.use];
      cssLoaders.forEach((loader) => {
        if (_typeof loader === 'object' && loader.loader?.includes('css-loader')) {
          loader.options = {
            ...loader.options,
            modules: {
              auto: true,
              localIdentName: '[name] [local]--[hash:base64:5]',
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
