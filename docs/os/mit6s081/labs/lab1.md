# Lab: Xv6 and Unix utilities

> https://pdos.csail.mit.edu/6.1810/2023/labs/util.html

## 0. MacOs Environments

For this class we'll need the RISC-V versions of a couple different tools: QEMU 5.1+, GDB 8.3+, GCC, and Binutils.

> Previously installed corresponding programs can be omitted by yourself.

- First, install developer tools:

```shell
xcode-select --install
```

- Next, install Homebrew, a package manager for macOS:

```shell
$ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

- Next, install the RISC-V compiler toolchain:

```shell
$ brew tap riscv/riscv
$ brew install riscv-tools
```

- The brew formula may not link into /usr/local. You will need to update your shell's rc file (e.g. ~/.bashrc) to add the appropriate directory to $PATH.

```shell
PATH=$PATH:/usr/local/opt/riscv-gnu-toolchain/bin
```

- Finally, install QEMU:

```shell
brew install qemu
```

- Testing your Installation:

```shell
$ qemu-system-riscv64 --version
QEMU emulator version 5.1.0
$ riscv64-unknown-elf-gcc --version
riscv64-unknown-elf-gcc (GCC) 10.1.0
...
```

![](https://img.zhengyua.cn/blog/202402061057442.png)

![](https://img.zhengyua.cn/blog/202402061058245.png)

## 1. Boot xv6

- Fetch the git repository for the xv6 source for the lab:

```shell
$ git clone git://g.csail.mit.edu/xv6-labs-2023
Cloning into 'xv6-labs-2023'...
...
$ cd xv6-labs-2023
```

![](https://img.zhengyua.cn/blog/202402061112613.png)


- Build and run xv6:

```shell
$ make qemu
riscv64-unknown-elf-gcc    -c -o kernel/entry.o kernel/entry.S
riscv64-unknown-elf-gcc -Wall -Werror -O -fno-omit-frame-pointer -ggdb -DSOL_UTIL -MD -mcmodel=medany -ffreestanding -fno-common -nostdlib -mno-relax -I. -fno-stack-protector -fno-pie -no-pie   -c -o kernel/start.o kernel/start.c
...
riscv64-unknown-elf-ld -z max-page-size=4096 -N -e main -Ttext 0 -o user/_zombie user/zombie.o user/ulib.o user/usys.o user/printf.o user/umalloc.o
riscv64-unknown-elf-objdump -S user/_zombie > user/zombie.asm
riscv64-unknown-elf-objdump -t user/_zombie | sed '1,/SYMBOL TABLE/d; s/ .* / /; /^$/d' > user/zombie.sym
mkfs/mkfs fs.img README  user/xargstest.sh user/_cat user/_echo user/_forktest user/_grep user/_init user/_kill user/_ln user/_ls user/_mkdir user/_rm user/_sh user/_stressfs user/_usertests user/_grind user/_wc user/_zombie
nmeta 46 (boot, super, log blocks 30 inode blocks 13, bitmap blocks 1) blocks 954 total 1000
balloc: first 591 blocks have been allocated
balloc: write bitmap block at sector 45
qemu-system-riscv64 -machine virt -bios none -kernel kernel/kernel -m 128M -smp 3 -nographic -drive file=fs.img,if=none,format=raw,id=x0 -device virtio-blk-device,drive=x0,bus=virtio-mmio-bus.0

xv6 kernel is booting

hart 2 starting
hart 1 starting
init: starting sh
```

![](https://img.zhengyua.cn/blog/202402061113732.png)

- xv6 has no ps command, but, if you type `Ctrl-p`, the kernel will print information about each process.
    - If you try it now, you'll see two lines: one for init, and one for `sh`. 

![](https://img.zhengyua.cn/blog/202402061115427.png)

- To quit qemu type: `Ctrl-a x` (press `Ctrl` and `a` at the same time, followed by x).

## 2. sleep(easy)

> Implement a user-level sleep program for xv6, along the lines of the UNIX sleep command. Your sleep should pause for a user-specified number of ticks. A tick is a notion of time defined by the xv6 kernel, namely the time between two interrupts from the timer chip. Your solution should be in the file user/sleep.c.

即实现系统函数 sleep 的功能，根据提示进行实现，其中关键点就是：

- 当用户参数缺失时，需要提示错误信息
- 系统函数 sleep 的入参是整型，而在终端获取的值是字符，此时可使用 atoi 函数

具体代码如下：

```c
#include "kernel/types.h"
#include "user/user.h"

