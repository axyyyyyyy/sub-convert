
import Subscribe from './core/subscription.js';
import DownloadSub from './core/download.js';
import Conver from './core/conver.js';
import Merge from './core/merge.js';

import Global from './common/global.js';
async function main() {
    
    console.log(`执行参数1 ${process.argv}`)

    const action = process.argv[2];

    /**
     * 目标平台名称
     * 'sing-box'
     * Clash
     * 
     *     QX: QX_Producer(),
    QuantumultX: QX_Producer(),
    Surge: Surge_Producer(),
    SurgeMac: SurgeMac_Producer(),
    Loon: Loon_Producer(),
    Clash: Clash_Producer(),
    ClashMeta: ClashMeta_Producer(),
    URI: URI_Producer(),
    V2Ray: V2Ray_Producer(),
    JSON: JSON_Producer(),
    Stash: Stash_Producer(),
    Shadowrocket: Shadowrocket_Producer(),
    ShadowRocket: Shadowrocket_Producer(),
    Surfboard: Surfboard_Producer(),
    'sing-box': singbox_Producer(),
     */
    const platform = process.argv[3];
    if(platform){
        Global.subscription.platfrom = platform;
    }

    console.log(`this platfrom : ${Global.getPlatfrom()}`)

    // if(action == 'convert'){
        
    // }

    const subProfiles = await Subscribe.getSubscriptionProfiles();
    console.log(subProfiles);

    //开始下载订阅
    await DownloadSub.download(subProfiles);

    //开始解析订阅
    await Conver.converSub(subProfiles);

    //获取订阅模板
    const configExample = await Subscribe.getSubscriptionExample();

    //合并订阅
    const configExample1 = await Merge.mergeSub(subProfiles,configExample);

    // console.log(configExample1);

    await Subscribe.releaseSubscription(configExample1);

}

main();