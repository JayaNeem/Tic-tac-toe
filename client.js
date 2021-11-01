var args = process.argv;
var socket = require('socket.io-client')(`http://${args[2]}:${args[3]}`);
console.log(`connected to ${args[2]} ${args[3]}`);
// const repl = require('repl');
const chalk = require('chalk');
const readline = require('readline-sync');

// socket.on('disconnec', function() {
//     socket.emit('disconnect')
// });

var myTurn = true;
var symbol;
let state = [];

for (let i = 1; i < 10; i++) {
    state[i] = '';
}

function isGameOver() {
    
    let isOver = 0;

    var matches = ["XXX", "OOO"]; // This are the string we will be looking for to declare the match over

    // We are creating a string for each possible winning combination of the cells
    var rows = [
      state[1] + state[2] + state[3], // 1st line
      state[4] + state[5] + state[6], // 2nd line
      state[7] + state[8] + state[9], // 3rd line
      state[1] + state[4] + state[7], // 1st column
      state[2] + state[5] + state[8], // 2nd column
      state[3] + state[6] + state[9], // 3rd column
      state[1] + state[5] + state[9], // Primary diagonal
      state[3] + state[5] + state[7]  // Secondary diagonal
    ];

    // Loop through all the rows looking for a match
    for (let i = 0; i < rows.length; i++) {
        if (rows[i] === matches[0] || rows[i] === matches[1]) {
            isOver = 1;
            break;
        }
    }
    let i;
    for (i = 1; i < 10; i++) {
        if (state[i] == '') {
            break;
        }
    }
    if (i == 10) 
        isOver = 2;

    return isOver;
}

function renderTurnMessage() {
    if (!myTurn) { // If not player's turn disable the board
        console.log(chalk.cyan("Your opponent's turn"));
    } else { // Enable it otherwise
        console.log(chalk.blueBright("Your turn."));
        let cmd = readline.question(chalk.blueBright('>'));
        cmd = cmd.trim();
        try {
            if (!state[cmd] || cmd === 'r')
                socket.emit("make.move", { // Valid move (on client side) -> emit to server
                    symbol: symbol,
                    position: cmd
                });
            else {
                console.log(chalk.redBright("Invalid move."));
                renderTurnMessage();
            }
        } catch(err) {
            console.log(chalk.redBright("Invalid move."));
            renderTurnMessage();
        }
    }
}

function renderBoard() {
    console.log("--Board--");
    for (let i = 1; i < 10; i++) {
        const element = state[i];
        if (!element) {
            console.log(chalk.green(i));
        } else {
            console.log(chalk.green(element));
        }
    }
}

socket.on('connect', () => {
    // console.log(chalk.cyan('Waiting for oponent..'))
})

// Bind event on players move
socket.on("move.made", function(data) {
    // console.log("Inside move.made");
    // console.log("data,  ", data);
    let isOver;
    if (data.position === 'r') {
        isOver = 3; 
    } else { 
        state[data.position] = data.symbol; // Render move
        // If the symbol of the last move was the same as the current player
        // means that now is opponent's turn
        myTurn = data.symbol !== symbol;

        renderBoard();
        isOver = isGameOver();//check after changng symbol
    }
    if (!isOver) { // If game isn't over show who's turn is this
        renderTurnMessage();
    } else if (isOver == 1) { // Else show win/lose message
        console.log(chalk.greenBright(`Game won by ${data.symbol == 'X'?"first":"second"} player.`));
    } else if (isOver == 2) {
        console.log(chalk.greenBright("Game is tied."));
    } else {
        console.log(chalk.greenBright(`${data.symbol == 'X'?"First":"Second"} player quit. Game won by ${data.symbol == 'Y'?"first":"second"} player.`));
    }
});

// Bind event for game begin
socket.on("game.begin", function(data) {
    symbol = data.symbol; // The server is assigning the symbol
    myTurn = symbol === "X"; // 'X' starts first
    console.log(chalk.cyan(`Game started. You are the ${myTurn?"first":"second"} player.`));
    renderBoard();
    renderTurnMessage();
});
