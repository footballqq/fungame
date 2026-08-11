# codex: 2026-08-10 execute production JavaScript AI regressions for turn state, pairing, and response time
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


def test_ai_preserves_turn_and_records_move() -> None:
    run_javascript_test(
        """
        const fs = require('fs');
        const vm = require('vm');
        function loadClass(path, name) {
            const context = { console, module: { exports: {} } };
            vm.createContext(context);
            vm.runInContext(fs.readFileSync(path, 'utf8') + `;globalThis.Result = ${name};`, context);
            return context.Result;
        }
        const Game = loadClass('js/game.js', 'BridgItGame');
        const AI = loadClass('js/ai.js', 'BridgItAI');
        const game = new Game(3, 4);
        game.makeMove('bv_0_0');
        const ai = new AI('normal', 'red');
        const move = ai.getBestMove(game);
        if (game.currentPlayer !== 'red') throw new Error('AI changed the active player');
        if (!game.getValidMoves('red').includes(move)) throw new Error('AI returned an invalid move');
        if (!game.makeMove(move)) throw new Error('AI move was not committed');
        if (game.history.length !== 2 || game.history[1].player !== 'red') {
            throw new Error('AI move was not recorded in history');
        }
        """
    )


def test_ai_blocks_opponent_immediate_win() -> None:
    run_javascript_test(
        """
        const fs = require('fs');
        const vm = require('vm');
        function loadClass(path, name) {
            const context = { console, module: { exports: {} } };
            vm.createContext(context);
            vm.runInContext(fs.readFileSync(path, 'utf8') + `;globalThis.Result = ${name};`, context);
            return context.Result;
        }
        const Game = loadClass('js/game.js', 'BridgItGame');
        const AI = loadClass('js/ai.js', 'BridgItAI');
        const game = new Game(3, 4);
        game.blueEdges.bv_0_0.owner = 'blue';
        game.blueEdges.bv_1_0.owner = 'blue';
        game.currentPlayer = 'red';
        const ai = new AI('normal', 'red');
        ai.timeLimitMs = 1000;
        const move = ai.getBestMove(game);
        if (move !== 'rh_2_0') throw new Error(`expected blocking move rh_2_0, got ${move}`);
        """
    )


def test_gross_3x4_pairing_replies_to_every_effective_red_move() -> None:
    run_javascript_test(
        """
        const fs = require('fs');
        const vm = require('vm');
        function loadClass(path, name) {
            const context = { console, module: { exports: {} } };
            vm.createContext(context);
            vm.runInContext(fs.readFileSync(path, 'utf8') + `;globalThis.Result = ${name};`, context);
            return context.Result;
        }
        const Game = loadClass('js/game.js', 'BridgItGame');
        const AI = loadClass('js/ai.js', 'BridgItAI');
        const ai = new AI('master', 'blue');
        const initial = new Game(3, 4);
        const pairing = ai.getPairingMap(initial);
        if (!pairing || Object.keys(pairing).length !== 16) {
            throw new Error('3x4 Gross pairing must cover the 12 productive and 4 boundary replies');
        }
        const targets = Object.values(pairing);
        if (targets.length !== new Set(targets).size || targets.includes('bv_2_0')) {
            throw new Error('pairing targets must be unique and exclude the opening move');
        }
        initial.makeMove('bv_2_0');
        for (const redMove of initial.getValidMoves('red')) {
            const game = new Game(3, 4);
            game.makeMove('bv_2_0');
            game.makeMove(redMove, 'red');
            const blueMove = pairing[redMove];
            if (!blueMove || !game.getValidMoves('blue').includes(blueMove)) {
                throw new Error(`missing legal response for ${redMove}`);
            }
        }
        if (ai.getPairingMap(new Game(5, 6)) !== null) {
            throw new Error('unverified board sizes must not use the 3x4 pairing table');
        }
        """
    )


def test_gross_3x4_pairing_wins_all_productive_move_orders() -> None:
    run_javascript_test(
        """
        const fs = require('fs');
        const vm = require('vm');
        function loadClass(path, name) {
            const context = { console, module: { exports: {} } };
            vm.createContext(context);
            vm.runInContext(fs.readFileSync(path, 'utf8') + `;globalThis.Result = ${name};`, context);
            return context.Result;
        }
        const Game = loadClass('js/game.js', 'BridgItGame');
        const AI = loadClass('js/ai.js', 'BridgItAI');
        const game = new Game(3, 4);
        const pairing = new AI('master', 'blue').getPairingMap(game);
        const productiveMoves = Object.keys(pairing).filter((move) => !['rv_0_0', 'rv_0_3', 'rv_1_0', 'rv_1_3'].includes(move));
        game.makeMove('bv_2_0');
        function winsAfterEveryReply() {
            if (game.winner) return game.winner === 'blue';
            const available = productiveMoves.filter((move) => game.getValidMoves('red').includes(move));
            if (available.length === 0) return game.checkWinner() === 'blue';
            for (const redMove of available) {
                game.makeMove(redMove, 'red');
                if (game.winner === 'red') return false;
                const blueMove = pairing[redMove];
                if (!game.getValidMoves('blue').includes(blueMove)) return false;
                game.makeMove(blueMove, 'blue');
                const wins = winsAfterEveryReply();
                game.undo(2);
                game.currentPlayer = 'red';
                if (!wins) return false;
            }
            return true;
        }
        if (!winsAfterEveryReply()) throw new Error('Gross pairing lost for a productive move order');
        """
    )


def test_master_ai_returns_within_interaction_budget_on_largest_board() -> None:
    run_javascript_test(
        """
        const fs = require('fs');
        const vm = require('vm');
        function loadClass(path, name) {
            const context = { console, module: { exports: {} } };
            vm.createContext(context);
            vm.runInContext(fs.readFileSync(path, 'utf8') + `;globalThis.Result = ${name};`, context);
            return context.Result;
        }
        const Game = loadClass('js/game.js', 'BridgItGame');
        const AI = loadClass('js/ai.js', 'BridgItAI');
        const game = new Game(8, 9);
        const ai = new AI('master', 'blue');
        const startedAt = Date.now();
        const move = ai.getBestMove(game);
        const elapsedMs = Date.now() - startedAt;
        if (!game.getValidMoves('blue').includes(move)) throw new Error('AI returned an invalid large-board move');
        if (game.currentPlayer !== 'blue' || game.history.length !== 0) {
            throw new Error('AI search changed the game state');
        }
        if (elapsedMs > 130) throw new Error(`AI exceeded interaction budget: ${elapsedMs}ms`);
        """
    )
