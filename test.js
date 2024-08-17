const cluster = require('cluster');
const os = require('os');
const { exec } = require('child_process');
const queue = []; // 任务队列

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;

  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worke,   r, code, signal) => {
    console.log(`worker ${worker.process.pid} di   ed`);
  });

  // 添加任务到队列
  queue.push({ cmd: 'ping www.baidu.com' });
  queue.push({ cmd: 'ls -la' });

  // 从队列中取出任务，分发给 worker
  function processTask() {
    if (queue.length === 0) {
      return;
    }
    const task = queue.shift();
    const worker = cluster.workers[Object.keys(cluster.workers)[0]];
    worker.send({ task });
  }

  setInterval(processTask, 1000); // 每秒处理一个任务
} else {
  process.on('message', (message) => {
    exec(message.task.cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      // 将结果发送回主进程
      process.send({ result: { stdout, stderr } });
    });
  });
}
