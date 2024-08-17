export class CmdProgressBar{

    public static Set(completed: number, total: number, txt: string=""):void
    {
        const percent = Math.floor((completed / total) * 100);
        const bar = '='.repeat(percent / 2);
        const emptyBar = '-'.repeat(50 - percent / 2);
        process.stdout.write(`\r进度: [${bar}${emptyBar}] ${percent}% ${completed}/${total} ${txt}`);
        completed++;
        if (completed <= total) {
        //   setTimeout(updateProgress, 100); // 每100毫秒更新一次
        } else {
          console.log('\n任务完成！');
        }
    }
}