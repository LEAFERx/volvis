module.exports = {
  chainWebpack: config => {
    config.module
      .rule('glsl-shader')
      .test(/\.glsl$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end();
  },
};