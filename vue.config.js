const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    open: true
  },
  lintOnSave: false,
  configureWebpack: {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.json']
    }
  },
  chainWebpack: (config) => {
    config.resolve.alias.set('@', require('path').resolve(__dirname, 'src'))
  }
})
