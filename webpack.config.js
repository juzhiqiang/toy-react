module.exports = {
    entry: {
        // 打包入口文件
        main: './main.js',
    },
    module: {
        // 规则
        rules: [{
            test: /\.js$/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                    plugins: [["@babel/plugin-transform-react-jsx", {
                        // 指定创建 不使用react
                        pragma: 'createElement'
                    }]]
                }
            }
        }]
    },
    mode: "development",
    // 压缩关闭
    optimization: {
        minimize: false
    }
}