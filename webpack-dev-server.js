const express = require('express');
const mine = require('mine');
const webpack = require('webpack');
let config = require('./webpack.config');
const compiler = webpack(config);
// 1. 创建webpack实例
// 2. 启动webpack-dev-server服务器
class Server {
    constructor(compiler) {
        // 4. 添加webpack.done 事件回调，在浏览器编译完成后会向浏览器发生消息
        let lastHash;
        let sockets = [];
        compiler.hooks.done.tap('webpack-dev-server', (stats) => {
            lastHash = stats.hash;
            sockets.forEach(socket => {
                socket.emit('hash', stats.hash);
                socket.emit('ok');
            });
        });
        let app = new express();
        // webpack 开启 监听模式
        /**
         * 1) 对本地文件编译打包
         * 2) 编译结束之后，开启监听，文件发生变化时重新编译，并持续进行监听
         */
        compiler.watch({}, error => {
            console.log('success!')
        })
        // 3. 添加webpack-dev-middleware 中间件
        // webpack-dev-middleware 作用：它可以把 webpack 处理后的文件传递给一个服务器(server)
        // 特点：
        // 它将打包后的文件直接写入内存.
        // 每次请求都将获得最新的打包结果.
        // 在监视模式(watch mode)下如果代码变化，middleware 会马上停止提供旧版的 bundle 并且会延迟请求直到编译完成.
        const webpackDevMiddleware = (req, res, next) => {
            if(req.url === '/favicon.ico') {
                return res.sendStatus(404);
            } else if(req.url === '/') {
                res.sendFileSync(path.join(config.output.path, 'index.html'))
            }
            let filename = path.join(config.output.path, req.url.slice(1));
            try {
                let stats = fs.statSync(filename);
                if(stats.isFile()) {
                    let content = fs.readFileSync(filename);
                    res.header("Content-Type", mine.getType(filename));
                    res.send(content);
                } else {
                    next();
                }
            } catch (error) {
                return res.sendStatus(404);
            }
        }
        app.use(webpackDevMiddleware);
        this.server = require("http").createServer(app);
        // 4. 使用sockjs在浏览器和服务器之间建立一个websocket长链接
        // 将webpack打包过程中各个阶段的消息推送给浏览器， 浏览器根据消息进行不同的操作
        // 当然服务器传递的最主要的消息还是新模块的hash， 后面的步骤就是根据hash进行热更新
        let io = require('socket.io')(this.server);
        io.on("connection", (socket) => {
            sockets.push(socket);
            if(lastHash) {
                // 5. 发生hash值
                socket.emit('hash', stats.hash);
                socket.emit('ok');
            }
        })
    }
    // 9. 创建http服务器并开启服务
    listen(port) {
        this.server.listen(port, () => {
            console.log('服务启动成功!')
        })
    }
}
// 3. 创建server 服务器
let server = new Server(compiler);
server.listen(8000);