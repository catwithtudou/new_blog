# 链表算法题目

## 1. 移除链表元素

对应 LeetCode 题目：

![](https://img.zhengyua.cn/blog/202402071513660.png)

这里就涉及到前面理论部分所讲的链表的删除操作。

但是在实际编写代码过程中可发现：

- 若直接采用节点 next 指针直接指向下一个节点的方式
- 则删除头部结点和其他结点的处理是不同的

所以下面我们期望通过一种方式来让两种方式的处理保持一致。

### 1.1 思路:借助虚拟头结点

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

## 2. 设计链表

对应 LeetCode 题目：

![](https://img.zhengyua.cn/blog/202402121718896.png)

该题覆盖了链表所有的基础操作，需要前置掌握链表的理论部分。

### 2.1 思路:链表基础和哨兵节点

结合前面提到的虚拟头结点来完成该题目，具体代码如下：

- 时间复杂度：涉及 index 的相关操作为 $O(index)$，其余为 $O(1)$ 
- 空间复杂度：$O(n)$

```go

type MyLinkedList struct {
	dummyHead *SingleNode // 虚拟头节点
	Size      int         // 链表大小
}

type SingleNode struct {
	Val  int         // 节点的值
	Next *SingleNode // 下一个节点的指针
}

func NewMyLinkedList() MyLinkedList {
	newNode := &SingleNode{ // 创建新节点
		0,
		nil,
	}
	return MyLinkedList{ // 返回链表
		dummyHead: newNode,
		Size:      0,
	}
}

func (this *MyLinkedList) Get(index int) int {
	if this == nil || index < 0 || index >= this.Size {
		return -1
	}

	cur := this.dummyHead.Next
	for i := 0; i < index; i++ {
		cur = cur.Next
	}
	return cur.Val
}

func (this *MyLinkedList) AddAtHead(val int) {
	newNode := &SingleNode{
		Val:  val,
		Next: this.dummyHead.Next,
	}
	this.dummyHead.Next = newNode
	this.Size++
}

func (this *MyLinkedList) AddAtTail(val int) {
	newNode := &SingleNode{Val: val}
	cur := this.dummyHead
	for cur.Next != nil {
		cur = cur.Next
	}
	cur.Next = newNode
	this.Size++
}

func (this *MyLinkedList) AddAtIndex(index int, val int) {
	if index < 0 {
		index = 0
	} else if index > this.Size {
		return
	}

	newNode := &SingleNode{Val: val}
	cur := this.dummyHead
	for i := 0; i < index; i++ {
		cur = cur.Next
	}
	newNode.Next = cur.Next
	cur.Next = newNode
	this.Size++
}

func (this *MyLinkedList) DeleteAtIndex(index int) {
	if index < 0 || index >= this.Size {
		return
	}
	cur := this.dummyHead
	for i := 0; i < index; i++ {
		cur = cur.Next
	}
	if cur.Next != nil {
		cur.Next = cur.Next.Next
		this.Size--
	}
}

/**
 * Your MyLinkedList object will be instantiated and called as such:
 * obj := Constructor();
 * param_1 := obj.Get(index);
 * obj.AddAtHead(val);
 * obj.AddAtTail(val);
 * obj.AddAtIndex(index,val);
 * obj.DeleteAtIndex(index);
 */
```

```rust
pub struct Solution;

#[derive(Debug)]
pub struct MyLinkedList {
    pub val: i32,
    pub next: Option<Box<MyLinkedList>>,
}


/**
 * `&self` means the method takes an immutable reference.
 * If you need a mutable reference, change it to `&mut self` instead.
 */
impl MyLinkedList {
    fn new() -> Self {
        MyLinkedList { val: 0, next: None }
    }

    fn get(&self, index: i32) -> i32 {
        if index < 0 {
            return -1;
        }
        let mut i = 0;
        let mut cur = &self.next;
        while let Some(node) = cur {
            if i == index {
                return node.val;
            }
            i += 1;
            cur = &node.next;
        }
        -1
    }

    fn add_at_head(&mut self, val: i32) {
        let new_node = Box::new(MyLinkedList {
            val,
            next: self.next.take(),
        });
        self.next = Some(new_node);
    }

    fn add_at_tail(&mut self, val: i32) {
        let new_node = Box::new(MyLinkedList { val, next: None });
        let mut last_node = &mut self.next;
        while let Some(node) = last_node {
            last_node = &mut node.next;
        }
        *last_node = Some(new_node);
    }

    fn add_at_index(&mut self, index: i32, val: i32) {
        if index <= 0 {
            self.add_at_head(val);
        } else {
            let mut i = 0;
            let mut cur = &mut self.next;
            while let Some(node) = cur {
                if i + 1 == index {
                    let new_node = Box::new(MyLinkedList {
                        val,
                        next: node.next.take(),
                    });
                    node.next = Some(new_node);
                    break;
                }
                i += 1;
                cur = &mut node.next;
            }
        }
    }

    fn delete_at_index(&mut self, index: i32) {
        if index < 0 {
            return;
        }

        let mut i = 0;
        let mut cur = self;
        while let Some(node) = cur.next.take() {
            if i == index {
                cur.next = node.next;
                break;
            }
            i += 1;
            cur.next = Some(node);
            cur = cur.next.as_mut().unwrap();
        }
    }
}

/**
 * Your MyLinkedList object will be instantiated and called as such:
 * let obj = MyLinkedList::new();
 * let ret_1: i32 = obj.get(index);
 * obj.add_at_head(val);
 * obj.add_at_tail(val);
 * obj.add_at_index(index, val);
 * obj.delete_at_index(index);
 */
```
