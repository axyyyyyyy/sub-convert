import Global from '../common/global.js';
class Merge {

    async mergeSub(profiles,configExample){
        const platform = Global.getPlatfrom();
        switch (platform) {
            case 'sing_box':
                return this.mergeSub_singbox(profiles,configExample);
            // case 'trojan':
            //     return trojan(proxy);
        }
    }

    async mergeSub_singbox(profiles,configExample) {
        //所有节点数组
        var all_node_list = [];

         /**
         * 所有订阅组的tag列表
         * [
            "GLaDOS-JP-B1-01",
            "GLaDOS-JP-B1-02",
            "GLaDOS-JP-B1-03",
            "GLaDOS-JP-B1-04"
            ]
         */
        var all_tag_list = [];



        /**
         * select 分组的tag列表
         * [
            "glados",
            ]
         */
        var select_tag_list = [];

        /**
         * 新分组列表
         * 
         * [
            {
                tag: "glados",
                type: "selector",
                outbounds: [
                "GLaDOS-JP-B1-01"
                ],
            },
            {},{}
            ]
         */
        var new_group_list = [];



        for (const profile of profiles) {
            const { name, update_interval, sub_url, sing_box_proxies } = profile;

            //每个订阅组的tag列表
            var group_tag_list = [];

            for(const proxy of sing_box_proxies){
                const { tag } = proxy;

                //判断all_tag_list是否存在当前tag
                if (all_tag_list.indexOf(tag) != -1) {
                    console.log("tag重复，跳过");
                    continue;
                }

                all_node_list.push(proxy);
                group_tag_list.push(proxy.tag);
                all_tag_list.push(proxy.tag);

            }

            var new_group = {
                "tag": name,
                "type": "selector",
                "outbounds": [
                ]
            };
            select_tag_list.push(name);
            new_group.outbounds.push(...group_tag_list);
            new_group_list.push(new_group);
            
        }

          //提取us节点
            const us_tag_list = all_tag_list.filter(str => /us|🇺🇸|美国/i.test(str));

            const us_group = {
                "tag": "us_list",
                "type": "urltest",
                "outbounds": us_tag_list
            };
            new_group_list.push(us_group);
            select_tag_list.push("us_list");

            const outbounds = configExample.outbounds;
            //select 分组放入所有节点tag
            outbounds[0].outbounds.push(...select_tag_list);
            //在urltest分组放入所有节点tag
            outbounds[1].outbounds.push(...all_tag_list);
            //在urltest分组后插入新分组
            outbounds.splice(2,0,...new_group_list);
            //结尾插入所有节点
            outbounds.push(...all_node_list);

            return configExample;

    }
}
export default new Merge();