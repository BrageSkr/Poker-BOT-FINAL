
//const socket = io('ws://localhost:8080');
const socket = io('ws://192.168.2.101:8000');


// Get UI elements
const betInput = document.getElementById('betInput');
const betButton = document.getElementById('betButton');
const currentBetDisplay = document.getElementById('currentBet');
const playerChipsDisplay = document.getElementById('playerChips');
const playerBetDisplay = document.getElementById('playerBetDisplay');
const foldButton = document.getElementById('foldButton');
const checkButton = document.getElementById('checkButton');
let IDplayer;
// Handle current bet updates
socket.on('currentBet', (currentBet) => {
    currentBetDisplay.textContent = ` ${currentBet}`;
});
const playerIdDisplay = document.getElementById('playerIdDisplay');

// Listen for the 'playerId' event from the server
socket.on('playerId', (playerId) => {
    IDplayer=playerId;
    playerIdDisplay.textContent = playerId;
});
socket.on('playerBet', ({ playerId, bet }) => {
    if (playerId === IDplayer) {
        // Update the HTML element with the player's bet
        playerBetDisplay.textContent = bet;
    }
});
// Handle player chip updates
socket.on('playerChips', ({ playerId, chips }) => {
    if (playerId === IDplayer) {
        playerChipsDisplay.textContent = ` ${chips}`;
    }
});

// Handle invalid bet
socket.on('invalidBet', (message) => {
    alert(message);
});

socket.on('resetBets', () => {

    playerChipsDisplay.textContent = '1000'; // Reset to the initial chip count
});

const currentPlayerElement = document.getElementById('currentPlayer');

socket.on('currentPlayer', (currentPlayerId) => {
    // Update the HTML element with the current player's ID
    currentPlayerElement.textContent = currentPlayerId;
});

// Send bet to server
betButton.addEventListener('click', () => {
    const betAmount = parseInt(betInput.value, 10);
    socket.emit('bet', betAmount);
});
foldButton.addEventListener('click', () => {
    socket.emit('fold');
});

// Send check event to server
checkButton.addEventListener('click', () => {
    socket.emit('check');
});

socket.on('newRound', () => {
    // Perform actions to start a new round
    console.log('New round started');
});

socket.on('notYourTurn', (message) => {
    alert(message);
});
socket.on('bettingInactive', (message) => {
    alert(message);
});