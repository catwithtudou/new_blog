## 1. Preparation

> **The C Programming Language, by Kernighan and Ritchie (K&R)**

### 1.1 2.9 (Bitwise operators)

```C
// 1. &

	  101010101010101     052525
	& 000000001111111   & 000177
	  ---------------     ------
	          1010101        125
// 2. |

	        000000000     000000
	      | 000001010   | 000012
	        ---------     ------
	             1010         12
	             
```

- The precedence of the bitwise operators is not what you might expect, and explicit parentheses are often needed

### 1.2 5.1 (Pointers and addresses) through 5.6 (Pointer arrays)

1. Pointers and Addresses

```C
// case 1
	int i = 1;		/* an integer */
	int *ip;		/* a pointer-to-int */
	ip = &i;		/* ip points to i */
	printf("%d\n", *ip);	/* prints i, which is 1 */
	*ip = 5;		/* sets i to 5 */
// case 2
	int* ip1, ip2;		/* WRONG */
	int *ip1, *ip2;	
```

2. Pointers and Function Arguments

```C
// case 1
	int getint(int *pn)
	{
		char line[20];
		if (getline(line, 20) <= 0)
			return EOF;
		*pn = atoi(line);
		return 1;
	}
// case 2
	int a = 1, b = 2;
	swap(&a, &b);
// case 3 
	int *a;
	getint(a);		
```

3. Pointers and Arrays

```C

```


### 1.3 6.4 (pointers to structures)




## 2. Lecture 2