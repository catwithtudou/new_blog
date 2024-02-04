# 数组算法

## 1. 二分查找

!!! note "核心点"
    - **有序**数组
    - **将目标值与数组中间元素进行比较**，从而排除掉一半的元素，如此循环，直到找到目标值或确定目标值不存在
    - 通常时间复杂度：$O(logn)$

其中需要注意:

- 区间范围决定了边界（包含起始位置）的值，可通过构造简单的有序数组来演算进行理解

### 1.1 代码模版

1. 左闭右闭 [left, right]

```go
func search(nums []int, target int) int {
    high := len(nums)-1
    low := 0
    for low <= high {
        mid := low + (high-low)/2
        if nums[mid] == target {
            return mid
        } else if nums[mid] > target {
            high = mid-1
        } else {
            low = mid+1
        }
    }
    return -1
}
```

2. 左闭右开 [left, right)

```golang
func search(nums []int, target int) int {
	left, right := 0, len(nums)
	for left < right {
		mid := left + (right-left)/2
		if nums[mid] > target {
			right = mid
		} else if nums[mid] < target {
			left = mid + 1
		} else {
			return mid
		}
	}

	return -1
}
```


### 1.2 LeetCode题目

- [x] 704二分查找
- [ ] 35.搜索插入位置 
- [ ] 34.在排序数组中查找元素的第一个和最后一个位置 
- [ ] 69.x 的平方根 
- [ ] 367.有效的完全平方数