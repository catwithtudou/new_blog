## 1. Preparation:Operator system interfaces

> **book-riscv-rev3** Chapter1

![](https://img.zhengyua.cn/blog/202402050847707.png)

### 1.1 Processes and memory

- An xv6 process consists of user-space memory (instructions, data, and stack) and per-process state private to the kernel.
- A process may create a new process using the `fork` system call.

![](https://img.zhengyua.cn/blog/202402050855451.png)

- If `exec` succeeds then the child will execute instructions from `echo` instead of `runcmd`. At some point `echo` will call `exit`, which will cause the parent to return from `wait` in `main` (user/sh.c:146).
- why `fork` and `exec` are not combined in a single call; we will see later that the shell exploits the separation in its implementation of I/O redirection. To avoid the wastefulness of creating a duplicate process and then immediately replacing it (with `exec`), operating kernels optimize the implementation of `fork` for this use case by using virtual memory techniques such as copy-on-write (see Section 4.6).
- Xv6 allocates most user-space memory implicitly.

### 1.2 I/O and File descriptors

- A _file descriptor_ is a small integer representing a kernel-managed object that a process may read from or write to.
- the file descriptor interface abstracts away the differences between files, pipes, and devices, making them all look like streams of bytes. We’ll refer to input and output as _I/O_.
- By convention, a process reads from file descriptor 0 (standard input), writes output to file descriptor 1 (standard output), and writes error messages to file descriptor 2 (standard error).
    - the shell exploits the convention to implement I/O redirection and pipelines. The shell ensures that it always has three file descriptors open (user/sh.c:152), which are by default file descriptors for the console.
- The `read` and `write` system calls read bytes from and write bytes to open files named by file descriptors.
- The use of file descriptors and the convention that file descriptor 0 is input and file descriptor 1 is output allows a simple implementation of `cat`.
- A newly allocated file descriptor is always the lowest-numbered unused descriptor of the current process.
- The system call `exec` replaces the calling process’s memory but preserves its file table. This behavior allows the shell to implement _I/O redirection_ by forking, re-opening chosen file descriptors in the child, and then calling `exec` to run the new program.
- The parent process’s file descriptors are not changed by this sequence, since it modifies only the child’s descriptors.
- The second argument to `open` consists of a set of flags, expressed as bits, that control what `open` does.
    - like:open("input.txt", O_RDONLY)
- Now it should be clear why it is helpful that `fork` and `exec` are separate calls: between the two, the shell has a chance to redirect the child’s I/O without disturbing the I/O setup of the main shell.
- Although `fork` copies the file descriptor table, each underlying file offset is shared between parent and child.
- The `dup` system call duplicates an existing file descriptor, returning a new one that refers to the same underlying I/O object. Both file descriptors share an offset, just as the file descriptors duplicated by `fork` do.
- a process writing to file descriptor 1 may be writing to a file, to a device like the console, or to a pipe.

### 1.3 Pipe

- A _pipe_ is a small kernel buffer exposed to processes as a pair of file descriptors, one for reading and one for writing. Writing data to one end of the pipe makes that data available for reading from the other end of the pipe. Pipes provide a way for processes to communicate.

![](https://img.zhengyua.cn/blog/202402051015521.png)

- If no data is available, a `read` on a pipe waits for either data to be written or for all file descriptors referring to the write end to be closed.
- The fact that `read` blocks until it is impossible for new data to arrive is one reason that it’s important for the child to close the write end of the pipe before executing wc above
- (e.g., `a | b | c`) the shell may create a tree of processes.
- Pipes may seem no more powerful than temporary files: the pipeline
    - `echo hello world | wc` could be implemented without pipes as `echo hello world >/tmp/xyz; wc </tmp/xyz`
- Pipes have at least three advantages over temporary files in this situation.
    - First, pipes automatically clean themselves up; with the file redirection, a shell would have to be careful to remove `/tmp/xyz` when done.
    - Second, pipes can pass arbitrarily long streams of data, while file redirection requires enough free space on disk to store all the data.
    - Third, pipes allow for parallel execution of pipeline stages, while the file approach requires the first program to finish before the second starts.

### 1.4 File System

- The xv6 file system provides data files, which contain uninterpreted byte arrays, and directories, which contain named references to data files and other directories.
    - The directories form a tree, starting at a special directory called the _root_. 
    - Paths that don’t begin with / are evaluated relative to the calling process’s _current directory_, which can be changed with the chdir system call.
      
![](https://img.zhengyua.cn/blog/202402051035562.png)

- There are system calls to create new files and directories: 
    - `mkdir` creates a new directory
    - `open` with the O_CREATE flag creates a new data file
    - `mknod` creates a new device file

![](https://img.zhengyua.cn/blog/202402051036493.png)

- `mknod` creates a special file that refers to a device. Associated with a device file are the major and minor device numbers (the two arguments to `mknod`), which uniquely identify a kernel device.
    - When a process later opens a device file, the kernel diverts `read` and `write` system calls to the kernel device implementation instead of passing them to the file system.
- Each link consists of an entry in a directory; the entry contains a file name and a reference to an inode.
    - An inode holds _metadata_ about a file, including its type (file or directory or device), its length, the location of the file’s content on disk, and the number of links to a file.
- The `fstat` system call retrieves information from the inode that a file descriptor refers to.

![](https://img.zhengyua.cn/blog/202402051039010.png)

- The `link` system call creates another file system name referring to the same inode as an existing file.
    - Each inode is identified by a unique inode number.
    - After the code sequence above, it is possible to determine that a and b refer to the same underlying contents by inspecting the result of fstat: both will return the same inode number (`ino`), and the `nlink` count will be set to 2. 

```c
open("a", O_CREATE|O_WRONLY);
link("a", "b");
```

- an idiomatic way to create a temporary inode with no name that will be cleaned up when the process closes `fd` or exits.

```c
fd = open("/tmp/xyz", O_CREATE|O_RDWR);
unlink("/tmp/xyz");
```

- Unix provides file utilities callable from the shell as user-level programs.
- `cd` must change the current working directory of the shell itself.

### 1.5 Real World

- Unix’s combination of “standard” file descriptors, pipes, and convenient shell syntax for operations on them was a major advance in writing general-purpose reusable programs.
    - The idea sparked a culture of “software tools” that was responsible for much of Unix’s power and popularity, and the shell was the first so-called “scripting language.”
- The Unix system call interface has been standardized through the Portable Operating System Interface (POSIX) standard.
    -  Our main goals for xv6 are simplicity and clarity while providing a simple UNIX-like system-call interface.
- Unix unified access to multiple types of resources (files, directories, and devices) with a single set of file-name and file-descriptor interfaces.
    - This idea can be extended to more kinds of resources.
- The file system and file descriptors have been powerful abstractions. Even so, there are other models for operating system interfaces.
    - Multics, a predecessor of Unix, abstracted file storage in a way that made it look like memory, producing a very different flavor of interface. The complexity of the Multics design had a direct influence on the designers of Unix, who aimed to build something simpler.
- Any operating system must multiplex processes onto the underlying hardware, isolate processes from each other, and provide mechanisms for controlled inter-process communication.

## 2. Lecture 1

> https://pdos.csail.mit.edu/6.1810/2023/lec/l-overview.txt

### 2.1 operating system introduction

- What's an operating system?
    - [user/kernel diagram]
    - h/w: CPU, RAM, disk, net, &c
    - user applications: sh, cc, DB, &c
    - kernel services: FS, processes, memory, network, &c
    - system calls

- What is the purpose of an O/S?
    - Multiplex the hardware among many applications
    - Isolate applications for security and to contain bugs
    - Allow sharing among cooperating applications
    - Abstract the hardware for portability
    - Provide useful services

- Design tensions make O/S design interesting
    - efficient vs abstract/portable/general-purpose
    - powerful vs simple interfaces
    - flexible vs secure
    - compatible vs new hardware and interfaces

### 2.2 UNIX system calls

#### 2.2.1 example: ex1.c, copy input to output

```c
// ex1.c: copy input to output.
#include "kernel/types.h"
#include "user/user.h"

int main()
{
  char buf[64];
  while(1){
    int n = read(0, buf, sizeof(buf));
    if(n <= 0)
      break;
    write(1, buf, n);
  }
  exit(0);
}
```

- read() and write() are system calls
    - they look like function calls, but actually jump into the kernel.
- first read()/write() argument is a "file descriptor" (FD)
    - passed to kernel to tell it which "open file" to read/write 
    - must previously have been opened 
    - an FD connects to a file/pipe/socket/&c 
    - a process can open many files, have many FDs

!!! note "**UNIX convention: fd 0 is "standard input", 1 is "standard output"**"
    - programs don't have to know where input comes from, or output goes 
    - they can just read/write FDs 0 and 1

- second read() argument is a pointer to some memory into which to read
- third argument is the number of bytes to read
    - read() may read less, but not more
- return value: number of bytes actually read, or -1 for error
- note: ex1.c does not care about the format of the data 
    - UNIX I/O is 8-bit bytes 
    - interpretation is application-specific, e.g. database records, C source, &c

> where do file descriptors come from?
> 
> answer:
> 
> File descriptors are integer values that are used to identify and access files or other input/output resources within a computer operating system. In Unix-like operating systems, including Linux, file descriptors are typically obtained through the process of opening files, pipes, sockets, and other resources. 
> 
> The steps and thought process for obtaining file descriptors are as follows:
> 
> 1. **Open System Call**: File descriptors are typically obtained through the use of system calls such as `open()` for files, `socket()` for network sockets, or `pipe()` for inter-process communication pipes. When a file or resource is opened, the operating system returns a file descriptor that can be used to reference that resource in subsequent read or write operations.
> 2. **Assignment**: Once obtained from the system call, the file descriptor is typically assigned to a variable in the program for later use. For example, after opening a file, the returned file descriptor might be stored in an integer variable for easy reference.
> 3. **Use in I/O Operations**: The obtained file descriptor is then used in read and write operations to perform input and output on the associated resource. For example, the file descriptor might be passed as an argument to the `read()` or `write()` system calls to read from or write to the associated file, pipe, or socket.
> 4. **Closing**: After the file descriptor is no longer needed, it should be closed using the `close()` system call. This releases the associated resources and frees up the file descriptor for reuse. 
>
> In summary, file descriptors are obtained through system calls when opening files or other resources, and they serve as references to those resources for performing input/output operations within a program.

#### 2.2.2 example: ex2.c, create a file

```c
// ex2.c: create a file, write to it.

#include "kernel/types.h"
#include "user/user.h"
#include "kernel/fcntl.h"

int main()
{
  int fd = open("out", O_WRONLY | O_CREATE | O_TRUNC);

  printf("open returned fd %d\n", fd);

  write(fd, "ooo\n", 4);

  exit(0);
}
```

- open() creates (or opens) a file, returns a file descriptor (or -1 for error)
- FD is a small integer 
- FD indexes into a per-process table maintained by kernel
- different processes have different FD name-spaces 
    - e.g. FD 3 usually means different things to different processes

!!! note "**what happens when a program calls a system call like open()?**"
    - CPU saves some user registers
    - CPU increases privilege level
    - CPU jumps to a known "entry point" in the kernel
    - now running C code in the kernel
    - kernel calls system call implementation
        - sys_open() looks up name in file system 
        - it might wait for the disk 
        - it updates kernel data structures (file block cache, FD table)
    - restore user registers
    - reduce privilege level
    - jump back to calling point in the program, which resumes

- typing to UNIX's command-line interface, the shell
    - the shell is an ordinary user program, not part of the kernel
    - the shell lets you run UNIX command-line utilities
    - **time-sharing via the shell was the original focus of UNIX**


#### 2.2.3 example: ex3.c, create a new process

```c
// ex3.c: create a new process with fork()
#include "kernel/types.h"
#include "user/user.h"
int main()
{
  int pid;
  pid = fork();
  printf("fork() returned %d\n", pid);
  if(pid == 0){
    printf("child\n");
  } else {
    printf("parent\n");
  }
  exit(0);
}
```

- a separate process helps prevent them from interfering, e.g. if buggy 
- the fork() system call creates a new process 
- the kernel makes a copy of the calling process
    - instructions, data, registers, file descriptors, current directory
    - "parent" and "child" processes
- child and parent are initially identical!
    - except: fork() returns a pid in parent, 0 in child
- a pid (process ID) is an integer; kernel gives each process a different pid

#### 2.2.4 example: ex4.c, replace calling process with an executable file

```c
// ex4.c: replace a process with an executable file

#include "kernel/types.h"
#include "user/user.h"
int main()
{
  char *argv[] = { "echo", "this", "is", "echo", 0 };
  exec("echo", argv);
  printf("exec failed!\n");
  exit(0);
}
```

> how does the shell run a program, e.g. $ echo a b c

- a program is stored in a file: instructions and initial memory
    - created by the compiler and linker
- so there's a file called echo, containing instructions
    - on your own computer: ls -l /bin/echo
- exec() replaces current process with an executable file 
    - discards old instruction and data memory 
    - loads instructions and initial memory from the file 
    - preserves file descriptors

#### 2.2.5 example: ex5.c, fork() a new process, exec() a program

```c
#include "kernel/types.h"
#include "user/user.h"
// ex5.c: fork then exec
int main()
{
  int pid, status;
  pid = fork();
  if(pid == 0){
    char *argv[] = { "echo", "THIS", "IS", "ECHO", 0 };
    exec("echo", argv);
    printf("exec failed!\n");
    exit(1);
  } else {
    printf("parent waiting\n");
    wait(&status);
    printf("the child exited with status %d\n", status);
  }

  exit(0);
}
```

-  the shell can't simply call exec()!
    - since it wouldn't be running any more 
    - wouldn't be able to accept more than one command
- **ex5.c shows how the shell deals with this:**
    - fork() a child process 
    - child calls exec()
    - parent wait()s for child to finish
- the shell does this fork/exec/wait for every command you type 
    - after wait(), the shell prints the next prompt
- **exit(status) -> wait(&status)**
    - status allows children to send back 32 bits of info to parent 
    - status convention: 0 = success, 1 = command encountered an error
- **note: the fork() copies, but exec() discards the copied memory**
    - this may seem wasteful, you'll transparently eliminate the copy in the "copy-on-write" lab

#### 2.2.6 example: ex6.c, redirect the output of a command

```c

#include "kernel/types.h"
#include "user/user.h"
#include "kernel/fcntl.h"
// ex6.c: run a command with output redirected
int main()
{
  int pid;
  pid = fork();
  if(pid == 0){
    close(1);
    open("out", O_WRONLY | O_CREATE | O_TRUNC);

    char *argv[] = { "echo", "this", "is", "redirected", "echo", 0 };
    exec("echo", argv);
    printf("exec failed!\n");
    exit(1);
  } else {
    wait((int *) 0);
  }

  exit(0);
}
```

-  what does the shell do for this? 
  - $ echo hello > out 
  - answer: fork, child changes FD 1, child exec's echo
- note: open() always chooses lowest unused FD; 1 due to close(1). 
- note: exec preserves FDs 
- fork, FDs, and exec interact nicely to implement I/O redirection 
    - separate fork-then-exec gives child a chance to change FDs 
    - before exec() gives up control 
    - and without disturbing parent's FDs
- FDs provide indirection 
    - commands just use FDs 0 and 1, don't have to know where they go


#### 2.2.7 example: ex7.c, communicate through a pipe

```c
// ex7.c: communication over a pipe
#include "kernel/types.h"
#include "user/user.h"
int main()
{
  int fds[2];
  char buf[100];
  int n;

  // create a pipe, with two FDs in fds[0], fds[1].
  pipe(fds);
  
  // write to the pipe
  write(fds[1], "xyz\n", 4);

  // read from the pipe
  n = read(fds[0], buf, sizeof(buf));

  // display the results on the terminal
  write(1, buf, n);

  exit(0);
}
```

- an FD can refer to a "pipe", rather than a file 
- **the pipe() system call creates two FDs** 
    - read from the first FD 
    - write to the second FD
- the kernel maintains a buffer for each pipe
    - write() appends to the buffer 
    - read() waits until there is data

#### 2.2.8 example: ex8.c, communicate between processes

```c
#include "kernel/types.h"
#include "user/user.h"
// ex8.c: communication between two processes
int main()
{
  int n, pid;
  int fds[2];
  char buf[100];
  
  // create a pipe, with two FDs in fds[0], fds[1].
  pipe(fds);

  pid = fork();
  if (pid == 0) {
    // child
    write(fds[1], "this is ex8\n", 12);
  } else {
    // parent
    n = read(fds[0], buf, sizeof(buf));
    write(1, buf, n);
  }

  exit(0);
}
```

- the shell builds pipelines by forking twice and calling exec()
- pipes are a separate abstraction, but combine well w/ fork()


#### 2.2.9 example: ex9.c, list files in a directory

```c
#include "kernel/types.h"
#include "user/user.h"

// ex9.c: list file names in the current directory

struct dirent {
  ushort inum;
  char name[14];
};

int main()
{
  int fd;
  struct dirent e;

  fd = open(".", 0);
  while(read(fd, &e, sizeof(e)) == sizeof(e)){
    if(e.name[0] != '\0'){
      printf("%s\n", e.name);
    }
  }
  exit(0);
}
```