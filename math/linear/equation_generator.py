import random
import time
import os

class EquationGenerator:
    """
    方程与方程组生成器 (高熵强随机化版本)
    支持生成：一元一次方程、二元一次方程组、三元一次方程组
    保证解全部为正整数 (x, y, z >= 1)，防止重复模式与题目重复
    """

    @staticmethod
    def reseed():
        """利用系统纳秒级时间与进程 ID 重新注入随机熵，确保每次生成都是全新模式"""
        seed = (time.time_ns() ^ (os.getpid() << 16) ^ random.getrandbits(32)) & 0xFFFFFFFF
        random.seed(seed)

    @staticmethod
    def _format_term(coeff, var, is_first=False):
        """格式化单项式，如 1x -> x, -1y -> -y, 0x -> ''"""
        if coeff == 0:
            return ""
        
        abs_c = abs(coeff)
        coeff_str = "" if (abs_c == 1 and var != "") else str(abs_c)
        var_str = f"{coeff_str}{var}"
        
        if is_first:
            return f"-{var_str}" if coeff < 0 else var_str
        else:
            return f" - {var_str}" if coeff < 0 else f" + {var_str}"

    @staticmethod
    def _format_paren(k, inner_str):
        """格式化带系数的括号，如 1(2x+1) -> (2x+1), -1(2x+1) -> -(2x+1)"""
        if k == 1:
            return f"({inner_str})"
        elif k == -1:
            return f"-({inner_str})"
        else:
            return f"{k}({inner_str})"

    @staticmethod
    def generate_linear_1var(difficulty="advanced", solution_max=15):
        """生成一元一次方程 (解为正整数)"""
        EquationGenerator.reseed()
        x = random.randint(1, solution_max)
        
        if difficulty == "basic":
            a = random.randint(2, 12)
            b = random.randint(1, 30)
            op = random.choice(['+', '-'])
            if op == '+':
                c = a * x + b
                eq_str = f"{EquationGenerator._format_term(a, 'x', True)} + {b} = {c}"
            else:
                c = a * x - b
                if c <= 0:
                    c = a * x + b
                    eq_str = f"{EquationGenerator._format_term(a, 'x', True)} + {b} = {c}"
                else:
                    eq_str = f"{EquationGenerator._format_term(a, 'x', True)} - {b} = {c}"
            return {
                "type": "一元一次方程",
                "question": eq_str,
                "solution": f"x = {x}"
            }
        else:
            # 概率分布：50% 普通及多项展开，30% 双重括号 [ ( ) ]，20% 三重括号 { [ ( ) ] }
            pattern = random.choices([1, 2, 3, 4, 5, 6, 7], weights=[10, 10, 10, 10, 10, 30, 20])[0]
            
            if pattern == 1:
                # 模式1: k1(a1*x ± b1) ± k2(a2*x ± b2) = k3(a3*x ± b3) ± const
                k1, a1, b1 = random.randint(2, 6), random.randint(1, 5), random.randint(1, 8)
                k2, a2, b2 = random.randint(1, 5), random.randint(1, 4), random.randint(1, 8)
                k3, a3, b3 = random.randint(1, 5), random.randint(1, 4), random.randint(1, 8)
                
                op1 = random.choice(['+', '-'])
                op2 = random.choice(['+', '-'])
                op3 = random.choice(['+', '-'])
                op_between = random.choice(['+', '-'])
                
                sign1 = 1 if op1 == '+' else -1
                sign2 = 1 if op2 == '+' else -1
                sign3 = 1 if op3 == '+' else -1
                sign_between = 1 if op_between == '+' else -1
                
                while (k1 * a1 + sign_between * k2 * a2) == k3 * a3:
                    k3 += 1
                
                val_left = k1 * (a1 * x + sign1 * b1) + sign_between * k2 * (a2 * x + sign2 * b2)
                val_right_base = k3 * (a3 * x + sign3 * b3)
                const = val_left - val_right_base
                
                in1 = f"{EquationGenerator._format_term(a1, 'x', True)} {op1} {b1}"
                in2 = f"{EquationGenerator._format_term(a2, 'x', True)} {op2} {b2}"
                in3 = f"{EquationGenerator._format_term(a3, 'x', True)} {op3} {b3}"
                
                p1 = EquationGenerator._format_paren(k1, in1)
                p2 = EquationGenerator._format_paren(k2, in2)
                p3 = EquationGenerator._format_paren(k3, in3)
                
                op_const = f"+ {const}" if const > 0 else (f"- {abs(const)}" if const < 0 else "")
                left_str = f"{p1} {op_between} {p2}"
                right_str = f"{p3} {op_const}".strip()
                eq_str = f"{left_str} = {right_str}"
                
            elif pattern == 2:
                # 模式2: c1 - k1(a1*x ± b1) = c2 或 k1(a1*x ± b1) - c1 = c2
                k1, a1, b1 = random.randint(2, 6), random.randint(1, 5), random.randint(1, 8)
                op1 = random.choice(['+', '-'])
                sign1 = 1 if op1 == '+' else -1
                inner_val = k1 * (a1 * x + sign1 * b1)
                
                in1 = f"{EquationGenerator._format_term(a1, 'x', True)} {op1} {b1}"
                p1 = EquationGenerator._format_paren(k1, in1)
                
                if random.choice([True, False]):
                    c2 = random.randint(1, 20)
                    c1 = inner_val + c2
                    eq_str = f"{c1} - {p1} = {c2}"
                else:
                    c1 = random.randint(1, 30)
                    c2 = inner_val - c1
                    if c2 > 0:
                        eq_str = f"{p1} - {c1} = {c2}"
                    else:
                        eq_str = f"{p1} + {abs(c2)} = {c1}"
                        
            elif pattern == 3:
                # 模式3: a1*x ± (a2*x ± b1) = const
                a1 = random.randint(3, 10)
                a2 = random.randint(1, 5)
                while a1 == a2:
                    a1 += 1
                b1 = random.randint(1, 15)
                op_in = random.choice(['+', '-'])
                op_mid = random.choice(['+', '-'])
                
                sign_in = 1 if op_in == '+' else -1
                sign_mid = 1 if op_mid == '+' else -1
                
                val = a1 * x + sign_mid * (a2 * x + sign_in * b1)
                t1 = EquationGenerator._format_term(a1, 'x', True)
                in2 = f"{EquationGenerator._format_term(a2, 'x', True)} {op_in} {b1}"
                
                if val > 0:
                    eq_str = f"{t1} {op_mid} ({in2}) = {val}"
                else:
                    const_add = abs(val) + random.randint(5, 20)
                    val_new = val + const_add
                    eq_str = f"{t1} {op_mid} ({in2}) + {const_add} = {val_new}"
                    
            elif pattern == 4:
                # 模式4: a1*(b1*x ± c1) ± d1 = e1*x ± f1
                k1, a1, b1 = random.randint(2, 5), random.randint(1, 4), random.randint(1, 6)
                op1 = random.choice(['+', '-'])
                sign1 = 1 if op1 == '+' else -1
                d1 = random.randint(1, 20)
                op_d = random.choice(['+', '-'])
                sign_d = 1 if op_d == '+' else -1
                
                left_val = k1 * (a1 * x + sign1 * b1) + sign_d * d1
                
                e1 = random.randint(1, 8)
                while k1 * a1 == e1:
                    e1 += 1
                    
                right_base = e1 * x
                f1 = left_val - right_base
                
                t_e = EquationGenerator._format_term(e1, 'x', True)
                op_f = f"+ {f1}" if f1 > 0 else (f"- {abs(f1)}" if f1 < 0 else "")
                
                in1 = f"{EquationGenerator._format_term(a1, 'x', True)} {op1} {b1}"
                p1 = EquationGenerator._format_paren(k1, in1)
                eq_str = f"{p1} {op_d} {d1} = {t_e} {op_f}".strip()
                
            elif pattern == 5:
                # 模式5: 多项合并式 (a1*x ± a2*x ± b1 = a3*x ± c1)
                a1 = random.randint(2, 6)
                a2 = random.randint(1, 5)
                b1 = random.randint(1, 15)
                a3 = random.randint(1, 5)
                while (a1 + a2) == a3:
                    a3 += 1
                    
                val_L = a1 * x + a2 * x - b1
                val_R_base = a3 * x
                c1 = val_L - val_R_base
                
                t1 = EquationGenerator._format_term(a1, 'x', True)
                t2 = EquationGenerator._format_term(a2, 'x', False)
                t3 = EquationGenerator._format_term(a3, 'x', True)
                op_c = f"+ {c1}" if c1 > 0 else (f"- {abs(c1)}" if c1 < 0 else "")
                
                eq_str = f"{t1}{t2} - {b1} = {t3} {op_c}".strip()

            elif pattern == 6:
                # 模式6: 双重括号方程 [ ( ) ]
                # 结构如: k2 [ k1(a1*x ± b1) ± b2 ] ± b3 = C
                a1 = random.randint(1, 4)
                b1 = random.randint(1, 6)
                op1 = random.choice(['+', '-'])
                sign1 = 1 if op1 == '+' else -1
                v1 = a1 * x + sign1 * b1
                if v1 <= 0:
                    op1, sign1 = '+', 1
                    v1 = a1 * x + b1

                k1 = random.randint(2, 4)
                v2 = k1 * v1

                b2 = random.randint(1, 8)
                op2 = random.choice(['+', '-'])
                sign2 = 1 if op2 == '+' else -1
                v3 = v2 + sign2 * b2
                if v3 <= 0:
                    op2, sign2 = '+', 1
                    v3 = v2 + b2

                k2 = random.randint(2, 4)
                v4 = k2 * v3

                b3 = random.randint(1, 20)
                op3 = random.choice(['+', '-'])
                sign3 = 1 if op3 == '+' else -1

                in1 = f"{EquationGenerator._format_term(a1, 'x', True)} {op1} {b1}"
                p1 = EquationGenerator._format_paren(k1, in1)
                inner_bracket = f"{p1} {op2} {b2}"
                p2 = f"{k2}[{inner_bracket}]" if k2 != 1 else f"[{inner_bracket}]"

                if random.choice([True, False]):
                    C = v4 + sign3 * b3
                    eq_str = f"{p2} {op3} {b3} = {C}"
                else:
                    C1 = v4 + random.randint(5, 30)
                    C2 = C1 - v4
                    eq_str = f"{C1} - {p2} = {C2}"

            else:
                # 模式7: 三重括号方程 { [ ( ) ] }
                # 结构如: k3 { k2 [ k1(a1*x ± b1) ± b2 ] ± b3 } ± b4 = C
                a1 = random.randint(1, 3)
                b1 = random.randint(1, 5)
                op1 = random.choice(['+', '-'])
                sign1 = 1 if op1 == '+' else -1
                v1 = a1 * x + sign1 * b1
                if v1 <= 0:
                    op1, sign1 = '+', 1
                    v1 = a1 * x + b1

                k1 = random.randint(2, 3)
                v2 = k1 * v1

                b2 = random.randint(1, 6)
                op2 = random.choice(['+', '-'])
                sign2 = 1 if op2 == '+' else -1
                v3 = v2 + sign2 * b2
                if v3 <= 0:
                    op2, sign2 = '+', 1
                    v3 = v2 + b2

                k2 = random.randint(2, 3)
                v4 = k2 * v3

                b3 = random.randint(1, 8)
                op3 = random.choice(['+', '-'])
                sign3 = 1 if op3 == '+' else -1
                v5 = v4 + sign3 * b3
                if v5 <= 0:
                    op3, sign3 = '+', 1
                    v5 = v4 + b3

                k3 = random.randint(2, 3)
                v6 = k3 * v5

                b4 = random.randint(1, 15)
                op4 = random.choice(['+', '-'])
                sign4 = 1 if op4 == '+' else -1

                in1 = f"{EquationGenerator._format_term(a1, 'x', True)} {op1} {b1}"
                p1 = EquationGenerator._format_paren(k1, in1)
                mid_bracket = f"{p1} {op2} {b2}"
                p2 = f"{k2}[{mid_bracket}]" if k2 != 1 else f"[{mid_bracket}]"
                outer_brace = f"{p2} {op3} {b3}"
                p3 = f"{k3}{{{outer_brace}}}" if k3 != 1 else f"{{{outer_brace}}}"

                if random.choice([True, False]):
                    C = v6 + sign4 * b4
                    eq_str = f"{p3} {op4} {b4} = {C}"
                else:
                    C1 = v6 + random.randint(5, 30)
                    C2 = C1 - v6
                    eq_str = f"{C1} - {p3} = {C2}"

            return {
                "type": "一元一次方程",
                "question": eq_str,
                "solution": f"x = {x}"
            }


    @staticmethod
    def generate_linear_2var(difficulty="advanced", solution_max=15):
        """生成二元一次方程组 (解为正整数)"""
        EquationGenerator.reseed()
        x = random.randint(1, solution_max)
        y = random.randint(1, solution_max)
        
        while True:
            a1, b1 = random.randint(1, 9), random.choice([j for j in range(-9, 10) if j != 0])
            a2, b2 = random.randint(1, 9), random.choice([j for j in range(-9, 10) if j != 0])
            if a1 * b2 - a2 * b1 != 0:
                break
                
        c1 = a1 * x + b1 * y
        c2 = a2 * x + b2 * y
        
        if difficulty == "basic":
            eq1 = EquationGenerator._format_2var_eq(a1, b1, c1)
            eq2 = EquationGenerator._format_2var_eq(a2, b2, c2)
            return {
                "type": "二元一次方程组",
                "question": [eq1, eq2],
                "solution": f"x = {x}, y = {y}"
            }
        else:
            # 随机决定方程1和方程2是否进行左右移项拆分
            def build_advanced_2var(a, b, c):
                mode = random.choice([1, 2, 3])
                if mode == 1:
                    # 左右同时拆分 x, y
                    aR = random.randint(1, 5)
                    bR = random.randint(1, 5)
                    aL, bL = a + aR, b + bR
                    eq_L = (EquationGenerator._format_term(aL, 'x', True) + EquationGenerator._format_term(bL, 'y', False)).strip()
                    eq_R = (EquationGenerator._format_term(aR, 'x', True) + EquationGenerator._format_term(bR, 'y', False)).strip()
                    return f"{eq_L} = {eq_R} + {c}" if c >= 0 else f"{eq_L} + {abs(c)} = {eq_R}"
                elif mode == 2:
                    # 仅拆分单未知数及常数
                    aR = random.randint(1, 6)
                    aL = a + aR
                    eq_L = (EquationGenerator._format_term(aL, 'x', True) + EquationGenerator._format_term(b, 'y', False)).strip()
                    eq_R = EquationGenerator._format_term(aR, 'x', True).strip()
                    return f"{eq_L} = {eq_R} + {c}" if c >= 0 else f"{eq_L} + {abs(c)} = {eq_R}"
                else:
                    # 标准交互移动
                    return EquationGenerator._format_2var_eq(a, b, c)

            eq1 = build_advanced_2var(a1, b1, c1)
            eq2 = build_advanced_2var(a2, b2, c2)
            
            return {
                "type": "二元一次方程组",
                "question": [eq1, eq2],
                "solution": f"x = {x}, y = {y}"
            }

    @staticmethod
    def _format_2var_eq(a, b, c):
        t_a = EquationGenerator._format_term(a, "x", is_first=True)
        t_b = EquationGenerator._format_term(b, "y", is_first=False)
        return f"{t_a}{t_b} = {c}".strip()

    @staticmethod
    def generate_linear_3var(difficulty="advanced", solution_max=10):
        """生成三元一次方程组 (解为正整数)"""
        EquationGenerator.reseed()
        x = random.randint(1, solution_max)
        y = random.randint(1, solution_max)
        z = random.randint(1, solution_max)
        
        while True:
            a1, b1, c1 = random.randint(1, 6), random.choice([-5,-4,-3,-2,-1,1,2,3,4,5]), random.choice([-5,-4,-3,-2,-1,1,2,3,4,5])
            a2, b2, c2 = random.randint(1, 6), random.choice([-5,-4,-3,-2,-1,1,2,3,4,5]), random.choice([-5,-4,-3,-2,-1,1,2,3,4,5])
            a3, b3, c3 = random.randint(1, 6), random.choice([-5,-4,-3,-2,-1,1,2,3,4,5]), random.choice([-5,-4,-3,-2,-1,1,2,3,4,5])
            
            det = (a1*(b2*c3 - b3*c2) - b1*(a2*c3 - a3*c2) + c1*(a2*b3 - a3*b2))
            if det != 0:
                break
                
        d1 = a1 * x + b1 * y + c1 * z
        d2 = a2 * x + b2 * y + c2 * z
        d3 = a3 * x + b3 * y + c3 * z
        
        def format_3var(a, b, c, d):
            t_a = EquationGenerator._format_term(a, "x", is_first=True)
            t_b = EquationGenerator._format_term(b, "y", is_first=False)
            t_c = EquationGenerator._format_term(c, "z", is_first=False)
            return f"{t_a}{t_b}{t_c} = {d}".strip()
            
        if difficulty == "basic":
            return {
                "type": "三元一次方程组",
                "question": [format_3var(a1, b1, c1, d1), format_3var(a2, b2, c2, d2), format_3var(a3, b3, c3, d3)],
                "solution": f"x = {x}, y = {y}, z = {z}"
            }
        else:
            def build_advanced_3var(a, b, c, d):
                if random.choice([True, False]):
                    aR, bR, cR = random.randint(1, 3), random.randint(1, 3), random.randint(1, 3)
                    aL, bL, cL = a + aR, b + bR, c + cR
                    eq_L = (EquationGenerator._format_term(aL, 'x', True) + EquationGenerator._format_term(bL, 'y', False) + EquationGenerator._format_term(cL, 'z', False)).strip()
                    eq_R = (EquationGenerator._format_term(aR, 'x', True) + EquationGenerator._format_term(bR, 'y', False) + EquationGenerator._format_term(cR, 'z', False)).strip()
                    return f"{eq_L} = {eq_R} + {d}" if d >= 0 else f"{eq_L} + {abs(d)} = {eq_R}"
                else:
                    return format_3var(a, b, c, d)

            eq1 = build_advanced_3var(a1, b1, c1, d1)
            eq2 = build_advanced_3var(a2, b2, c2, d2)
            eq3 = build_advanced_3var(a3, b3, c3, d3)
            
            return {
                "type": "三元一次方程组",
                "question": [eq1, eq2, eq3],
                "solution": f"x = {x}, y = {y}, z = {z}"
            }
