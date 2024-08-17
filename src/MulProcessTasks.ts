import { ChildProcess, fork } from 'child_process';
import cluster from 'cluster';
import { cpus } from 'os';
import { CmdProgressBar } from './CmdProgressBar';

export interface ITask {
    cmd: string;
    args?: string[];
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}


export class MulProcessTasks{
    concurrency = 2; // 并发数
    tasks: ITask[] = []; // 任务队列
    completedTasks: number = 0; // 完成的任务数量
    failTasks: number = 0; // 失败的任务数量
    totalTasks: number = 0; // 总任务数量
    isRuning: boolean = false; // 是否正在运行中
    tag: string = "MulProcessTasks";

    // 子进程，处理任务函数
    childRunTaskFun: (task: ITask, callback:(code: number, error: string)=>void)=>void;
    // 主进程，所有任务完成回调
    masterAllCompletedFun: ()=>void;

    public AddTask(task:ITask):void
    {
        this.tasks.push(task);
    }
    
    public SetTasks(tasks:ITask[]):void
    {
        this.tasks = tasks;
    }

    public constructor(
        // 子进程，处理任务函数
        childRunTaskFun:(task: ITask, callback:(code: number, error: string)=>void)=>void, 
        // 主进程，所有任务完成回调
        masterAllCompletedFun?: ()=>void,
         // 并发数
        concurrency: number = 0)
    {
        this.childRunTaskFun = childRunTaskFun;
        this.masterAllCompletedFun = masterAllCompletedFun;
        if(concurrency <= 0){
            concurrency = Math.ceil(cpus().length * 0.5);
        }
        else{
            concurrency =  Math.max( Math.ceil(cpus().length * 0.5), concurrency);
        }

        concurrency = Math.max(1, concurrency);
        console.log(`concurrency=${concurrency}`);
    }

    public Run(
        // 主进程 初始化函数
        masterInit?:(mulProcessTasks: MulProcessTasks, onInited:()=>void)=>void, 
        // 子进程 初始化函数
        childInit?:(mulProcessTasks: MulProcessTasks, onInited:()=>void)=>void
    ):void
    {

        if (cluster.isMaster) {
            if(masterInit != null)
            {
                masterInit(this, ()=>{
                    this.OnRunMaster();
                });
            } 
            else{
                this.OnRunMaster();
            }
        }
        else
        {
            
            if(childInit != null)
            {
                childInit(this, ()=>{
                    this.OnRunChild();
                });
            } 
            else{
                this.OnRunChild();
            }
        }
    }

    // 运行主线程
    protected OnRunMaster()
    {
        console.log(`主进程 ${process.pid} 正在运行`);
        
        if(this.tasks == null || this.tasks.length == 0){
            console.error("没有任务要执行 tasks.length=0");
            if(this.masterAllCompletedFun != null) this.masterAllCompletedFun()
            return;
        }

        this.completedTasks = 0;
        this.failTasks = 0;
        this.totalTasks = this.tasks.length;
        this.isRuning = true;

        let tasks = this.tasks;
        let tag = this.tag;

        // 创建 worker
        for (let i = 0; i < this.concurrency; i++) {
            var worker = cluster.fork();
            console.log(`创建worker: worker.id=${worker.id}, worker.process.pid=${worker.process.pid}`);
        }
    
        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died code=${code}`);
            // 重新创建 worker
            var worker = cluster.fork();
            console.log(`重新创建 worker: worker.id=${worker.id}, worker.process.pid=${worker.process.pid}`);
        });
    
        cluster.on('message', (worker, message) => {
            if(message.tag != tag){
                console.warn("主进程收到不正确的tag子进程消息");
                return;
            }
            if (message.code == 0) {
                this.completedTasks++;
              
            }
            else{
                this.failTasks ++;
            }
  
            const progress = Math.round((this.completedTasks / this.totalTasks) * 100);
            const failRate = Math.round((this.failTasks / (this.completedTasks + this.failTasks )) * 100);
            CmdProgressBar.Set(this.completedTasks + this.failTasks, this.totalTasks, `${this.failTasks ? "成功:" + this.completedTasks + " 失败:" +this.failTasks + " 失败占比:" +  failRate+"%": ""}`);

            if (this.completedTasks + this.failTasks === this.totalTasks) {
                console.log('所有任务完成');
                this.isRuning = false;
                if(this.masterAllCompletedFun != null) this.masterAllCompletedFun()
                // process.exit(0);
            }
            
            distributeTasks();
        });
    
        // 分发任务
        function distributeTasks() {
            for (const worker of Object.values(cluster.workers)) {
                if (tasks.length > 0) {
                    const task = tasks.shift()!;
                    if(!task.args) task.args = [];
                    
                    // console.log(`主进程 ${process.pid} 分发任务：worker.id=${worker.id}, worker.process.pid=${worker.process.pid},  task: ${task.cmd}  ${task?.args?.join(' ')}`);
                    worker.send({tag: tag, task: task});
                }
            }
        }
    
        distributeTasks();
    }

    // 运行子线程
    protected OnRunChild()
    {
        console.log(`进入子进程 ${process.pid} `);
        process.on('message', async (msg: {tag: string, task:ITask}) => {
            // console.log(`子进程 ${process.pid} 任务: ${task.cmd}  ${task?.args?.join(" ")} `);
            if(msg.tag != this.tag){
                console.warn("子进程收到不正确的tag主进程消息");
                return;
            }
            
            try {
                this.childRunTaskFun(msg.task, (code: number, error: string)=>{
                    if(code == 0){

                    }
                    else{

                    }
                    process.send({tag:this.tag, code: code, error: error });
                    // process.exit(0);
                });
            } catch (err) {
                console.error(`任务执行失败: ${err.message}`);
                process.send({tag:this.tag, code: 1, error: err.message });
                // process.exit(1);
            }
        });
    }
    

}
