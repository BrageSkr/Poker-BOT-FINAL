const http = require('http');


const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Check if the requested URL is the root path
    if (req.url === '/') {
        // Read the index.html file
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        fs.readFile(path.join(__dirname, req.url), (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(200);
                res.end(data);
            }
        });
    }
});
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});
const mqtt = require('mqtt');

// Create MQTT client
const client = mqtt.connect('mqtt://192.168.0.189');
let playerCount = 0; // Counter to keep track of player numbers
let players = {}; // Object to store player data and currentBet
let currentPlayer = 1;
let playerTurn =0;
let playersBinary = '';
let gameState = 0;
io.on('connection', (socket) => {
    console.log('a user connected');
    // After initializing player chips
    io.emit('currentPlayer', `player${currentPlayer}`);
    // Initialize socket.data
    socket.data = {};

    // Assign a custom ID to the socket
    playerCount++;
    client.publish('totalPlayers', playerCount.toString());
    const playerId = `Player${playerCount}`;
    socket.data.playerId = playerId;
    players[playerId] = { chips: 1000, state: '1', bet: 0 };  // Initialize player with 1000 chips
    socket.emit('playerId', playerId);
    io.emit('playersBinary', playersBinary);
    // Get the currentBet from the players object or set it to 0 if it doesn't exist
    let currentBet = players.currentBet || 0;

    console.log(`${playerId} connected with ${players[playerId].chips} chips`);
    io.emit('currentBet', currentBet); // Emit the currentBet to the new client

    // Handle player bet
    socket.on('bet', (amount) => {
        playerTurn=0;
        const player = players[playerId];
        currentBet = players.currentBet || 0;
        playersBinary= '';
        Object.values(players).forEach(player => {
            playersBinary += player.state || '0';
        });
        if (playerId === `Player${currentPlayer}`) {
            if (amount <= player.chips) {
                players.currentBet = currentBet + amount;
                player.chips -= amount;
                player.bet = currentBet + amount;
                io.emit('bet', `${playerId} bet ${amount}`);
                io.emit('currentBet', players.currentBet);
                io.emit('playerChips', { playerId: playerId, chips: player.chips });
                io.emit('playerBet', { playerId: playerId, bet: player.bet });
                client.publish('bet', amount.toString());
                const numPlayers = Object.keys(players).length -1;
                currentPlayer++;

                // If currentPlayer is greater than the number of players, reset to player1
                if (currentPlayer > numPlayers) {
                    currentPlayer = 1;
                }

                io.emit('currentPlayer', `Player${currentPlayer}`);

            } else {
                socket.emit('invalidBet', `Please bet an amount higher than or equal to ${currentBet} and less than or equal to your chips (${player.chips})`);
            }
        } else {
            socket.emit('notYourTurn', `It's not your turn to bet. Please wait for your turn.`);
        }
        client.publish('playersturn', currentPlayer.toString());
        console.log({playersBinary})
    });
    socket.on('check',() => {
        playersBinary= '';
        playerTurn++;
        Object.values(players).forEach(player => {
            playersBinary += player.state || '0';
        });
        const player = players[playerId];
        currentBet = players.currentBet || 0;
        if (playerId === `Player${currentPlayer}`) {
                players.currentBet = currentBet;
                const betDifference = currentBet - player.bet;
                player.chips -= betDifference;
                player.bet = currentBet;
                io.emit('bet', `${playerId} bet ${currentBet}`);
                io.emit('playerBet', { playerId: playerId, bet: player.bet });
                io.emit('currentBet', players.currentBet);
                io.emit('playerChips', { playerId: playerId, chips: player.chips });
                const numPlayers = Object.keys(players).length -1;
                currentPlayer++;

                // If currentPlayer is greater than the number of players, reset to player1
                if (currentPlayer > numPlayers) {
                    currentPlayer = 1;
                }

                io.emit('currentPlayer', `player${currentPlayer}`);


               if (playerTurn > numPlayers){
                   playerTurn=0;
                   gameState++;
               }
        } else {
            socket.emit('notYourTurn', `It's not your turn to bet. Please wait for your turn.`);
        }
        client.publish('playersturn', currentPlayer.toString());
        console.log({playersBinary})
    });
    // Handle reset bets request from the admin
    socket.on('resetBets', () => {
        delete players.currentBet;
        delete players.bet;// Remove the currentBet from the players object
        resetPlayerChips();
        currentPlayer=1;
        io.emit('currentBet', 0); // Emit currentBet as 0
        io.emit('resetBets');
        console.log('reset attempt');
    });
    socket.on('fold', () => {
        players[playerId].state = '0';
        playersBinary= '';
        Object.values(players).forEach(player => {
            playersBinary += player.state || '0';
        });
        currentPlayer ++;
        if (currentPlayer === 1) {
            io.emit('newRound');
        }
        console.log({ playersBinary });
        io.emit('playersBinary', playersBinary);
    });


    socket.on('disconnect', () => {
        console.log(`${playerId} disconnected`);
        delete players[playerId];
        playerCount--;
    });
});

// Function to reset player chips
function resetPlayerChips() {
    Object.keys(players).forEach((playerId) => {
        if (playerId !== 'currentBet') {
            players[playerId].chips = 1000;
            io.emit('playerChips', { playerId, chips: players[playerId].chips });
            io.emit('playerBet', { playerId: playerId, bet: 0 });
        }
    });
}




//erver.listen(8080, '192.168.0.188', () => console.log('listening on http://192.168.0.188:8080'));
server.listen(8080, () => console.log('Server listening on http://localhost:8080'));
//server.listen(8080, () => console.log('Server listening on http://10.24.3.44:8080'));

