// singleton.js

const platformMap = {
    "sing_box": "sing_box",
    "sing-box": "sing_box",
    "singBox": "sing_box",
    // 添加其他可能的写法到映射对象
};

const Global = {
    subscription:{
        platfrom: "sing-box"
    },
    //设置一个统一的映射
    getPlatfrom() {
        return platformMap[this.subscription.platfrom] || this.subscription.platfrom;
    }
};



export default Global;