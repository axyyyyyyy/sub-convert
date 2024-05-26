import url from 'url';
import querystring from 'querystring';
import { Base64 } from 'js-base64';
import { getIfNotBlank, isPresent, isNotBlank, getIfPresent } from '../utils/sub_store/index.js';

// https://github.com/sub-store-org/Sub-Store/blob/1fc5b764fea64bfdba479294a4fa382ffb92ecfb/backend/src/core/proxy-utils/parsers/index.js#L314
function parse() {
    const name = 'URI VMess Parser';
    const test = (line) => {
        return /^vmess:\/\//.test(line);
    };

    const parse = (line) => {
        const result = parse1(line);
        // console.log(result);
        return {
            "tag": result.name,
            "type": "vmess",
            "server": result.server,
            "server_port": result.port,
            "uuid": result.uuid,
            "alter_id": result.alterId,
            "security": result.cipher,
            "transport": {
                "type": "ws"
            }
        };

    }
    //https://github.com/lockcp/Sub-Store/blob/093102e791119a112d548308da393a08c2d52404/scripts/sub-store-parser.js#L280C13-L364C15
    //https://github.com/sub-store-org/Sub-Store/blob/1fc5b764fea64bfdba479294a4fa382ffb92ecfb/backend/src/core/proxy-utils/parsers/index.js#L158
    const parse1 = (line) => {
        line = line.split('vmess://')[1];
        let content = Base64.decode(line);
        if (/=\s*vmess/.test(content)) {
            // Quantumult VMess URI format
            const partitions = content.split(',').map((p) => p.trim());
            // get keyword params
            const params = {};
            for (const part of partitions) {
                if (part.indexOf('=') !== -1) {
                    const [key, val] = part.split('=');
                    params[key.trim()] = val.trim();
                }
            }

            const proxy = {
                name: partitions[0].split('=')[0].trim(),
                type: 'vmess',
                server: partitions[1],
                port: partitions[2],
                cipher: getIfNotBlank(partitions[3], 'auto'),
                uuid: partitions[4].match(/^"(.*)"$/)[1],
                tls: params.obfs === 'wss',
                udp: getIfPresent(params['udp-relay']),
                tfo: getIfPresent(params['fast-open']),
                'skip-cert-verify': isPresent(params['tls-verification'])
                    ? !params['tls-verification']
                    : undefined,
            };

            // handle ws headers
            if (isPresent(params.obfs)) {
                if (params.obfs === 'ws' || params.obfs === 'wss') {
                    proxy.network = 'ws';
                    proxy['ws-opts'].path = (
                        getIfNotBlank(params['obfs-path']) || '"/"'
                    ).match(/^"(.*)"$/)[1];
                    let obfs_host = params['obfs-header'];
                    if (obfs_host && obfs_host.indexOf('Host') !== -1) {
                        obfs_host = obfs_host.match(
                            /Host:\s*([a-zA-Z0-9-.]*)/,
                        )[1];
                    }
                    if (isNotBlank(obfs_host)) {
                        proxy['ws-opts'].headers = {
                            Host: obfs_host,
                        };
                    }
                } else {
                    throw new Error(`Unsupported obfs: ${params.obfs}`);
                }
            }
            return proxy;
        } else {
            let params = {};

            try {
                // V2rayN URI format
                params = JSON.parse(content);
            } catch (e) {
                // Shadowrocket URI format
                // eslint-disable-next-line no-unused-vars
                let [__, base64Line, qs] = /(^[^?]+?)\/?\?(.*)$/.exec(line);
                content = Base64.decode(base64Line);

                for (const addon of qs.split('&')) {
                    const [key, valueRaw] = addon.split('=');
                    let value = valueRaw;
                    value = decodeURIComponent(valueRaw);
                    if (value.indexOf(',') === -1) {
                        params[key] = value;
                    } else {
                        params[key] = value.split(',');
                    }
                }
                // eslint-disable-next-line no-unused-vars
                let [___, cipher, uuid, server, port] =
                    /(^[^:]+?):([^:]+?)@(.*):(\d+)$/.exec(content);

                params.scy = cipher;
                params.id = uuid;
                params.port = port;
                params.add = server;
            }
            const proxy = {
                name: params.ps ?? params.remarks,
                type: 'vmess',
                server: params.add,
                port: parseInt(getIfPresent(params.port), 10),
                cipher: getIfPresent(params.scy, 'auto'),
                uuid: params.id,
                alterId: parseInt(
                    getIfPresent(params.aid ?? params.alterId, 0),
                    10,
                ),
                tls: ['tls', true, 1, '1'].includes(params.tls),
                'skip-cert-verify': isPresent(params.verify_cert)
                    ? !params.verify_cert
                    : undefined,
            };
            // https://github.com/2dust/v2rayN/wiki/%E5%88%86%E4%BA%AB%E9%93%BE%E6%8E%A5%E6%A0%BC%E5%BC%8F%E8%AF%B4%E6%98%8E(ver-2)
            if (proxy.tls && proxy.sni) {
                proxy.sni = params.sni;
            }
            // handle obfs
            if (params.net === 'ws' || params.obfs === 'websocket') {
                proxy.network = 'ws';
            } else if (
                ['tcp', 'http'].includes(params.net) ||
                params.obfs === 'http'
            ) {
                proxy.network = 'http';
            } else if (['grpc'].includes(params.net)) {
                proxy.network = 'grpc';
            }
            if (proxy.network) {
                let transportHost = params.host ?? params.obfsParam;
                try {
                    const parsedObfs = JSON.parse(transportHost);
                    const parsedHost = parsedObfs?.Host;
                    if (parsedHost) {
                        transportHost = parsedHost;
                    }
                    // eslint-disable-next-line no-empty
                } catch (e) { }
                let transportPath = params.path;

                if (proxy.network === 'http') {
                    if (transportHost) {
                        transportHost = Array.isArray(transportHost)
                            ? transportHost[0]
                            : transportHost;
                    }
                    if (transportPath) {
                        transportPath = Array.isArray(transportPath)
                            ? transportPath[0]
                            : transportPath;
                    }
                }
                if (transportPath || transportHost) {
                    if (['grpc'].includes(proxy.network)) {
                        proxy[`${proxy.network}-opts`] = {
                            'grpc-service-name': getIfNotBlank(transportPath),
                            '_grpc-type': getIfNotBlank(params.type),
                        };
                    } else {
                        proxy[`${proxy.network}-opts`] = {
                            path: getIfNotBlank(transportPath),
                            headers: { Host: getIfNotBlank(transportHost) },
                        };
                    }
                } else {
                    delete proxy.network;
                }

                // https://github.com/MetaCubeX/Clash.Meta/blob/Alpha/docs/config.yaml#L413
                // sni 优先级应高于 host
                if (proxy.tls && !proxy.sni && transportHost) {
                    proxy.sni = transportHost;
                }
            }
            return proxy;
        }
    };
    return { name, test, parse };
}


export default parse;