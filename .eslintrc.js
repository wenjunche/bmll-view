module.exports = {
    parser: '@typescript-eslint/parser',
    // Specifies the ESLint parser
    extends: ["plugin:react/recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
    parserOptions: {
      ecmaVersion: 2018,
      // Allows for the parsing of modern ECMAScript features
      sourceType: 'module',
      // Allows for the use of imports
      ecmaFeatures: {
        jsx: true // Allows for the parsing of JSX
  
      }
    },
    rules: {
      // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
      // todo: switch off to warn
      'prettier/prettier': 'warn',
      'react/display-name': 'off',
      'no-unused-expressions': 'off',
      'no-console': 'warn',
      'no-debugger': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/ban-ts-ignore': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-types': 'warn' // e.g. '@typescript-eslint/explicit-function-return-type': 'off',
  
    },
    settings: {
      react: {
        version: 'detect' // Tells eslint-plugin-react to automatically detect the version of React to use
  
      }
    }
  };
  