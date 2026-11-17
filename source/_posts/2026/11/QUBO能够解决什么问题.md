---
title: QUBO能够解决什么问题
author: 王赫杰
date: 2026-11-17 19:04:56
updated: 2026-11-17 19:04:56
tags:
  - Research
  - Theory
categories:
  - Research
---

# QUBO能够解决什么问题

![futuristic city](assets/QUBO能够解决什么问题/image.png)

做了很长时间调度方面的研究了，决定是时候总结一下了。

## QUBO的定义

QUBO（Quadratic Unconstrained Binary Optimization）是指二次无约束二进制优化问题。它的目标是最小化一个二次函数，该函数的变量是二进制的（即每个变量只能取0或1）。QUBO问题可以表示为：
$$
\text{minimize } E(x) = x^T Q x
$$
其中，$x$ 是一个二进制向量，$Q$ 是一个对称矩阵：对角元承担一次项的系数（因为 $x_i^2=x_i$），非对角元是二次项的系数。

所有的目标项和约束项最后都要被折算进二次型中，这是该模型最大的特点。当该二次型取最小值时，即认为找到了这个问题的最优解。以TSP问题为例：假设有4个城市，城市之间的距离如下：

|   | A | B | C | D |
|---|---|---|---|---|
| A | 0 | 10 | 15 | 20 |
| B | 10 | 0 | 35 | 25 |
| C | 15 | 35 | 0 | 30 |
| D | 20 | 25 | 30 | 0 |

问题的目标项是最小化总的旅行距离，而约束项是每个位置恰放一个城市、每个城市只能被访问一次。用 $x_{ti}\in\{0,1\}$ 表示“第 $t$ 个被访问的是城市 $i$”，于是目标项构建为：
$$
f(x) = \sum_{t=1}^{n} \sum_{i=1}^{n} \sum_{j=1}^{n} d_{ij}\, x_{ti} x_{t+1,j}
$$
其中，$d_{ij}$ 是城市 $i$ 和 $j$ 的距离；下标 $t+1$ 在 $t=n$ 时回到 $1$，即从最后一个城市返回起点。由于每个位置只有一个城市被选中，这一项恰好等于完整闭环路径的实际总距离。

惩罚项则是：
$$
g(x) = \sum_{t=1}^{n} \left( \sum_{i=1}^{n} x_{ti} - 1 \right)^2 + \sum_{i=1}^{n} \left( \sum_{t=1}^{n} x_{ti} - 1 \right)^2
$$
前一项保证每个位置恰好安排一个城市，后一项保证每个城市恰好被访问一次。

我们将目标项和惩罚项结合起来，形成一个完整的QUBO问题：
$$
\text{minimize } E(x) = f(x) + \lambda g(x)
$$
其中，$\lambda$ 是惩罚系数。设 $U$ 是某个可行解的目标值，$L$ 是 $f$ 在全部二元赋值上的下界。若可行时 $g=0$，违反约束时 $g\ge 1$，那么取 $\lambda>U-L$，就能保证全局最优解可行：因为任何违约解的能量都至少为 $L+\lambda>U$，不可能优于那个取值为 $U$ 的可行解。

求解该问题可以使用量子退火、模拟退火、禁忌搜索等方法。这里简单使用模拟退火来求解。

