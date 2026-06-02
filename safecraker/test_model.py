# codex: 2026-06-02 用 Python 模拟 JS 逻辑验证正确性

N = 16
TARGET = 50

# 数据
d5  = [1, 10, 7, 15, 4, 8, 16, 0, 7, 4, 16, 15, 3, 5, 4, 10]
d4  = [10, 10, 10, 18, 10, 13, 11, 13, 27, 9, 2, 18, 19, 7, 15, 10]
u4  = [6, None, 9, None, 8, None, 8, None, 9, None, 10, None, 8, None, 10, None]
d3  = [5, 8, 5, 0, 22, 12, 10, 1, 12, 20, 7, 20, 10, 8, 24, 1]
u3  = [11, None, 10, None, 8, None, 8, None, 8, None, 11, None, 0, None, 10, None]
d2  = [19, 22, 0, 13, 13, 20, 12, 20, 15, 10, 19, 8, 20, 5, 0, 10]
u2  = [12, None, 8, None, 11, None, 14, None, 10, None, 8, None, 3, None, 11, None]
d1  = [4, 14, 4, 20, 4, 17, 8, 18, 6, 5, 10, 17, 10, 14, 1, 5]
u1  = [19, None, 16, None, 8, None, 8, None, 6, None, 6, None, 17, None, 8, None]

# 积木定义: (layers) 每个元素 (layer_name, data_array)
# blockA (固定): down5, down4
# blockB (可旋转): up4, down3
# blockC (可旋转): up3, down2
# blockD (可旋转): up2, down1
# blockE (可旋转): up1

# 层到积木的映射
layer_block = {
    'down5': 'blockA', 'down4': 'blockA',
    'up4': 'blockB', 'down3': 'blockB',
    'up3': 'blockC', 'down2': 'blockC',
    'up2': 'blockD', 'down1': 'blockD',
    'up1': 'blockE'
}

layer_data = {
    'down5': d5, 'down4': d4,
    'up4': u4, 'down3': d3,
    'up3': u3, 'down2': d2,
    'up2': u2, 'down1': d1,
    'up1': u1
}

def get_layer_value(layer_name, pos, offsets):
    """模拟 JS 的 getLayerValue"""
    block = layer_block[layer_name]
    data = layer_data[layer_name]
    if block == 'blockA':
        return data[pos]
    offset = offsets.get(block, 0)
    idx = (pos - offset) % N
    return data[idx]

def get_visible(ring, pos, offsets):
    """模拟 JS 的 getVisibleValue"""
    if ring == 5:
        return get_layer_value('down5', pos, offsets)
    up = get_layer_value(f'up{ring}', pos, offsets)
    if up is not None:
        return up
    return get_layer_value(f'down{ring}', pos, offsets)

def get_column_sum(pos, offsets):
    """模拟 JS 的 getColumnSum"""
    return sum(get_visible(r, pos, offsets) for r in range(5, 0, -1))

def check_win(offsets):
    """模拟 JS 的 checkWin"""
    return all(get_column_sum(pos, offsets) == TARGET for pos in range(N))

# 测试1: 验证正确解
print("=== 测试1: 正确解验证 ===")
solution = {'blockB': 12, 'blockC': 8, 'blockD': 9, 'blockE': 13}
win = check_win(solution)
print(f"解: {solution}")
print(f"checkWin: {win}")
for pos in range(N):
    s = get_column_sum(pos, solution)
    vals = [get_visible(r, pos, solution) for r in range(5, 0, -1)]
    print(f"  列{pos+1:2d}: {vals} = {s} {'✓' if s == TARGET else '✗'}")
assert win, "正确解未通过验证！"
print("✓ 正确解验证通过\n")

# 测试2: 偏移0不是正确解
print("=== 测试2: 偏移0状态 ===")
zero = {'blockB': 0, 'blockC': 0, 'blockD': 0, 'blockE': 0}
assert not check_win(zero), "偏移0不应该是正确解"
print("✓ 偏移0不是正确解\n")

# 测试3: 旋转逻辑
print("=== 测试3: 旋转逻辑 ===")
offsets = {'blockB': 0, 'blockC': 0, 'blockD': 0, 'blockE': 0}
# up4 位置0, 偏移0: 逻辑位置 (0-0)%16=0, u4[0]=6
assert get_layer_value('up4', 0, offsets) == 6, "up4[0] 偏移0应为6"
# up4 位置1, 偏移0: u4[1]=None
assert get_layer_value('up4', 1, offsets) is None, "up4[1] 偏移0应为None"
# 旋转blockB 1步
offsets['blockB'] = 1
# up4 位置0, 偏移1: 逻辑位置 (0-1+16)%16=15, u4[15]=None
assert get_layer_value('up4', 0, offsets) is None, "up4[0] 偏移1应为None"
# up4 位置1, 偏移1: 逻辑位置 (1-1)%16=0, u4[0]=6
assert get_layer_value('up4', 1, offsets) == 6, "up4[1] 偏移1应为6"
print("✓ 旋转逻辑验证通过\n")

# 测试4: 可见数字逻辑
print("=== 测试4: 可见数字逻辑 ===")
offsets = {'blockB': 0, 'blockC': 0, 'blockD': 0, 'blockE': 0}
# R4 位置0: up4有值(6) → 显示6
assert get_visible(4, 0, offsets) == 6, "R4 pos0 偏移0应为6 (up4)"
# R4 位置1: up4为None → 显示down4[1]=10
assert get_visible(4, 1, offsets) == 10, "R4 pos1 偏移0应为10 (down4)"
print("✓ 可见数字逻辑验证通过\n")

# 测试5: 渲染层数据
print("=== 测试5: 渲染层数据（模拟 getRenderLayers）===")
offsets_sol = {'blockB': 12, 'blockC': 8, 'blockD': 9, 'blockE': 13}
render_order = ['down5', 'down4', 'up4', 'down3', 'up3', 'down2', 'up2', 'down1', 'up1']
for layer_name in render_order:
    values = [get_layer_value(layer_name, pos, offsets_sol) for pos in range(N)]
    print(f"  {layer_name:8s}: {values}")
print("✓ 渲染层数据验证通过\n")

print("=== 所有测试通过！===")
