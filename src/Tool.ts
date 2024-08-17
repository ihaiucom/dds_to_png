

import path, { resolve } from "path";
import { exec } from 'child_process';

export enum ToolType{
    convert="convert.exe", 
}

export class Tool{

    public static toolRoot =  path.join(process.cwd(), "tool").normalize().replaceAll(/\\/g,'/');

    public static GetToolPath(tool: string)
    {
        var cmdPath = path.join(this.toolRoot, tool).normalize().replaceAll(/\\/g,'/');
        return cmdPath;
    }
    
    public static Run(tool: ToolType, toolArgs: string[], callback?: (code: number, error?:string)=>void):void
    {
        var cmdPath = this.GetToolPath(tool);
        this.Run2(cmdPath, toolArgs, callback);
    }

    public static Run2(tool: string, toolArgs: string[], callback?: (code: number, error?:string)=>void):void
    {
        var cmd = `${tool} ${toolArgs != null ? toolArgs.join(" ") : ""}`;
        const child = exec(cmd, {cwd: process.cwd()});

        
        // child.on('message', (message) => {
        //     // 处理子进程发送的消息
        // });
        
        child.on('exit', (code, signal) => {
            if (code !== 0) {
                console.error(`子进程退出，代码: ${code}, 信号: ${signal}\n ${cmd} `);
                if(callback != null) callback(code, signal);
            } else {
                if(callback != null) callback(0);
            }
        });
        
        child.on('error', (err) => {
            console.error(`子进程发生错误: ${cmd} \n${err.message}`);
        });
    }

    public static async Run2Async(tool: string, ...toolArgs: string[]): Promise<{code: number, error?: string}>
    {
        return new Promise((resolve)=>{
            this.Run2(tool, toolArgs, (code: number, error: string)=>{
                resolve({code: code, error: error});
            });
        });
    }
    

    public static async RunAsync(tool: ToolType, ...toolArgs: string[]): Promise<{code: number, error?: string}>
    {
        return new Promise((resolve)=>{
            this.Run(tool, toolArgs, (code: number, error: string)=>{
                resolve({code: code, error: error});
            });
        });
    }
}