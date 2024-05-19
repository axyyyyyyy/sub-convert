const axios = require("axios");
const YAML = require("yaml");
const fs = require('fs');
const path = require('path');


async function main() {
    
    console.log(`执行参数 ${process.argv}`)

    const action = process.argv[2];
    const profile_type = process.argv[3];

    if(action == 'convert'){
        
    }


}

main();

