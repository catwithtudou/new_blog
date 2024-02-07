# 链表算法

## 1. 移除链表元素

对应 LeetCode 题目：

![](https://img.zhengyua.cn/blog/202402071513660.png)

这里就涉及到前面理论部分所讲的链表的删除操作。

但是在实际编写代码过程中可发现：

- 若直接采用节点 next 指针直接指向下一个节点的方式
- 则删除头部结点和其他结点的处理是不同的

所以下面我们期望通过一种方式来让两种方式的处理保持一致。

## 1.1 思路:借助虚拟头结点

通过设置一个虚拟头结点，这样原链表的所有节点就都可以按照统一的方式进行移除。

![](https://img.zhengyua.cn/blog/202402071519141.png)

最后在返回头结点的时候，注意需要返回虚拟头结点的 next，具体代码如下：

- 时间复杂度：$O(n)$，空间复杂度:$O(1)$

```go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func removeElements(head *ListNode, val int) *ListNode {
	dummyHead := &ListNode{}
	dummyHead.Next = head
	cur := dummyHead
	for cur != nil && cur.Next != nil {
		if cur.Next.Val == val {
			cur.Next = cur.Next.Next
		} else {
			cur = cur.Next
		}
	}

	return dummyHead.Next
}
```

```rust
pub struct Solution;

// Definition for singly-linked list.
#[derive(PartialEq, Eq, Clone, Debug)]
pub struct ListNode {
    pub val: i32,
    pub next: Option<Box<ListNode>>,
}

impl ListNode {
    #[inline]
    fn new(val: i32) -> Self {
        ListNode {
            next: None,
            val,
        }
    }
}

impl Solution {
    pub fn remove_elements(head: Option<Box<ListNode>>, val: i32) -> Option<Box<ListNode>> {
        let mut dummy_head = Box::new(ListNode::new(0));
        dummy_head.next = head;
        let mut cur = dummy_head.as_mut();
        while let Some(nxt) = cur.next.take() {
            if nxt.val == val {
                cur.next = nxt.next;
            } else {
                cur.next = Some(nxt);
                cur = cur.next.as_mut().unwrap();
            }
        }
        dummy_head.next
    }
}
```


