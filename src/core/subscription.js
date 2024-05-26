import fs from 'fs';
import path from 'path';

import Global from '../common/global.js';

class Subscribe {
    //获取订阅文件
    async getSubscriptionProfiles() {
        const directoryPath = path.join(process.cwd(), 'profiles');
        let files = fs.readdirSync(directoryPath);
        // 过滤出files以profile开头的文件名
        files = files.filter(file => file.startsWith('profile'));

        let data = [];
        // 遍历files，获取文件内容 , 
        files.map(file => {
            const filePath = path.join(directoryPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const profile = JSON.parse(content);
            data.push(...profile.subcribe_list);
        });

        return data;
    }

    //获取订阅模板
    async getSubscriptionExample() {
        const platfrom = Global.getPlatfrom();
        const config_example_path = path.join(process.cwd(), 'config',platfrom,"config-example.json");
        var config = fs.readFileSync(config_example_path, 'utf8');
        return  JSON.parse(config);
    }

    //发布订阅文件
    async releaseSubscription(example) {
        const platfrom = Global.getPlatfrom();
        const config_path = path.join(process.cwd(), 'release',platfrom,"config.json");
        
        //将文件写入到此路径, 文件夹不存在时自动创建
        fs.writeFileSync(config_path, JSON.stringify(example, null, 4), 'utf8');

    }
        
}

export default new Subscribe();
