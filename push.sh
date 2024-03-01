echo "Ready to execute script"

# 默认 git commit message
msg="update: default by script"

# 默认 commit 分之
branch="main"

if [ -n "$1" ]
then
  msg=$1
fi

if [ -n "$2" ]
then
  branch=$2
fi

echo "git commit message:[$msg]"
echo "git branch:[$branch]"

read -p "Press Enter to continue"

# 执行 git push 过程
git add .
git status

sleep 1

git commit -m "$msg"

read -p "Press Enter to continue"

mkdocs build

read -p "Press Enter to continue"

git push origin "$branch"

