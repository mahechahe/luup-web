import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
import airbnbConfig from 'eslint-config-airbnb'; // Nota: Requiere compatibilidad
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  {
    // 1. Ignorar carpetas innecesarias
    ignores: ['dist', 'node_modules', 'route-temp', 'src/components/ui/**'],
  },
  {
    // 2. Configuración base para archivos JS/JSX
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    settings: {
      react: { version: '19.0' }, // Actualizado a tu versión de package.json
    },
    rules: {
      // Configuraciones base manuales (reemplazan a los extends antiguos)
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      // Tus reglas personalizadas
      'no-underscore-dangle': 'off',
      'import/no-unresolved': 'off',
      camelcase: 'off',
      'no-console': 'off',
      'no-nested-ternary': 'off',
      'import/no-named-as-default': 0,
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',
      'react-refresh/only-export-components': 'off',
      'react/prop-types': 'off',
      'no-restricted-exports': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'no-param-reassign': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-no-useless-fragment': 'off',
      'no-use-before-define': ['error', { variables: false }],
      'react/jsx-filename-extension': [
        'error',
        { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      ],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
];