```python
import numpy as np


def calculate_energy(energy_fn, state):
    """计算当前状态的目标能量。"""
    return float(energy_fn(state))


def generate_neighbor(state, rng):
    """随机翻转一个二进制变量，生成邻域解。"""
    neighbor = state.copy()
    position, city = rng.integers(0, state.shape[0], size=2)
    neighbor[position, city] = 1 - neighbor[position, city]
    return neighbor


def simulated_annealing(
    energy_fn,
    initial_state,
    max_iterations=20000,
    initial_temp=1000.0,
    cooling_rate=0.995,
    min_temp=1e-6,
    seed=42
):
    rng = np.random.default_rng(seed)

    current_state = initial_state.copy()
    current_energy = calculate_energy(energy_fn, current_state)

    best_state = current_state.copy()
    best_energy = current_energy
    temperature = initial_temp

    for _ in range(max_iterations):
        new_state = generate_neighbor(current_state, rng)
        new_energy = calculate_energy(energy_fn, new_state)

        delta = new_energy - current_energy

        # 更优解直接接受；较差解按 Metropolis 准则接受
        if delta <= 0 or rng.random() < np.exp(-delta / temperature):
            current_state = new_state
            current_energy = new_energy

            if current_energy < best_energy:
                best_state = current_state.copy()
                best_energy = current_energy

        temperature = max(temperature * cooling_rate, min_temp)

    return best_state, best_energy


# 城市距离矩阵
D = np.array([
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0]
], dtype=float)

n = D.shape[0]


# x[t, i] = 1 表示第 t 个访问城市 i
def f(x):
    """计算闭环路径的实际总距离。"""
    distance = 0.0
    for t in range(n):
        next_t = (t + 1) % n  # 最后返回起点
        distance += x[t] @ D @ x[next_t]
    return float(distance)


def g(x):
    """每个位置一个城市，每个城市只访问一次。"""
    row_penalty = np.sum((np.sum(x, axis=1) - 1) ** 2)
    col_penalty = np.sum((np.sum(x, axis=0) - 1) ** 2)
    return float(row_penalty + col_penalty)


# 足够大的惩罚系数，避免非法解成为最优解
penalty = n * np.max(D) + 1

# QUBO 目标函数
F = lambda x: f(x) + penalty * g(x)

# 从合法路径 0 -> 1 -> 2 -> 3 -> 0 开始
initial_state = np.eye(n, dtype=int)

best_state, best_energy = simulated_annealing(
    F,
    initial_state,
    max_iterations=20000,
    seed=42
)

# 检查并解码结果
path = np.argmax(best_state, axis=1)
closed_path = np.append(path, path[0])
total_distance = f(best_state)

print("本次搜索最优路径:", " -> ".join(map(str, closed_path)))
print("实际总距离:", total_distance)
print("QUBO 目标能量:", best_energy)
```

运行结果可以得到：
```text
本次搜索最优路径: 3 -> 2 -> 0 -> 1 -> 3
实际总距离: 80.0
QUBO 目标能量: 80.0
```
输出以 3 为起点，和从 0 出发的环路 0 -> 1 -> 3 -> 2 -> 0 是同一条路径，距离均为 80。

## QUBO的应用

将该二次型展开，可以进一步观察其形式：

\[
\min_{x\in\{0,1\}^{n}} E(x), \qquad
E(x)=c+\sum_i a_i x_i+\sum_{i<j} b_{ij}x_ix_j
     =c+x^\top Qx.
\]

\(a_i\) 描述单个决策的代价，\(b_{ij}\) 描述两个决策同时选中时的额外代价。

于是朴素的想法是：该模型可以解决两两交互的二值决策问题，每个对象用一个二元变量，冲突或关联用 \(x_ix_j\) 表示。从二值变量这个特点出发，该模型还可以解决指派问题，\(x_{i,k}=1\) 表示对象 \(i\) 选择类别或位置 \(k\)，用罚项表达恰选一个。模型基于等式约束，因此编码方式得当时，还可以解决背包问题，将整数不等式用有界松弛变量写成等式，再对等式残差加平方罚项，不设显性目标项；还可以解决车间调度问题，将开始时间或顺序编码为二元决策，对冲突组合加罚项。

| 问题结构 | 典型问题 |
|---|---|
| 开关决策与两两交互 | 最大割、最大权独立集、二值图像分割 |
| 指派与排列 | 任务分配、图着色、TSP |
| 预算、容量与配额 | 背包、资源分配、容量车辆路径 |
| 时间与先后关系 | 车间调度、带时间窗的路径规划 |

这些五花八门的问题都可以采用不同方式建模为 QUBO问题。只要能够满足二值、二次、无约束就可以。两两交互可以直接写入 \(Q\)。一个包含 \(k\) 个变量的线性约束平方后，最多会产生 \(\binom{k}{2}\) 条二次耦合。三阶及以上的二元关系可以引入辅助变量进行二次化。

