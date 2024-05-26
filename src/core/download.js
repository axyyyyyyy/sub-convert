import HttpClient from '../utils/httpclient.js';

class DownloadSub{

    async download(profiles){
        const client = new HttpClient();

        for (const profile of profiles) {
            const { name, update_interval, sub_url } = profile;

            console.log(`开始下载订阅 ${name}`);
            const sub_content_res = await client.get(sub_url, {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            }).catch((error) => {
                    console.error(error);
            });
    
            //订阅内容
            const sub_content = sub_content_res.data;

            profile.sub_content = sub_content;
        }

        return profiles;

    }
}

export default new DownloadSub();