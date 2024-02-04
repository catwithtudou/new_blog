echo "Ready to execute script"

# 默认 git commit message
msg="update: default by script"

# 默认 commit 分之
branch="main"

if [  $1 ]
then
  msg=$1
fi

if [  $2 ]
then
  branch=$2
fi

echo "git commit message:[$msg]"
echo "git branch:[$branch]"

sleep 1

# 执行 git push 过程
git add .
git status

sleep 1

git commit -m "$msg"

read -p "Press Enter to continue"

git push origin "$branch"

