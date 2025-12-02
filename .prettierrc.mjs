// .prettierrc.mjs
/** @typedef  {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig*/
/** @typedef  {import("prettier").Config} PrettierConfig*/
/** @typedef  {{ tailwindConfig: string }} TailwindConfig*/

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
export default {
  printWidth: 120,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  useTabs: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  tailwindStylesheet: './apps/web/src/styles/app.css',
  importOrder: [
    '^(react/(.*)$)|^(react$)|^(react-native(.*)$)',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@base/(.*)$',
    '',
    '^~/lib/(.*)$',
    '^~/layouts/(.*)$',
    '^~/components/(.*)$',
    '^~/app/(.*)$',
    '^~/(.*)$',
    '',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderCaseSensitive: true,
};
