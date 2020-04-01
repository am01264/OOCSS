import {processConfig, readConfigFile, isConfig} from "./gendoc"
import * as path from "path";

readConfigFile(path.join(process.cwd(),'gendoc.json'), (err, config) => {
    if (err) {
        // Don't take that kind of talk
        throw err;
    }

    if (!isConfig(config)) {
        throw new Error('Invalid config loaded.');
    }

    processConfig(config, (err) => {
        if (err) {
            throw err;
        } else {
            console.log('Done.');
        }
    })
});