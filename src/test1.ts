
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
const queue: Task[] = [];

if (cluster.isMaster) {
  console.log(`主进程 ${process.pid} 正在运行`);

  // 创建 worker
  for (let i = 0; i < concurrency; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    // 重新创建 worker
    cluster.fork();
  });

  // 添加任务到队列
  queue.push({ cmd: 'ping', args: ['www.baidu.com'] });
  queue.push({ cmd: 'ls', args: ['-la'], cwd: '/tmp' });

  // 从队列中取出任务，分发给 worker
  async function processTasks() {
    while (queue.length > 0) {
      const task = queue.shift()!;
      const worker = cluster.workers[Object.keys(cluster.workers)[0]];
      worker.send(task);
      await new Promise(resolve => setTimeout(resolve, 100)); // 简单延时，模拟任务执行
    }
  }

  processTasks();
} else {
  process.on('message', async (task: Task) => {
    try {
      const child = fork(process.execPath, [task.cmd, ...(task.args || [])], {
        cwd: task.cwd,
        env: task.env,
      });

      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`子进程退出码 ${code}`));
          } else {
            resolve(0);
          }
        });
      });
      process.send({ success: true });
    } catch (err) {
      console.error(err);
      process.send({ success: false, error: err.message });
    }
  });
}
