import commonjs from '@rollup/plugin-commonjs'
import livereload from 'rollup-plugin-livereload'
import postcss from 'rollup-plugin-postcss'
import resolve from '@rollup/plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'
import { terser } from 'rollup-plugin-terser'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import copy from 'rollup-plugin-copy-assets'
import { injectManifest } from 'rollup-plugin-workbox'
import replace from '@rollup/plugin-replace'
import sizes from 'rollup-plugin-sizes'
import svelte_preprocess_postcss from 'svelte-preprocess-postcss'
import sveltePreprocess from 'svelte-preprocess'
const smelte = require('smelte/rollup-plugin-smelte')

const production = !process.env.ROLLUP_WATCH
export default [
  {
    input: 'src/main.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: 'dist/main.js',
    },
    plugins: [
      svelte({
        preprocess: sveltePreprocess({ postcss: true }),
        // enable run-time checks when not in production
        dev: !production,
        // we'll extract any component CSS out into
        // a separate file — better for performance
        css: (css) => {
          css.write('dist/components.css')
        },
      }),
      smelte({
        purge: production,
        output: 'dist/components.css', // it defaults to static/global.css which is probably what you expect in Sapper
        postcss: [], // Your PostCSS plugins
        whitelist: [], // Array of classnames whitelisted from purging
        whitelistPatterns: [], // Same as above, but list of regexes
        tailwind: {
          theme: {
            extend: {
              spacing: {
                72: '18rem',
                84: '21rem',
                96: '24rem',
              },
            },
          }, // Extend Tailwind theme
          colors: {
            primary: '#b027b0',
            secondary: '#009688',
            error: '#f44336',
            success: '#4caf50',
            alert: '#ff9800',
            blue: '#2196f3',
            dark: '#212121',
          }, // Object of colors to generate a palette from, and then all the utility classes
          darkMode: true,
        }, // Any other props will be applied on top of default Smelte tailwind.config.js
      }),

      // If you have external dependencies installed from
      // npm, you'll most likely need these plugins. In
      // some cases you'll need additional configuration —
      // consult the documentation for details:
      // https://github.com/rollup/rollup-plugin-commonjs
      resolve({
        browser: true,
        dedupe: (importee) =>
          importee === 'svelte' || importee.startsWith('svelte/'),
      }),
      commonjs(),

      // In dev mode, call `npm run start:dev` once
      // the bundle has been generated
      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      !production && livereload('dist'),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser(),
    ],
  },
  {
    input: 'src/sw/service-worker.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'workbox',
      file: 'dist/service-worker_temp.js',
    },
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify(
          process.env.NODE_ENV || 'production'
        ),
      }),
      resolve(),
      injectManifest(
        {
          swSrc: 'dist/service-worker_temp.js',
          swDest: 'dist/service-worker.js',
          globDirectory: 'dist/',
        },
        function render({ swDest, count, size }) {
          console.log(`\nCustom render! ${swDest}`)
          console.log(
            `Custom render! The service worker will precache ${count} URLs, totaling ${size}.\n`
          )
        }
      ),
    ],
  },
]
