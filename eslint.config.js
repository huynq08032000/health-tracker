import js from '@eslint/js';
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      parser: ts.parser,
      parserOptions: {
        ...react.configs.flat.recommended.languageOptions?.parserOptions,
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...react.configs.flat.recommended.languageOptions?.globals,
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        Notification: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        Headers: 'readonly',
        AbortController: 'readonly',
        ReadableStream: 'readonly',
        TextDecoderStream: 'readonly',
        IntersectionObserver: 'readonly',
        self: 'readonly',
        define: 'readonly',
        importScripts: 'readonly',
        caches: 'readonly',
        FetchEvent: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        registration: 'readonly',
        location: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
    settings: {
      react: { version: '18.3' },
    },
  },
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.kilocode/**',
      '**/*.cjs',
      '**/*.mjs',
      '**/vite.config.ts',
      '**/scripts/**',
      'apps/web/dist/**',
      'apps/api/dist/**',
      'packages/shared/dist/**',
    ],
  },
  {
    files: ['apps/api/src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-undef': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-useless-escape': 'off',
    },
  },
  {
    files: ['packages/shared/src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
