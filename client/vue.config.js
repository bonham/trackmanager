// vue.config.js
module.exports = {
  chainWebpack: (config) => {
    config.resolve.alias.set('vue', '@vue/compat')

    config.module
      .rule('vue')
      .use('vue-loader')
      .tap((options) => {
        return {
          ...options,
          compilerOptions: {
            compatConfig: {
              MODE: 2
            }
          }
        }
      })
  },
  transpileDependencies: true,
  publicPath:
    process.env.NODE_ENV === 'production'
      ? '/tm/'
      : '/',

  devServer: {
    host: '127.0.0.1',
    hot: true,
    port: 8080,
    open: '/',
    proxy: { // https://cli.vuejs.org/guide/html-and-static-assets.html#disable-index-generation
      '/api/tracks*': {
        target: 'http://localhost:3000',
        secure: false,
        ws: false
      },
      '/ws/': { // web sockets
        target: 'http://localhost:3000',
        secure: false,
        ws: true
      // },
      // '!/': { // except root, which is served by webpack's devserver, to faciliate instant updates
      //   target: 'http://localhost:3000/',
      //   secure: false,
      //   ws: false
      }
    }
  }

}
