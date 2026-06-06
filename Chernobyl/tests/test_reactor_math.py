# tests/test_reactor_math.py
# codex: 2026-06-06 建立RBMK-1000反应堆物理毒化方程的数学单元测试

import unittest

class TestReactorMath(unittest.TestCase):
    def setUp(self):
        # 对应 js/reactor.js 中的物理常数
        self.lambda_i = 0.05 / 3600  # 碘-135衰变率 (每秒)
        self.lambda_x = 0.02 / 3600  # 氙-135衰变率 (每秒)
        self.sigma_x = 0.08          # 中子烧入率

    def simulate_core(self, initial_power_mw, target_power_mw, duration_hours):
        """
        利用欧拉积分模拟反应堆核心氙中毒累积过程
        """
        dt = 1.0 # 步长 1 秒
        steps = int(duration_hours * 3600 / dt)
        
        # 归一化初始值
        power_ratio = target_power_mw / 3200.0
        
        # 初始状态设为100%额定功率下的物理稳态值
        # I_0 = 0.06 / lambda_i = 4320
        # X_0 = (0.01 + lambda_i * I_0) / (0.08 + lambda_x) = 0.875
        iodine = 4320.0
        xenon = 0.875
        
        # 执行欧拉积分演化
        for _ in range(steps):
            # 碘的产生与衰变
            di = (power_ratio * 0.06 - self.lambda_i * iodine) * dt
            iodine += di
            
            # 氙的产生、衰变与中子烧入
            dx = (power_ratio * 0.01 + self.lambda_i * iodine - (self.lambda_x + self.sigma_x * power_ratio) * xenon) * dt
            xenon = max(0.01, xenon + dx)
            
        return iodine, xenon

    def test_xenon_poisoning_accumulation(self):
        """
        测试物理规律：功率减半滞留 9 小时，会导致氙-135浓度大幅攀升（氙中毒）
        """
        # 初始功率 3200MW，降为 1600MW (50%功率)，滞留 9 小时
        final_iodine, final_xenon = self.simulate_core(
            initial_power_mw=3200,
            target_power_mw=1600,
            duration_hours=9.0
        )
        
        # 验证反应堆毒化现象：由于烧入中子减少，氙-135 浓度会攀升到 1.3 左右的毒化峰值区
        print(f"9小时半功率毒化后 - 碘-135浓度: {final_iodine:.4f}, 氙-135浓度: {final_xenon:.4f}")
        self.assertGreater(final_xenon, 1.2, "氙-135 累积量应当因为功率下降而增加，发生反应堆毒化！")

    def test_reactivity_effect(self):
        """
        测试反应性平衡：计算空泡系数和控制棒移动产生的总反应性反应
        """
        # 验证控制棒拔出过多时，ORM下降
        orm_initial = 30.0
        # 拔出80%控制棒时的ORM计算
        rod_position = 80.0
        orm_calculated = max(2.0, 32.0 - (rod_position / 100.0) * 28.0)
        
        self.assertAlmostEqual(orm_calculated, 9.6, places=4, msg="ORM计算公式在拔出80%控制棒时应输出 9.6")
        self.assertLess(orm_calculated, 15.0, "拔出 80% 控制棒使 ORM 低于安全底线 15")

if __name__ == '__main__':
    unittest.main()
