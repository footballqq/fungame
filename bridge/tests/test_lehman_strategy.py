# codex: 2026-08-10 验证预存双树分解和无搜索的 Lehman 逐手应答。
import subprocess
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]


def run_javascript_test(script: str) -> None:
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPOSITORY_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout


def test_cached_lehman_plans_are_complete_tree_decompositions() -> None:
    run_javascript_test(
        """
        const fs = require('fs');
        const vm = require('vm');
        const context = { console, module: { exports: {} } };
        vm.createContext(context);
        vm.runInContext(fs.readFileSync('js/lehman.js', 'utf8') + ';globalThis.Strategy = LehmanPairingStrategy;', context);
        const Strategy = context.Strategy;

        for (const [size, plan] of Object.entries(Strategy.PLANS)) {
            const vertices = new Set(['top', 'bottom']);
            for (let row = 1; row < plan.rows; row++) {
                for (let column = 0; column < plan.columns - 1; column++) vertices.add(`${row}:${column}`);
            }
            const assertTree = (edges) => {
                if (edges.length !== vertices.size - 1) throw new Error(`${size}: incorrect tree edge count`);
                const parent = new Map([...vertices].map(vertex => [vertex, vertex]));
                const find = vertex => parent.get(vertex) === vertex ? vertex : parent.set(vertex, find(parent.get(vertex))).get(vertex);
                for (const edge of edges) {
                    const [from, to] = Strategy._edgeVertices(edge, plan.rows, plan.columns);
                    const left = find(from), right = find(to);
                    if (left === right) throw new Error(`${size}: tree has a cycle`);
                    parent.set(left, right);
                }
                if (new Set([...vertices].map(find)).size !== 1) throw new Error(`${size}: tree is disconnected`);
            };
            assertTree(plan.treeOne);
            assertTree(plan.treeTwo);
            const shared = plan.treeOne.filter(edge => plan.treeTwo.includes(edge));
            if (shared.length !== 1 || shared[0] !== plan.openingMove) throw new Error(`${size}: opening must be the only shared edge`);
            const expectedEdges = new Set();
            for (let row = 0; row < plan.rows; row++) {
                for (let column = 0; column < plan.columns - 1; column++) expectedEdges.add(`bv_${row}_${column}`);
            }
            for (let row = 1; row < plan.rows; row++) {
                for (let column = 0; column < plan.columns - 2; column++) expectedEdges.add(`bh_${row}_${column}`);
            }
            const covered = new Set([...plan.treeOne, ...plan.treeTwo]);
            if (covered.size !== expectedEdges.size || [...expectedEdges].some(edge => !covered.has(edge))) {
                throw new Error(`${size}: trees must partition every effective Blue edge`);
            }
        }
        """
    )


def test_lehman_strategy_replies_without_search_on_cached_sizes() -> None:
    run_javascript_test(
        """
        const fs = require('fs');
        const vm = require('vm');
        const context = { console, module: { exports: {} } };
        vm.createContext(context);
        for (const path of ['js/game.js', 'js/lehman.js']) vm.runInContext(fs.readFileSync(path, 'utf8'), context);
        vm.runInContext('globalThis.Game = BridgItGame; globalThis.Strategy = LehmanPairingStrategy;', context);
        const { Game, Strategy } = context;
        let seed = 17;
        const nextIndex = length => (seed = (seed * 1103515245 + 12345) >>> 0) % length;

        for (const plan of Object.values(Strategy.PLANS)) {
            for (let trial = 0; trial < 12; trial++) {
                const game = new Game(plan.rows, plan.columns);
                const opening = Strategy.getMove(game, game.getValidMoves('blue'));
                if (opening !== plan.openingMove || !game.makeMove(opening, 'blue')) throw new Error('opening failed');
                while (!game.winner) {
                    const redMoves = game.getValidMoves('red');
                    if (redMoves.length === 0) break;
                    if (!game.makeMove(redMoves[nextIndex(redMoves.length)], 'red')) throw new Error('red move failed');
                    if (game.winner) break;
                    const blueMoves = game.getValidMoves('blue');
                    const response = Strategy.getMove(game, blueMoves);
                    if (!response || !blueMoves.includes(response)) throw new Error(`${plan.rows}x${plan.columns}: missing legal response`);
                    if (!game.makeMove(response, 'blue')) throw new Error('blue move failed');
                }
                if (game.winner !== 'blue') throw new Error(`${plan.rows}x${plan.columns}: Red defeated the cached strategy`);
            }
        }
        """
    )
