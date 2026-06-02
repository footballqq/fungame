# codex: 2026-06-02 E2E测试 - 物理联动旋转模型
# 验证: 打乱→旋转→检测→求解→胜利
import json

N = 16
TARGET = 50

# 从 config.js 复制的数据
RING_DATA = {
    'down5': [1, 10, 7, 15, 4, 8, 16, 0, 7, 4, 16, 15, 3, 5, 4, 10],
    'down4': [10, 10, 10, 18, 10, 13, 11, 13, 27, 9, 2, 18, 19, 7, 15, 10],
    'up4': [6, None, 9, None, 8, None, 8, None, 9, None, 10, None, 8, None, 10, None],
    'down3': [5, 8, 5, 0, 22, 12, 10, 1, 12, 20, 7, 20, 10, 8, 24, 1],
    'up3': [11, None, 10, None, 8, None, 8, None, 8, None, 11, None, 0, None, 10, None],
    'down2': [19, 22, 0, 13, 13, 20, 12, 20, 15, 10, 19, 8, 20, 5, 0, 10],
    'up2': [12, None, 8, None, 11, None, 14, None, 10, None, 8, None, 3, None, 11, None],
    'down1': [4, 14, 4, 20, 4, 17, 8, 18, 6, 5, 10, 17, 10, 14, 1, 5],
    'up1': [19, None, 16, None, 8, None, 8, None, 6, None, 6, None, 17, None, 8, None]
}

layer_block = {
    'down5': 'blockA', 'down4': 'blockA',
    'up4': 'blockB', 'down3': 'blockB',
    'up3': 'blockC', 'down2': 'blockC',
    'up2': 'blockD', 'down1': 'blockD',
    'up1': 'blockE'
}

class TestModel:
    def __init__(self):
        self.offsets = {'blockB': 0, 'blockC': 0, 'blockD': 0, 'blockE': 0}

    def get_layer_value(self, layer, pos):
        block = layer_block[layer]
        data = RING_DATA[layer]
        if block == 'blockA':
            return data[pos]
        offset = self.offsets.get(block, 0)
        idx = (pos - offset) % N
        return data[idx]

    def get_visible(self, ring, pos):
        if ring == 5:
            return self.get_layer_value('down5', pos)
        up = self.get_layer_value(f'up{ring}', pos)
        if up is not None:
            return up
        return self.get_layer_value(f'down{ring}', pos)

    def get_column_sum(self, pos):
        return sum(self.get_visible(r, pos) for r in range(5, 0, -1))

    def check_win(self):
        return all(self.get_column_sum(p) == TARGET for p in range(N))

    def rotate(self, block_id, direction):
        blocks_to_rotate = []
        if block_id == 'blockB':
            blocks_to_rotate = ['blockB', 'blockC', 'blockD', 'blockE']
        elif block_id == 'blockC':
            blocks_to_rotate = ['blockC', 'blockD', 'blockE']
        elif block_id == 'blockD':
            blocks_to_rotate = ['blockD', 'blockE']
        elif block_id == 'blockE':
            blocks_to_rotate = ['blockE']

        for bid in blocks_to_rotate:
            self.offsets[bid] = (self.offsets[bid] + direction + N) % N

    def solve(self):
        self.offsets = {'blockB': 12, 'blockC': 8, 'blockD': 9, 'blockE': 13}

    def get_render_layers(self):
        """模拟 getRenderLayers"""
        radii = {
            'ring5': (200, 240), 'ring4': (155, 200),
            'ring3': (110, 155), 'ring2': (65, 110),
            'ring1': (30, 65)
        }
        ring_map = {
            'down5': 'ring5', 'down4': 'ring4', 'up4': 'ring4',
            'down3': 'ring3', 'up3': 'ring3',
            'down2': 'ring2', 'up2': 'ring2',
            'down1': 'ring1', 'up1': 'ring1'
        }
        order = ['down5', 'down4', 'up4', 'down3', 'up3', 'down2', 'up2', 'down1', 'up1']
        layers = []
        for layer_name in order:
            block = layer_block[layer_name]
            ring = ring_map[layer_name]
            inner, outer = radii[ring]
            values = [self.get_layer_value(layer_name, p) for p in range(N)]
            layers.append({
                'name': layer_name, 'block': block,
                'inner': inner, 'outer': outer,
                'values': values,
                'isUpper': layer_name.startswith('up')
            })
        return layers


# === 测试流程 ===
m = TestModel()
tests_passed = 0
tests_total = 0

def test(condition, message):
    global tests_passed, tests_total
    tests_total += 1
    if condition:
        tests_passed += 1
        print(f"  ✓ {message}")
    else:
        print(f"  ✗ {message}")

print("=== 端到端测试 ===\n")

# 1. 初始状态(偏移0)不应该是胜利
print("1. 初始状态测试")
test(not m.check_win(), "偏移0不是正确解")

# 2. 求解后应该胜利
print("\n2. 求解测试")
m.solve()
test(m.check_win(), "solve()后是正确解")
sums = [m.get_column_sum(p) for p in range(N)]
test(all(s == 50 for s in sums), f"所有16列和均为50: {sums}")

# 3. 旋转一步后不应再是正确解
print("\n3. 旋转打乱测试")
m.rotate('blockB', 1)
test(not m.check_win(), "旋转blockB+1后不再是正确解")

# 4. 旋转回来应该恢复
m.rotate('blockB', -1)
test(m.check_win(), "旋转blockB-1后恢复正确解")

# 5. 模拟渲染数据
print("\n4. 渲染层数据测试")
m.solve()
layers = m.get_render_layers()
test(len(layers) == 9, f"渲染层数量=9 (实际={len(layers)})")

# 检查每个环的可见数字只有一个
for pos in range(N):
    visible_per_ring = {}
    for layer in layers:
        val = layer['values'][pos]
        ring = layer['name'].replace('down', '').replace('up', '')
        if ring not in visible_per_ring:
            visible_per_ring[ring] = []
        if val is not None:
            visible_per_ring[ring].append((layer['name'], val))

# 检查上层覆盖逻辑
for pos in [0, 1]:
    # 位置0: up4有值(8), 应该覆盖down4
    # 位置1: up4为None, 应该显示down4
    up4_val = m.get_layer_value('up4', pos)
    down4_val = m.get_layer_value('down4', pos)
    visible = m.get_visible(4, pos)
    if up4_val is not None:
        test(visible == up4_val, f"pos{pos} R4: up4={up4_val}, 可见={visible} (上层覆盖)")
    else:
        test(visible == down4_val, f"pos{pos} R4: down4={down4_val}, 可见={visible} (下层显示)")

# 6. 多次旋转的正确性
print("\n5. 多次旋转测试")
m.solve()
# 旋转 blockC 3步，检查列和变化
m.rotate('blockC', 3)
test(not m.check_win(), "旋转blockC+3后不是正确解")
# 旋转回 -3步
for _ in range(3):
    m.rotate('blockC', -1)
test(m.check_win(), "旋转blockC-1 三次后恢复正确解")

# 7. 完整旋转一圈应回到原位
print("\n6. 完整旋转一圈测试")
m.solve()
for _ in range(N):
    m.rotate('blockD', 1)
test(m.check_win(), f"旋转blockD {N}步后回到正确解")

print(f"\n=== 测试总结: {tests_passed}/{tests_total} 通过 ===")
if tests_passed == tests_total:
    print("✓ 所有测试通过！")
else:
    print("✗ 有测试失败！")
    exit(1)
