const mix = require('laravel-mix')

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.setPublicPath('public')

mix.js('assets/js/front.js', 'public/js')
mix.sass('assets/scss/front.scss', 'public/css')

mix.options({
  cssNano: {
    discardComments: { removeAll: true }
  }
})

if (mix.inProduction()) {
  mix.version()
}
