import fs from "fs";
import path from "path";
import { Timer } from "./Timer";
export class FileUtils {

    static getFilesWithExtensions(dir: string, extensions: string[]): Promise<string[]> {
        return new Promise<string[]>((resolve) => {
            if (!extensions) extensions = [];
            var files: string[] = [];
            this.getFilesWithExtensions2(dir, extensions, files, () => {
                // console.log("getFilesWithExtensions end1 " + files.length);
                resolve(files);
                // console.log("getFilesWithExtensions end2");
            });
        });
    }



    static getFilesWithExtensions2(dir: string, extensions: string[], files: string[], callback: Function) {
        // if(files.length > 20){
        //     callback();
        //     return;
        // }

        Timer.I.once(() => {
            if (!extensions) extensions = [];
            // console.log(dir);
            const filesInDir = fs.readdirSync(dir);
            var dirList = [];
            for (let i = 0; i < filesInDir.length; i++) {
                var file = filesInDir[i];
                var filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    var name = path.basename(filePath);
                    if (name == 'node_modules' || name == '.git' || name == '.svn' || name == '.idea' || filePath.replace(/\\/g, '/').indexOf('.laya/chrome') != -1) {
                        continue;
                    }
                    dirList.push(filePath);
                } else if (extensions.length == 0 || extensions.includes(path.extname(filePath))) {
                    files.push(filePath);
                }

            }

            if (dirList.length == 0) {
                // console.log("end1 " + dir);
                callback();
            }

            let index = 0;
            for (let i = 0; i < dirList.length; i++) {
                var itemDirPath = dirList[i];

                FileUtils.getFilesWithExtensions2(itemDirPath, extensions, files, () => {
                    index++;
                    if (index >= dirList.length) {
                        // console.log("end2 " + index + "/" + dirList.length + "  " + dir);
                        callback();
                    }
                });
            }


        });

    }


    static isDirectoryEmpty(dir) {
        let isEmpty = true;
        let list = fs.readdirSync(dir);
        for (var itemPath of list) {
            const filePath = path.join(dir, itemPath);
            if (fs.statSync(filePath).isDirectory()) {
                if (!this.isDirectoryEmpty(filePath)) {
                    isEmpty = false;
                    break;
                }
            } else {
                isEmpty = false;
                break;
            }
        }

        return isEmpty;
    }

    /**
      * 清理空目录
      * @param dirPath 目录路径
      */
    public static clearEmptyDir(dirPath: string): void {
        // 判断目录是否存在
        if (!fs.existsSync(dirPath)) {
            console.warn(`目录 ${dirPath} 不存在`);
            return;
        }

        // 获取目录下的所有文件和子目录
        const files = fs.readdirSync(dirPath);

        // 如果目录为空，则直接删除
        if (files.length === 0) {
            fs.rmdirSync(dirPath);
            console.log(`已删除空目录 ${dirPath}`);
            return;
        }

        // 遍历目录下的所有文件和子目录
        for (const file of files) {
            const filePath = path.join(dirPath, file);

            // 如果是子目录，则递归清理
            if (fs.statSync(filePath).isDirectory()) {
                this.clearEmptyDir(filePath);
            }
        }

        // 再次获取目录下的所有文件和子目录
        const newFiles = fs.readdirSync(dirPath);

        // 如果目录为空，则直接删除
        if (newFiles.length === 0) {
            fs.rmdirSync(dirPath);
            console.log(`已删除空目录 ${dirPath}`);
        }
    }

    /**
   * 获取根目录
   * @param relativePath 相对路径
   * @returns 根目录
   */
    static getRootPath(relativePath: string): string {
        return path.resolve(relativePath, '../');
    }


    static rmdirSync(dirPath: string) {
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach((file) => {
                const curPath = path.join(dirPath, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.rmdirSync(curPath);
                    // fs.rmdirSync(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dirPath);
        }
    }

    /** 检测目录是否存在，不存在就创建 */
    static checkAndCreateDir(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    static checkAndCreateDirByFileName(fileName: string) {
        this.checkAndCreateDir(path.dirname(fileName));
    }


    static async encryptAsync(inputDir: string, extensions: string[], outputFile: string, passworld: string) {
        let list = await FileUtils.getFilesWithExtensions(inputDir, extensions);



        console.log(path.normalize(outputFile));
        Timer.I.stop();
    }

}