int main(int argc, char *argv[]) {
  if (argc != 2) {
    fprintf(2, "usage: sleep [ticks num]\n");
    exit(1);
  }

  int ticks = atoi(argv[1]);
  int ret = sleep(ticks);
  exit(ret);
}
```

## 3. pingpong(easy)

![](https://img.zhengyua.cn/blog/202402180945534.png)

该题主要考查 pipe、fork 的使用和文件描述符的读写应用。根据提示和参考示例8进行实现，其中较为关键的是：

- 父子进程是双向通信，ping 和 pong 需要两个 pipe
- 为了避免资源泄漏和阻塞，可通过 close 关闭不再需要的 pipe 端口
- 在 read pipe 时是进程阻塞的，直到有数据 write pipe 后才会继续向下执行

具体代码如下：

```c
#include "kernel/types.h"
#include "user/user.h"

int main(){
  int pid,fork_pid;
  int child_pipe[2],parent_pipe[2];
  char buf[] = {'a'};

  pipe(child_pipe);
  pipe(parent_pipe);

  fork_pid = fork();

  if (fork_pid == 0) { // child
    pid = getpid();
    // step2: read a byte from the parent, and print
    close(parent_pipe[1]);
    read(parent_pipe[0],buf,1);
    printf("%d: received ping\n",pid);
    // step3: write a byte to the parent
    close(child_pipe[0]);
    write(child_pipe[1],buf,1);
  } else {  // parent
    pid = getpid();
    // step1: send a byte to the child
    close(parent_pipe[0]);
    write(parent_pipe[1],buf,1);
    // step4: read a byte from the child, and print
    close(child_pipe[1]);
    read(child_pipe[0],buf,1);
    printf("%d: received pong\n",pid);
  }

  exit(0);
}
```

## 4. primes(moderate/hard)

![](https://img.zhengyua.cn/blog/202402181004931.png)

即实现Sieve质数算法，在 https://swtch.com/~rsc/thread/ 中实际上提示了关键思路：

![](https://img.zhengyua.cn/blog/202402181132102.png)

根据上述思路，通过 pipe 和 fork 进行实现，具体代码如下：

```C
#include "kernel/types.h"
#include "user/user.h"

__attribute__((noreturn))
void deliver_process(int read_fd){
    int cur_num = 0;
    int is_fork = 0;
    int pass_num = 0;
    int pipes[2];
    while(1){
       // get a number from the left neighbor
       int read_len = read(read_fd,&pass_num,4);

       // the left neighbor empty or close
       if (read_len == 0 ){
           close(read_fd);
           if (is_fork){
               close(pipes[1]);
               close(pipes[0]);
               wait(0);
           }
           exit(0);
       }

       if (cur_num==0){
           cur_num = pass_num;
           printf("prime %d\n",cur_num);
       }

       if (pass_num%cur_num!=0) {
           if (!is_fork){
               // create new process and pipe
               pipe(pipes);
               is_fork = 1;
               int pid = fork();
               if (pid==0){ // child
                   // next process handle
                   // deliver to the next process pipes for writing
                   close(pipes[1]);
                   close(read_fd);
                   deliver_process(pipes[0]);
               } else{ // parent
                   close(pipes[0]);
               }
           }

           // send n to the right neighbor
           write(pipes[1],&pass_num,4);
       }
    }
}


int main(int argc, char *argv[]) {
    int pipes[2];
    pipe(pipes);
    for (int i=2;i<=35;i++) {
        write(pipes[1],&i,4);
    }
    close(pipes[1]);
    deliver_process(pipes[0]);
    exit(0);
}
```