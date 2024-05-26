const axios = require("axios");
const YAML = require("yaml");
const fs = require('fs');
const path = require('path');
const { writeFile }= require('../utils/file').default;

async function geturl(url) {
  let configFile = null;
  try {
    const result = await axios({
      url,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      },
    });
    configFile = result.data;
  } catch (error) {
    console.log("get url error");
  }

  return configFile;
}


(async () => {


  const directoryPath = path.join(process.cwd(), 'profiles');

  const files = fs.readdirSync(directoryPath);

  //节点数组
  var all_node_list = [];

  //全部tag数组
  var all_tag_list = [];

  var select_tag_list = [];

  var new_group_list = [];

  var sub_log = {};

  const logsPath = path.join(process.cwd(), 'logs',"sub_log.json");

  if (fs.existsSync(logsPath)) {
    console.log("读取订阅更新记录...");
    sub_log = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
  }


  // 遍历profiles的列表
  for (const file of files) {
    //获取profiles目录下以profile开头的文件
    if (file.startsWith('profile') && file.endsWith('.json')) {
      const filePath = path.join(directoryPath, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const profile = JSON.parse(data);
      console.log('File:', file);
      console.log('Profile:', profile);

      const subList = profile.subcribe_list;

      //遍历 配置文件的 订阅列表
      for (let sub_json of subList) {

        var sub_str = "";

        const subFilePath = path.join(process.cwd(), 'sub_content',sub_json.name);

        if (!fs.existsSync(subFilePath)) {
          //订阅内容（base64加密的）
          console.log(`${sub_json.name} 获取缓存的订阅内容失败，开始下载`);
          var sub_base64_str = await geturl(sub_json.sub_url);
          sub_str = atob(sub_base64_str);
          fs.writeFileSync(subFilePath, sub_str, 'utf8');

          sub_log.update_log.push({
            "name": sub_json.name,
            "last_update": new Date().getTime(),
            "last_update_str": new Date().toLocaleString()
          });

        } else {

          //获取sub_log的update_log列表的更新记录

          const obj = sub_log.update_log.find((obj) => obj.name === sub_json.name);


          //判断sub_log的last_update是否超过指定的时间
          let interval = sub_json.update_interval ? sub_json.update_interval : 0;
          if (obj && (interval == 0 || (new Date().getTime() - obj.last_update) < (24 * 60 * 60 * 1000 * sub_json.update_interval))) {
            console.log(`${sub_json.name} 缓存的订阅内容未过期，直接读取`);
            sub_str = fs.readFileSync(subFilePath, 'utf8');
            console.log(`${sub_json.name} 获取缓存的订阅内容成功`);
          } else {
            console.log(`${sub_json.name} 缓存的订阅内容已过期，开始下载`);
            var sub_base64_str = await geturl(sub_json.sub_url);
            sub_str = atob(sub_base64_str);
            fs.writeFileSync(subFilePath, sub_str, 'utf8');
            obj.last_update = new Date().getTime();
            obj.last_update_str = new Date().toLocaleString();
            console.log(`${sub_json.name} 获取缓存的订阅内容成功`);
          }
        }

        var sub_list = sub_str.split(/\r?\n/);

        var new_group = {
          "tag": sub_json.name,
          "type": "selector",
          "outbounds": [
          ]
        };

          //当前分组tag数组
        var group_tag_list = [];

        // 遍历订阅内容
        for (var sub of sub_list) {
          // console.log(sub);

          var proxy_protocol = "";

          if (sub.indexOf(":") > -1) {
            proxy_protocol = sub.match(/^[^:]+/)[0];
          }

          if (proxy_protocol) {
            // console.log("节点协议：" + proxy_protocol);
            // 根据节点的协议 动态引入对应的parse函数
            const parsers_path = path.join(process.cwd(), 'parsers',proxy_protocol);
            if (!fs.existsSync(parsers_path + ".js")){
              console.log("error: 协议解析模块不存在");
              continue;
            }

            const parse = require(parsers_path);

            var res = parse().parse(sub);

            // console.log(res);

            //判断all_tag_list是否存在当前tag
            if (all_tag_list.indexOf(res.tag) != -1) {
              console.log("tag重复，跳过");
              continue;
            }

            if (res) {
              all_node_list.push(res);
              group_tag_list.push(res.tag);
              all_tag_list.push(res.tag);
            }
          } else {
            console.log(proxy_protocol);
            console.log("error: 获取节点协议失败"+proxy_protocol);
          }

        }

        select_tag_list.push(sub_json.name);
        new_group.outbounds.push(...group_tag_list);
        new_group_list.push(new_group);
  

      }




    }
  };

  fs.writeFileSync(logsPath, JSON.stringify(sub_log, null, 2),'utf8');

  //提取us节点
  const us_tag_list = all_tag_list.filter(str => /us|🇺🇸|美国/i.test(str));

  const us_group = {
    "tag": "us_list",
    "type": "urltest",
    "outbounds": us_tag_list
  };
  new_group_list.push(us_group);
  select_tag_list.push("us_list");

  const config_example_path = path.join(process.cwd(), 'config',"sing_box","config-example.json");
  const config_path = path.join(process.cwd(), 'release',"sing_box","config.json");

  //读取模板文件
  var config = fs.readFileSync(config_example_path, 'utf8');
  const jsonData = JSON.parse(config);
  const outbounds = jsonData.outbounds;
  outbounds[0].outbounds.push(...select_tag_list);
  outbounds[1].outbounds.push(...all_tag_list);
  //在urltest分组后插入新分组
  outbounds.splice(2,0,...new_group_list);
  outbounds.push(...all_node_list);
  // console.log(jsonData);
  writeFile(config_path, JSON.stringify(jsonData, null, 2))

  console.log("finish");



})();



