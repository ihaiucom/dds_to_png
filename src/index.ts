import {Command,Option} from "commander";
import path from "path";
import { ITask, MulProcessTasks } from "./MulProcessTasks";
import { Tool, ToolType } from "./Tool";
import { Timer } from "./Timer";
import { FileUtils } from "./FileUtils";
import fs from "fs";

const program = new Command();
program
    .version("1.0.0",'-v version')
    .usage(`
    ts-node ./src/index.ts --src ../zeng.mdx_war_res/war3.w3mod --dest ../zeng.mdx_war_res/war3.png
    `)
    
    .option('-s, --src <path>', 'dds所在目录', "../zeng.mdx_war_res/war3.w3mod")
    .option('-d, --dest <path>', '转换到的png目录', "../zeng.mdx_war_res/war3.png")
    .option('-e, --exes <string[]>', '要查找的图片扩展文件', ".dds,.tga");

program.parse(process.argv);
const options = program.opts();
const cwd =  process.cwd().normalize().replaceAll(/\\/g,'/');
// const runDir: string = path.dirname(process.argv[1]);
const srcDir = GetAbsolutePath(options.src);
const destDir = GetAbsolutePath(options.dest);

let exesStr: string = options.exes;
let exes = exesStr.split(',');

console.log(`cwd: ${cwd}`);
console.log(`--src: ${srcDir}`);
console.log(`--dest: ${destDir}`);
console.log(`--exes: `, exes);


// // 返回运行文件所在的目录
// console.log('__dirname : ' + __dirname)
// // __dirname : /Desktop

// // 当前命令所在的目录
// console.log('resolve   : ' + path.resolve('./'))
// // resolve   : /workspace

// // 当前命令所在的目录
// console.log('cwd       : ' + process.cwd())
// // cwd       : /workspace

// // 当前文件的上级目录
// console.log('../       : ' + path.resolve(__dirname, '..'))


function PathFormat(filePath:string): string
{
    filePath = path.normalize(filePath).replaceAll(/\\/g,'/');
    return filePath;
}


function PathJoin(...paths: string[]): string
{
    let filePath = path.join(...paths);
    return PathFormat(filePath);
}

function GetAbsolutePath(filePath:string): string
{
    if(!path.isAbsolute(filePath))
    {
        filePath = PathJoin(cwd, filePath);
    }
    filePath = PathFormat(filePath);
    return filePath;
}

function changeExtension(filePath, newExtension) {
    return filePath.replace(path.extname(filePath), newExtension);
    // const parsedPath = path.parse(filePath);
    // parsedPath.ext = newExtension;
    // const newPath = path.format(parsedPath);
    // console.log(path.extname(filePath), parsedPath.ext, newPath);
    // return newPath;
  }

// 主进程 初始化函数
async function  masterInit(mulProcessTasks: MulProcessTasks, onInited:()=>void)
{
    Timer.I.start();
    var list = await FileUtils.getFilesWithExtensions(srcDir, exes);
    console.log(`list.length=${list.length}`);

    for(var i = 0; i < list.length; i ++)
    {
        var itemSrcPath = list[i];
        var itemSrcRelativePath = path.relative(srcDir, itemSrcPath);
        
        var itemDestPath = path.join(destDir, changeExtension(itemSrcRelativePath, ".png"));
        // console.log(itemDestPath);
        var itemDestPathDir = path.dirname(itemDestPath);
        FileUtils.checkAndCreateDir(itemDestPathDir);

        if(!fs.existsSync(itemDestPath)){
            mulProcessTasks.AddTask({cmd: ToolType.convert, args:[itemSrcPath, itemDestPath]});
        }
    }

    onInited();
}


// 子进程，处理任务函数
function childRunTaskFun(task:ITask, callback:(code: number, error: string)=>void){
    Tool.Run(task.cmd as ToolType, task.args,  callback);
}

// 主进程，所有任务完成回调
function masterAllCompletedFun(){
    Timer.I.stop();
    process.exit(0); //退出主进程（退出整个程序）
}

// 多进程任务处理
var mulProcessTasks = new MulProcessTasks(childRunTaskFun, masterAllCompletedFun);
mulProcessTasks.Run(masterInit);
