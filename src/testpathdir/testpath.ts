
import path from "path";

// 返回运行文件所在的目录
console.log('__dirname : ' + __dirname)
// __dirname : /Desktop

// 当前命令所在的目录
console.log('resolve   : ' + path.resolve('./'))
// resolve   : /workspace

// 当前命令所在的目录
console.log('cwd       : ' + process.cwd())
// cwd       : /workspace

// 当前文件的上级目录
console.log('../       : ' + path.resolve(__dirname, '..'))