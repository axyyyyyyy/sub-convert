import url from 'url';
import querystring from 'querystring';
import { Base64 } from 'js-base64';
import { getIfNotBlank, isPresent, isNotBlank, getIfPresent } from '../utils/sub_store/index.js';

function parse() {
    const name = 'URI Hysteria2 Parser';
    const test = (line) => {
        return /^hysteria2:\/\//.test(line);
    };
    const parse = (line) => {
        line = line.split('hysteria2://')[1];
        // eslint-disable-next-line no-unused-vars
        let [__, password, server, ___, server_port, addons, tag] =
            /^(.*?)@(.*?)(:(\d+))?\/?\?(.*?)(?:#(.*?))$/.exec(line);
        server_port = parseInt(`${server_port}`, 10);
        if (isNaN(server_port)) {
            server_port = 443;
        }
        password = decodeURIComponent(password);
        tag = decodeURIComponent(tag) ?? `Hysteria2 ${server}:${server_port}`;

        const proxy = {
            type: 'hysteria2',
            tag: tag,
            server : server,
            server_port : server_port,
            password : password,
            "up_mbps" : 200,
            "down_mbps" : 200,
        };

        const params = {};
        for (const addon of addons.split('&')) {
            const [key, valueRaw] = addon.split('=');
            let value = valueRaw;
            value = decodeURIComponent(valueRaw);
            params[key] = value;
        }

        // proxy.sni = params.sni;

        const tls = {
            "enabled": true,
            "disable_sni": false,
            "insecure": false
        };

        if (!proxy.sni && params.peer) {
            tls.server_name = params.peer;
        }

        proxy.tls = tls;

        // if (params.obfs && params.obfs !== 'none') {
        //     proxy.obfs = params.obfs;
        //     proxy['obfs-password'] = params['obfs-password'];
        // }

        
        // proxy['skip-cert-verify'] = /(TRUE)|1/i.test(params.insecure);
        // proxy.tfo = /(TRUE)|1/i.test(params.fastopen);
        // proxy['tls-fingerprint'] = params.pinSHA256;

        return proxy;
    };
    return { name, test, parse };
}


export default parse;