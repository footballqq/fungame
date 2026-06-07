# tests/test_game_assets.py
# codex: 2026-06-06 编写资产完整性与代码膨胀门禁自动化测试

import unittest
import os

class TestGameAssets(unittest.TestCase):
    def setUp(self):
        # 根目录定位
        self.workspace_dir = r"E:\users\kpan\BaiduSyncdisk\program\aigc\fungame\Chernobyl"
        
        # 核心文件列表
        self.required_files = [
            "index.html",
            "index.css",
            "style/reactor_skala.css",
            "style/exploration.css",
            "style/forsmark_liq.css",
            "js/audio.js",
            "js/state.js",
            "js/reactor.js",
            "js/skala.js",
            "js/geiger.js",
            "js/geiger_sandbox.js",
            "js/evacuation.js",
            "js/forsmark.js",
            "js/liquidators.js",
            "js/liquidators_diver.js",
            "js/liquidators_roof.js",
            "js/scenario.js",
            "js/scenario_science.js",
            "js/main.js"
        ]

    def test_file_existence(self):
        """测试所有核心前端代码文件是否存在"""
        for rel_path in self.required_files:
            abs_path = os.path.join(self.workspace_dir, rel_path.replace("/", "\\"))
            self.assertTrue(os.path.exists(abs_path), f"核心文件缺失: {rel_path} (路径: {abs_path})")

    def test_code_line_limits(self):
        """代码门禁：确保没有单个文件行数超过 500 行，防范代码膨胀"""
        for rel_path in self.required_files:
            abs_path = os.path.join(self.workspace_dir, rel_path.replace("/", "\\"))
            if not os.path.exists(abs_path):
                continue
            
            with open(abs_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                line_count = len(lines)
                
            self.assertLessEqual(line_count, 500, f"代码文件 {rel_path} 超过500行限额! 当前行数: {line_count}")

    def test_image_resources(self):
        """测试图片资源是否存在"""
        image_assets = ["map.png", "Geiger-Counter-13-2894135-0.jpg"]
        for img in image_assets:
            abs_path = os.path.join(self.workspace_dir, img)
            self.assertTrue(os.path.exists(abs_path), f"资源图片缺失: {img}")

if __name__ == '__main__':
    unittest.main()
