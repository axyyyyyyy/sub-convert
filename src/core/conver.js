import HttpClient from '../utils/httpclient.js';
import Global from '../common/global.js';
import YAML from 'yaml';

class Conver {

    async converSub(profiles) {
        const platform = Global.getPlatfrom();
        switch (platform) {
            case 'sing_box':
                return this.converSub_singbox(profiles);
            case 'clash':
                return this.converSub_clash(profiles);
            // case 'trojan':
            //     return trojan(proxy);
        }
    }

    async converSub_singbox(profiles) {
        const client = new HttpClient();

        for (const profile of profiles) {
            const { name, update_interval, sub_url,sub_content } = profile;

            console.log(`开始解析 ${name}`);
            const sub_conver_res = await client.post("http://127.0.0.1:3000/api/proxy/parse", {
                "data": sub_content,
                "client": "sing-box"
            }).catch((error) => {
                console.error(error);
            });

            const sub_conver_res_data = JSON.parse(sub_conver_res.data);
            const sub_conver_par_res_data = JSON.parse(sub_conver_res_data.data.par_res);
            profile.sing_box_proxies = sub_conver_par_res_data.outbounds;
        }

        return profiles;

    }

    async converSub_clash(profiles) {
        const client = new HttpClient();

        for (const profile of profiles) {
            const { name, update_interval, sub_url,sub_content } = profile;

            console.log(`开始解析 ${name}`);
            const sub_conver_res = await client.post("http://127.0.0.1:3000/api/proxy/parse", {
                "data": sub_content,
                "client": "Clash"
            }).catch((error) => {
                console.error(error);
            });

            const sub_conver_res_data = JSON.parse(sub_conver_res.data);
            const sub_conver_par_res_data = JSON.parse(sub_conver_res_data.data.par_res);
            //yaml 格式化 sub_conver_res_data.data.par_res

            console.log(sub_conver_par_res_data);
            // profile.sing_box_proxies = sub_conver_par_res_data.outbounds;
        }

        return profiles;

    }
}

export default new Conver();