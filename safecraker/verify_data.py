# codex: 2026-06-02 验证CSV数据v4 - 目标改为16列各列之和=50
# "all 16 columns each add up to 50"

N = 16

d5  = [1, 10, 7, 15, 4, 8, 16, 0, 7, 4, 16, 15, 3, 5, 4, 10]
d4  = [10, 10, 10, 18, 10, 13, 11, 13, 27, 9, 2, 18, 19, 7, 15, 10]
u4  = [6, None, 9, None, 8, None, 8, None, 9, None, 10, None, 8, None, 10, None]
d3  = [5, 8, 5, 0, 22, 12, 10, 1, 12, 20, 7, 20, 10, 8, 24, 1]
u3  = [11, None, 10, None, 8, None, 8, None, 8, None, 11, None, 0, None, 10, None]
d2  = [19, 22, 0, 13, 13, 20, 12, 20, 15, 10, 19, 8, 20, 5, 0, 10]
u2  = [12, None, 8, None, 11, None, 14, None, 10, None, 8, None, 3, None, 11, None]
d1  = [4, 14, 4, 20, 4, 17, 8, 18, 6, 5, 10, 17, 10, 14, 1, 5]
u1  = [19, None, 16, None, 8, None, 8, None, 6, None, 6, None, 17, None, 8, None]

def get_column_sum(pos, oB, oC, oD, oE):
    """计算位置pos的一列5个可见数字之和"""
    s = d5[pos]

    # R4: up4 属于 blockB, down4 固定
    idx_b = (pos - oB) % N
    if u4[idx_b] is not None:
        s += u4[idx_b]
    else:
        s += d4[pos]  # d4 固定

    # R3: up3 属于 blockC, down3 属于 blockB
    idx_c = (pos - oC) % N
    idx_b3 = (pos - oB) % N
    if u3[idx_c] is not None:
        s += u3[idx_c]
    else:
        s += d3[idx_b3]

    # R2: up2 属于 blockD, down2 属于 blockC
    idx_d = (pos - oD) % N
    idx_c2 = (pos - oC) % N
    if u2[idx_d] is not None:
        s += u2[idx_d]
    else:
        s += d2[idx_c2]

    # R1: up1 属于 blockE, down1 属于 blockD
    idx_e = (pos - oE) % N
    idx_d1 = (pos - oD) % N
    if u1[idx_e] is not None:
        s += u1[idx_e]
    else:
        s += d1[idx_d1]

    return s

def check_all_columns(oB, oC, oD, oE):
    """检查16列是否每列都等于50"""
    for pos in range(N):
        if get_column_sum(pos, oB, oC, oD, oE) != 50:
            return False
    return True

print("暴力搜索: 16列每列可见数字之和=50...")
found_count = 0
for oB in range(N):
    if oB % 4 == 0:
        print(f"  进度: oB={oB}/16...")
    for oC in range(N):
        for oD in range(N):
            for oE in range(N):
                if check_all_columns(oB, oC, oD, oE):
                    found_count += 1
                    print(f"\n===== 解 #{found_count}: blockB={oB}, blockC={oC}, blockD={oD}, blockE={oE} =====")
                    for pos in range(N):
                        s = get_column_sum(pos, oB, oC, oD, oE)
                        print(f"  col{pos+1:2d}: sum={s}")

if found_count == 0:
    print("\n未找到解!")
    # 也试一下不考虑down层旋转的简化版本
    print("\n尝试简化版（down层都不旋转）...")
    for oB in range(N):
        for oC in range(N):
            for oD in range(N):
                for oE in range(N):
                    ok = True
                    for pos in range(N):
                        s = d5[pos]
                        idx = (pos - oB) % N
                        s += u4[idx] if u4[idx] is not None else d4[pos]
                        idx = (pos - oC) % N
                        s += u3[idx] if u3[idx] is not None else d3[pos]
                        idx = (pos - oD) % N
                        s += u2[idx] if u2[idx] is not None else d2[pos]
                        idx = (pos - oE) % N
                        s += u1[idx] if u1[idx] is not None else d1[pos]
                        if s != 50:
                            ok = False
                            break
                    if ok:
                        found_count += 1
                        print(f"\n===== 简化解 #{found_count}: B={oB}, C={oC}, D={oD}, E={oE} =====")
                        for pos in range(N):
                            s = d5[pos]
                            idx = (pos - oB) % N
                            s += u4[idx] if u4[idx] is not None else d4[pos]
                            idx = (pos - oC) % N
                            s += u3[idx] if u3[idx] is not None else d3[pos]
                            idx = (pos - oD) % N
                            s += u2[idx] if u2[idx] is not None else d2[pos]
                            idx = (pos - oE) % N
                            s += u1[idx] if u1[idx] is not None else d1[pos]
                            print(f"  col{pos+1:2d}: sum={s}")
    if found_count == 0:
        print("简化版也未找到解！")
else:
    print(f"\n共找到 {found_count} 个解")
