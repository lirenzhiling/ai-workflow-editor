const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
    //模式： development（开发模式：代码不会被压缩）, production（生产模式：会压缩代码）
    mode: 'development',
    //入口文件
    entry: './src/index.tsx',
    //输出文件
    output: {
        filename: 'bundle.js',//打包后的文件名
        path: path.resolve(__dirname, 'dist'),//打包后的路径，必须是绝对路径
        clean: true, //每次打包前清理dist文件夹
    },
    //加载器
    module: {
        rules: [
            {
                test: /\.tsx?$/,//匹配以.ts结尾的文件
                use: 'babel-loader',//使用ts-loader加载器
                exclude: /node_modules/,//排除node_modules文件夹
            },
            {
                test: /\.css$/i,
                use: [
                    'style-loader',   // 把 JS 里的样式插入到 HTML 的 <style> 标签里
                    'css-loader',     // 把 CSS 转换成 CommonJS 模块
                    'postcss-loader', // 把 Tailwind 编译成普通 CSS (最先执行！)
                ],
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: 'asset/resource', // 让图片等静态资源被正确打包
            },
        ],
    },
    //插件Plugins：扩展Webpack功能
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',//模板文件
        }),
        new Dotenv({
            path: './.env', // 指定要去读哪个文件
        }),
    ],
    //解析模块:便于引入文件时可以不写后缀名
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],//自动解析这些扩展名的文件
    },
};