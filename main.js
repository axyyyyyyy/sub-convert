import axios from "axios";
import YAML from "yaml";
import fs from 'fs';
import path from 'path';


async function main() {
    
    console.log(`执行参数 ${process.argv}`)

    const action = process.argv[2];
    const profile_type = process.argv[3];

    if(action == 'convert'){
        
    }


}

main();

