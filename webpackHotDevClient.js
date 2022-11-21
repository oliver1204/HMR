let socket = io('/');
let currentHash;
let lastHash; // hotCurrentHash

const onConnected = () => {
    console.log('客户端已连接');
    // 6. 客户端会监听到此时hash消息
    socket.on('hash', (hash) => {
        currentHash = hash;
    });
    // 7. 客户端收到ok 消息
    socket.on('ok', () => {
        hotCheck();
    });
    socket.on('disconnenct', () => {
        lastHash = currentHash = null;
    });
};
// 8. 执行hotCheck方法进行更新
function hotCheck() {
    if(!lastHash || lastHash === currentHash) {
        return lastHash = currentHash;
    }
    // 9. 向 server 端发送 AJax 请求， 服务端返回一个hot-update.json 文件，该文件包含了所有变更的新模板
    hotDownloadMainfest().then(update => {
        let chunkIds = Object.keys(update.c); // ['main']
        // 10. 通过jsonp请求获取最新的代码块
        chunkIds.forEach(chunkId => {
            hotDownloadUpdateChunk(chunkId);
        })
    });
};
function hotDownloadMainfest() {
    var url = `/${lastHash}.hot-update.js`;
    return fetch(url).then(res => res.json()).catch(error => {console.log(error)})
}
function  hotDownloadUpdateChunk(chunkId) {
    var script = document.createElement('script');
    script.charset = 'utf-8';
    // 注意这里发送的老的lastHash,不是新的
    // 因为 比如，client端 由1 -> 1. 2. 3 三段，那么需要知道1的hash，即从哪里开始更新
    script.url = `/${chunkId}.${lastHash}.hot-update.js`; 
    document.head.appendChild(script);
}
// 11. 补丁js取回来后，调用webpackHotUpdate方法
window.webpackHotUpdate = (chunkId, moreModules) => {
    for(let moduleId in moreModules) {
        let oldModule = __webpack_require__.c[moduleId]; // 缓存中的老的module模块
        let { parents , children } = oldModule;
        var module = ( __webpack_require__.c[moduleId] = {
            i: moduleId,
            exports: {},
            parents, 
            children,
            hot: window.hotCreateModule(),
        });
        moreModules[moduleId].call(
            module.exports,
            module,
            __webpack_require__
        );
        parents.forEach(parent => {
            let parentModule = __webpack_require__.c[parent];
            parentModule.hot && 
            parentModule.hot._acceptedDependencies[moduleId] &&
            parentModule.hot._acceptedDependencies[moduleId](); // callback
        });
        lastHash = currentHash;
    }
};
socket.on('connect', onConnected);
window.hotCreateModule = () => {
    var hot = {
        _acceptedDependencies: {}, // 收集依赖
        accept: function(dep, callback) {
            for(var i = 0; i < dep.length; i++) {
                hot._acceptedDependencies[dep[i]] = callback;
                // hot._acceptedDependencies['title'] = callback;
            }
        }
    }
    return hot;
}