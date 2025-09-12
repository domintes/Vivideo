// ESLint flat config for ESLint v9
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        chrome: 'readonly'
      }
    },
    plugins: {
      prettier: pluginPrettier
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
      'no-console': 'off',
      'prettier/prettier': 'warn'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'src/components/reactlike/**']
  }
];