## 相近的建模范式

| 范式 | 用什么描述问题 | 典型求解方式 |
|---|---|---|
| **Ising 模型** | 与 QUBO 等价。用自旋 \(s_i=2x_i-1\) 表示决策，用局部场和两两耦合描述能量 | 经典搜索、量子退火、QAOA。([D-Wave Quantum Computing Products documentation][1]) |
| **HOBO / PUBO** | 将二元目标扩展至三阶及以上，直接保留 \(x_ix_jx_k\) 等高阶作用 | 直接优化伪布尔函数，或引入辅助变量转为 QUBO。([arxiv.org][2]) |
| **MILP / MIQP** | 显式保留线性约束。MILP 用线性目标，MIQP 允许二次目标 | 连续松弛提供界，再做分支定界与割平面搜索。([Gurobi Optimizer Reference Manual][3]) |
| **约束规划 / CP-SAT** | 直接表达整数域、逻辑关系、工序先后和区间互斥 | 约束传播、搜索与冲突学习，常用于排程。([developers.google.com][4]) |
| **SAT / 加权部分 MaxSAT** | 用布尔子句描述规则。SAT 判断能否全部满足，加权部分 MaxSAT 在满足硬子句的前提下优化软子句的权重 | SAT 求解、基于不可满足核的 MaxSAT 算法。([cs.toronto.edu][5]) |
| **图与网络优化** | 用节点、边、容量和流量守恒保留原问题的网络结构 | 最短路、最小割、最小费用流等专用算法。例如，标准线性指派可以直接建成最小费用流。([developers.google.com][6]) |
| **LP / 凸 QP** | 用连续变量、线性约束和线性或凸二次目标描述问题 | LP 可用单纯形法或内点法，凸 QP 可用内点法等凸优化算法。([Boyd and Vandenberghe][7]) |

## 如何使用

事实上，虽然QUBO建模范式很好，是一个可以统一的建模范式，但是在一些场景下，其建模的效率并不高。比如会占用较多的变量，或者需要引入较多的辅助变量。因此，在实际应用中，提出一个衡量效率的指标是很重要的。综合考虑引入这些因素：
1. 变量数、辅助变量数（规模大小）
2. 约束数、约束转化后的二次项数（约束复杂度）、目标项、目标项转化后的二次项数（目标复杂度）
3. 约束的稀疏性、目标项的稀疏性（稀疏性）
4. 软目标项、约束项（启发式构建）与真目标项、约束项的相关性
5. 约束的可分解性、目标项的可分解性（可分解性，大规模问题时尤为有用）

在这些指标的基础上，我们就可以回答这样一个问题：对于一个模型，采用QUBO建模的方式是否独特、高效，乃至最优。也就是说，QUBO建模范式并不是适合所有问题的万能钥匙，而是需要根据问题的特性来选择最合适的建模方式。而建立这样一个指标，就有望作为辅助工具指导我们选择最合适的建模方式。

最后这个问题，我将在下一篇文章《QUBO建模的效率评估》中详细介绍。

## 参考资料

[1]: https://docs.dwavequantum.com/en/latest/quantum_research/qubo_ising.html "QUBOs and Ising Models"

[2]: https://arxiv.org/pdf/1404.6538 "On Quadratization of Pseudo-Boolean Functions"

[3]: https://docs.gurobi.com/projects/optimizer/en/current/concepts/modeling/objectives.html "Objectives"

[4]: https://developers.google.com/optimization/scheduling/job_shop "The Job Shop Problem  |  OR-Tools  |  Google for Developers"

[5]: https://www.cs.toronto.edu/~fbacchus/csc2512/Readings/rc2.pdf "Journal on Satisfiability, Boolean Modeling, and Computation 11 (2019) 53-64"

[6]: https://developers.google.com/optimization/flow/assignment_min_cost_flow "Assignment as a Minimum Cost Flow Problem  |  OR-Tools  |  Google for Developers"

[7]: https://web.stanford.edu/~boyd/cvxbook/ "Convex Optimization"
