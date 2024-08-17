
import { ChildProcess, fork } from 'child_process';
import cluster from 'cluster';
import { cpus } from 'os';

interface Task {
    cmd: string;
    args?: string[];
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}

const numCPUs = cpus().length;
const concurrency = 2; // 并发数
const tasks: Task[] = [
    { cmd: 'ping', args: ['www.baidu.com 1'] },
    { cmd: 'ping', args: ['www.baidu.com 2'] },
    { cmd: 'ping', args: ['www.baidu.com 3'] },
    { cmd: 'ping', args: ['www.baidu.com 4'] },
    { cmd: 'ping', args: ['www.baidu.com 5'] },
    { cmd: 'ping', args: ['www.baidu.com 6'] },
    { cmd: 'ping', args: ['www.baidu.com 7'] },
    // ... 其他任务
];
let completedTasks = 0;
let totalTasks = tasks.length;


console.log(` ${process.pid} ---: tasks.length=${tasks.length}， completedTasks=${completedTasks}`);

if (cluster.isMaster) {
    console.log(`主进程 ${process.pid} 正在运行`);

    // 创建 worker
    for (let i = 0; i < concurrency; i++) {
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
        if (message.type === 'taskCompleted') {
            completedTasks++;
            console.log(`主进程收到子进程完成消息： ${process.pid} completedTasks=${completedTasks}`);
            const progress = Math.round((completedTasks / totalTasks) * 100);
            console.log(`任务进度: ${progress}% (${completedTasks}/${totalTasks})`);
            if (completedTasks === totalTasks) {
                console.log('所有任务完成');
                process.exit(0);
            }
        }

        
        distributeTasks();
    });

    // 分发任务
    function distributeTasks() {
        for (const worker of Object.values(cluster.workers)) {
            if (tasks.length > 0) {
                const task = tasks.shift()!;
                
                console.log(`主进程 ${process.pid} 分发任务：worker.id=${worker.id}, worker.process.pid=${worker.process.pid},  task: ${task.cmd}  ${task.args.join(' ')}`);
                worker.send({ type: 'task', task });
            }
        }
    }

    distributeTasks();
} else {
    console.log(`进入子进程 ${process.pid} `);
    process.on('message', async (task) => {
        console.log(`子进程 ${process.pid} 任务: ${task}  `);
        try {
            // ... 执行任务逻辑
            process.send({ type: 'taskCompleted' });
            // process.exit(0);
        } catch (err) {
            console.error(`任务执行失败: ${err.message}`);
            process.send({ type: 'taskFailed', error: err.message });
            // process.exit(1);
        }
    });
}