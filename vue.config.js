module.exports = {
  chainWebpack: config => {
    config.module
      .rule('glsl-shader')
      .test(/\.glsl$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end();
      
    config.module
      .rule('raw-data')
      .test(/\.raw$/)
      .use('file-loader')
      .loader('file-loader')
      .end();
      
    config.module
      .rule('raw-data-info')
      .test(/\.info$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end();
  },
};