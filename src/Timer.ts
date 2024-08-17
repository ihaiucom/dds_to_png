export class Timer {
    public static I: Timer = new Timer();

    private onceList = [];
    public once(fun: Function) {
        fun();
        // this.onceList.push(fun);
    }

    loop() {
        var i = 0;
        while (this.onceList.length > 0 && i++ < 5) {
            var fun = this.onceList.shift();
            fun();
        }
    }

    async WaitFrameAsync() {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 16);
        })
    }


    async WaitTime(t = 100) {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, t);
        })
    }

    isRuning = false;
    start() {
        this.isRuning = true;
        this.doStart();
    }

    doStart() {
        if (this.isRuning) {
            setTimeout(() => {
                this.loop();
                this.doStart();
            }, 16);
        }

    }

    stop() {
        this.isRuning = false;
    }
}