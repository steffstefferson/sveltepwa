import commonjs from 'rollup-plugin-commonjs'
// import purgeCss from '@fullhuman/postcss-purgecss';
import livereload from 'rollup-plugin-livereload'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'
import { terser } from 'rollup-plugin-terser'
import svelte_preprocess_postcss from 'svelte-preprocess-postcss'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import copy from 'rollup-plugin-copy-assets'
import { injectManifest } from 'rollup-plugin-workbox'
import replace from 'rollup-plugin-replace'
import sizes from 'rollup-plugin-sizes'

const production = !process.env.ROLLUP_WATCH
export default [
  {
    input: 'src/main.js',
    output: {
      format: 'iife',
      sourcemap: true,
      name: 'app',
      file: 'dist/main.js',
    },

    plugins: [
      svelte({
        dev: !production,
        preprocess: {
          style: svelte_preprocess_postcss(),
        },
        css: (css) => {
          css.write('dist/components.css')
        },
      }),
      resolve(),
      commonjs(),
      globals(),
      builtins(),
      copy({
        assets: ['src/assets'],
      }),
      postcss({
        extensions: ['.scss', '.sass'],
        extract: true,
        minimize: true,
        use: [
          [
            'sass',
            {
              includePaths: ['./src/theme', './node_modules'],
            },
          ],
        ],
      }),
      !production && livereload('dist'),
      production && terser(),
      injectManifest(
        {
          swSrc: 'src/sw/service-worker.js',
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
      sizes(),
    ],
  },
  {
    input: 'src/sw/service-worker.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'workbox',
      file: 'dist/service-worker.js',
    },
    plugins: [
      svelte({
        dev: false,
      }),
      resolve(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(
          process.env.NODE_ENV || 'production'
        ),
      }),
      terser(),
      injectManifest(
        {
          swSrc: 'dist/service-worker.js',
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
    // watch: {
    //    clearScreen: false,
    // },
  },
]
