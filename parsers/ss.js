import url from 'url';
import querystring from 'querystring';
import { Base64 } from 'js-base64';
import { getIfNotBlank, isPresent, isNotBlank, getIfPresent } from '../utils/sub_store/index.js';

function parse() {
    const name = 'URI SS Parser';
    const test = (line) => {
        return /^ss:\/\//.test(line);
    };
    const parse = (line) => {


        //将 line中ss:// 与 ? 之间的部分进行base64解码
        // 有些节点用户信息和server直接加密了
        let [a_, ss1] = /ss:\/\/([^?]*)/.exec(line);
        if (ss1 && ss1.indexOf("@") == -1) {
            let ss1_ = atob(ss1);
            line = line.replace(ss1, btoa(ss1_.split("@")[0]) + "@" + ss1_.split("@")[1]);
        }

        const result = parse1(line);
        
        // console.log(result);

        let proxy = {
            tag: result.name,
            type: 'shadowsocks',
            server: result.server,
            server_port: parseInt(result.port),
            password: result.password,
            method: result.cipher
        }

        if (result.plugin && result.plugin == "obfs") {
            let pluginOpts = result['plugin-opts'];
            proxy.plugin = 'obfs-local';
            proxy.plugin_opts = `obfs=${pluginOpts.mode};obfs-host=${pluginOpts.host}`;
        }

        return proxy;
    };

    //https://github.com/sub-store-org/Sub-Store/blob/1fc5b764fea64bfdba479294a4fa382ffb92ecfb/backend/src/core/proxy-utils/parsers/index.js#L16
    // 截取端口的正则 /@([^\/\?]*)(\/|\?|$)/  引用出不太对，修改为这个    
    const parse1 = (line) => {
        // parse url
        let content = line.split('ss://')[1];

        const proxy = {
            name: decodeURIComponent(line.split('#')[1]),
            type: 'ss',
        };
        content = content.split('#')[0]; // strip proxy name
        // handle IPV4 and IPV6
        let serverAndPortArray = content.match(/@([^\/\?]*)(\/|\?|$)/);
        let userInfoStr = Base64.decode(content.split('@')[0]);
        if (!serverAndPortArray) {
            content = Base64.decode(content);
            userInfoStr = content.split('@')[0];
            serverAndPortArray = content.match(/@([^\/\?]*)(\/|\?|$)/);
        }
        const serverAndPort = serverAndPortArray[1];
        const portIdx = serverAndPort.lastIndexOf(':');
        proxy.server = serverAndPort.substring(0, portIdx);
        proxy.port = serverAndPort.substring(portIdx + 1);

        const userInfo = userInfoStr.split(':');
        proxy.cipher = userInfo[0];
        proxy.password = userInfo[1];

        // handle obfs
        const idx = content.indexOf('?plugin=');
        if (idx !== -1) {
            const pluginInfo = (
                'plugin=' +
                decodeURIComponent(content.split('?plugin=')[1].split('&')[0])
            ).split(';');
            const params = {};
            for (const item of pluginInfo) {
                const [key, val] = item.split('=');
                if (key) params[key] = val || true; // some options like "tls" will not have value
            }
            switch (params.plugin) {
                case 'obfs-local':
                case 'simple-obfs':
                    proxy.plugin = 'obfs';
                    proxy['plugin-opts'] = {
                        mode: params.obfs,
                        host: getIfNotBlank(params['obfs-host']),
                    };
                    break;
                case 'v2ray-plugin':
                    proxy.obfs = 'v2ray-plugin';
                    proxy['plugin-opts'] = {
                        mode: 'websocket',
                        host: getIfNotBlank(params['obfs-host']),
                        path: getIfNotBlank(params.path),
                        tls: getIfPresent(params.tls),
                    };
                    break;
                default:
                    throw new Error(
                        `Unsupported plugin option: ${params.plugin}`,
                    );
            }
        }
        return proxy;
    };

    return { name, test, parse };
}


export default parse;