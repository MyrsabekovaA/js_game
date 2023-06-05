const crypto = require('crypto');
const readlineSync = require('readline-sync');
const Table = require('cli-table3');
const RULES = [
    'rock',
    'paper',
    'scissors',
    'lizard',
    'spock'
];

const RESULTS = new Map([
    [-1, 'Lose'],
    [0, 'Draw'],
    [1, 'Win']
]);

class HmacGenerator {
    constructor() {
        this.key = this.generateKey();
    }

    generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    computeHmac(message) {
        return crypto.createHmac('sha256', this.key).update(message).digest('hex');
    }
}

class GameRules {
    indexByMove(move) {
        return RULES.findIndex(rule => rule === move)
    }

    checkWinner(playerMoveIndex, computerMoveIndex) {
        return playerMoveIndex === computerMoveIndex ? 0 : ((5 + playerMoveIndex - computerMoveIndex) % 5 <= 2) ? 1 : -1;
    }
}

class Game {
    constructor(moves) {
        if (moves.length < 3 || moves.length % 2 === 0) {
            throw new Error("Invalid number of arguments. Please input an odd number of arguments greater than or equal to 3.");
        } else if ([...new Set(moves)].length !== moves.length){
            throw new Error("Duplicate arguments found. Please input unique arguments.");
        }
        this.hmacGenerator = new HmacGenerator();
        this.moves = moves;
        this.rules = new GameRules();
        this.playerScore = 0;
        this.computerScore = 0;
        this.helpTable = new HelpTable(moves);
    }

    playGame() {
        let moveIndexes = this.moves.map(move => this.rules.indexByMove(move));
        if (moveIndexes.includes(-1)) {
            console.log('Invalid move. Please try again.');
            return;
        }


        let playerAvailableMoves = [...moveIndexes];

        while (true) {
            let computerMoveIndex = Math.floor(Math.random() * RULES.length);
            const hmac = this.hmacGenerator.computeHmac(RULES[computerMoveIndex]);
            console.log(`HMAC: ${hmac}`);

            console.log('Available moves:');
            playerAvailableMoves.forEach((move, i) => {
                console.log(`${i+1} - ${RULES[move]}`);
            });
            console.log(`0 - exit`);
            console.log(`? - help`);

            let playerMoveInput = readlineSync.question('Enter your move: ');
            if (playerMoveInput === '0') break;
            if (playerMoveInput === '?') {
                this.helpTable.show();
                continue;
            }

            let playerMoveIndex = parseInt(playerMoveInput) - 1;
            if (isNaN(playerMoveIndex) || playerMoveIndex < 0 || playerMoveIndex >= playerAvailableMoves.length) {
                console.log('Invalid move. Please try again.');
                continue;
            }

            const playerMoveInRulesIndex = playerAvailableMoves[playerMoveIndex];
            playerAvailableMoves.splice(playerMoveIndex, 1);

            let result = this.rules.checkWinner(playerMoveInRulesIndex, computerMoveIndex);
            this.playerScore += result;
            this.computerScore -= result;
            console.log(`Your move: ${RULES[playerMoveInRulesIndex]}\nComputer move: ${RULES[computerMoveIndex]}`);
            let resultMessage = '';
            if (result === 1) {
                resultMessage = 'User won';
            } else if (result === -1) {
                resultMessage = 'Computer won';
            } else {
                resultMessage = 'It\'s a draw';
            }
            console.log(resultMessage);
            console.log(`HMAC key: ${this.hmacGenerator.key}`);

            if (playerAvailableMoves.length === 0) {
                console.log(`Final score: Player - ${this.playerScore}, Computer - ${this.computerScore}`);
                console.log('No more moves available. Ending the game.');
                break;
            }
        }
    }

}

class HelpTable {
    constructor(moves) {
        this.moves = moves;
    }

    show() {
        const table = new Table({ head: ['v PC / User >'].concat(this.moves) });
        for (let i = 0; i < this.moves.length; i++) {
            let row = {};
            row[this.moves[i]] = [];
            for (let j = 0; j < this.moves.length; j++) {
                if (i === j) {
                    row[this.moves[i]].push('Draw');
                } else {
                    let normalizedIndex = (j - i + this.moves.length) % this.moves.length;
                    if (normalizedIndex <= Math.floor((this.moves.length - 1) / 2)) {
                        row[this.moves[i]].push('Win');
                    } else {
                        row[this.moves[i]].push('Lose');
                    }
                }
            }
            table.push(row);
        }
        console.log(table.toString());
    }
}

const moves = process.argv.slice(2);
const game = new Game(moves);
game.playGame();