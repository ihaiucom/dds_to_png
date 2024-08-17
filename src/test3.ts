// import { exec } from 'child_process';
// import { promisify } from 'util';
// import path from "path";

import { Tool, ToolType } from "./Tool";

// console.log(`__dirname=${__dirname}`);

// // projectRoot=D:\zengfeng\githubs\zeng.mdx\dds_to_png
// const projectRoot = process.cwd(); // 获取项目根目录
// console.log(`projectRoot=${projectRoot}`);

// const runDir: string = path.dirname(process.argv[1]);
// console.log(runDir);

// // D:/zengfeng/githubs/zeng.mdx/dds_to_png/tool/convert.exe
// var cmdPath = path.join(projectRoot, "./tool/convert.exe").normalize().replaceAll(/\\/g,'/');
// console.log(`cmdPath=${cmdPath}`);
// const child = exec(`${cmdPath} a.dds b.png`, {cwd: projectRoot});


// child.on('message', (message) => {
//   // 处理子进程发送的消息
//     console.log(`child.message: message=${message}`);
// });

// child.on('exit', (code, signal) => {
//     console.log(`child.exit: code=${code}`);
//   if (code !== 0) {
//     console.error(`子进程退出，代码: ${code}, 信号: ${signal}`);
//     // reject(new Error(`子进程执行失败`));
//   } else {
//     // resolve(true);
//   }
// });

// child.on('error', (err) => {
//   console.error(`子进程发生错误: ${err.message}`);
// //   reject(err);
// });


Tool.Run(ToolType.convert, ['./a.dds', './c.png']);

async function main() {
    var r = await Tool.RunAsync(ToolType.convert, ...['./a.dds', './d.png']);
    console.log(r);
};

main();