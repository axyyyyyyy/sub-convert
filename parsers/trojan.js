import url from 'url';
import querystring from 'querystring';
import { Base64 } from 'js-base64';
import { getIfNotBlank, isPresent, isNotBlank, getIfPresent } from '../utils/sub_store/index.js';

function parse() {
    const name = "URI Trojan Parser";
    const test = (line) => {
        return /^trojan:\/\//.test(line);
    };

    const parse = (line) => {
        const supported = {};
        line = line.split("trojan://")[1];

        let [all__, password, server, __, server_port, addons1, tag] = /^(.*?)@(.*?)(:(\d+))?\/?\?(.*?)(?:#(.*?))$/.exec(line);

        const params = {};
        for (const addon of addons1.split('&')) {
            const [key, valueRaw] = addon.split('=');
            let value = valueRaw;
            value = decodeURIComponent(valueRaw);
            params[key] = value;
        }

        const tls = {
            "enabled": true,
            "disable_sni": false,
            "insecure": false
        };

        tls.server_name = params.peer;

        return {
            tag: decodeURIComponent(tag) || `[Trojan] ${server}`, // trojan uri may have no server tag!
            type: "trojan",
            server,
            server_port: parseInt(server_port),
            password: password,
            tls
        };
    };
    return { name, test, parse };
}


export default parse;