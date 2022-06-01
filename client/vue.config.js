// vue.config.js
module.exports = {
  transpileDependencies: true,
  publicPath:
    process.env.NODE_ENV === 'production'
      ? '/tm/'
      : '/',

  devServer: {
    host: '0.0.0.0',
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
