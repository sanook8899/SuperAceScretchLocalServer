const Websocket = require("ws");

const server = new Websocket.Server({ port: 9900 });

let wsocket; // Declare a variable to hold the WebSocket object

var balance = 0;
var playerId = "";
var increaseMoney = 0;
var gameCode = "";
var awardMoney = 0;
var awardBase = 0;
var gameType = 2;
var roomId = 0;
var records = [];
var betSize = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
var baseValue = [1, 2, 2.5, 5, 25, 50, 250, 500, 1000, 10000]
var multiplierValue = [1,2,3,4];


function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}

function generateRandomInt(length) {
    const characters = '0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}


function loginRequest() {
    playerId = generateRandomString(8);
    balance = 200000;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 1,
        id: 1,
        data: {
            sessionId: generateRandomInt(10),
            errCode: 0,
            lobbyServerIp: "127.0.0.1",
            lobbyServerPort: 9900,
            playerId: playerId,
        }
    }

    return response;
}

function lobbyRequest() {

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 3,
        id: 3,
        data: {
            gameId: generateRandomInt(6),
            errCode: 0,
            balance: balance,
            serverTime: Date.now(),
            currency: "CNY",
            walletType:2,
        }
    }
    return response;
}

function joinRoomRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = [{
        gameName: "Scratch Card",
        betSizeList: betSize,
        maxWinMultiplier: baseValue[9],
    }]

    currencyInfo = [{
        currencyId: 1,
        currency: "CNY",
    }]

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100005,
            subData: {
                gameType: gameType,
                roomId: roomId,
                errCode: 0,
                balance: balance,
                betInfo: betInfo,
                currencyInfo: currencyInfo,
            }
        }
    }

    return response;
}

function transferRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100069,
            subData: {
                errCode: 0,
                balance: balance,
                increaseMoney: increaseMoney,
            }
        }
    }

    increaseMoney = 0;
    return response;
}

function recordRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    records = [
        {
            id: 321541,
            bet: 2,
            odds: 0.0,
            winMoney:0,
        },
        {
            id: 321541,
            bet: 2,
            odds: 1.5,
            winMoney: 3,
        },
    ]

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "GetRecords",
                recordsInfo: records,
            }
        }
    }

    return response;
}

function roomInfoRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    roomInfo = {
        betLimit: 100000,
        recordList: records,
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "SyncRoomInfo",
                roomInfo: roomInfo,
            }
        }
    }

    return response;
}

function roomListRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    let date = Date.now();
    date += 60 * 60 * 1000;
    response.vals = {
        type: 100000,
        id: 3,
        data: {
            gameType: gameType,
            roomIndex: roomId,
            isOccupied: true,
            reserveExpiredTime : date,
        }
    }

    return response;
}

function setBetRequest(bet) {
    awardBase = bet;
    gameCode = "#" + generateRandomString(10);
    balance -= awardBase;

    var info = createScratchCardGame(bet);

    //return {
    //    value,
    //    multiplier,
    //    winPos,
    //    winValue,
    //    isWin,
    //};

    let winAmount = info.isWin ? (info.winValue * info.multiplier) : 0;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = [{
        bet: awardBase,
        balance: balance,
        winAmount: winAmount,
        roundId: gameCode,
        finalBalance: balance + winAmount,
        info: info,
    }]

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "SetBet",
                betInfo: betInfo,
            }
        }
    }

    balance += winAmount;

    return response;
}

function createScratchCardGame(bet) {
    const baseValue = [1, 2, 2.5, 5, 25, 50, 250, 500, 1000, 10000];
    const multiplierValue = [1, 2, 3, 4];
    const value = Array(9).fill(0); // Initialize the scratch area values
    const winPos = []; // Positions of winning values

    // Determine if the player wins
    let isWin = Math.random() < 0.5; // 50% chance to win

    let winMultiplier = 0;
    let winValue = 0;

    if (isWin) {
        // Pick a random win value from baseValue
        winMultiplier = baseValue[Math.floor(Math.random() * baseValue.length)];
        winValue = winMultiplier * bet;

        // Randomly choose 3 positions for the winning value
        const availablePositions = [...Array(9).keys()]; // [0, 1, 2, ..., 8]
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            const position = availablePositions.splice(randomIndex, 1)[0];
            value[position] = winValue;
            winPos.push(position);
        }

        // Randomly fill the remaining 6 positions with non-winning values
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            const position = availablePositions.splice(randomIndex, 1)[0];

            // Ensure the value is not the winning value
            let nonWinningValue;
            do {
                nonWinningValue = baseValue[Math.floor(Math.random() * baseValue.length)] * bet;
            } while (nonWinningValue === winValue);

            value[position] = nonWinningValue;
        }
    } else {
        // No win: Fill all 9 positions with random non-matching values
        const usedValues = new Set();
        for (let i = 0; i < 9; i++) {
            let nonWinningValue;
            do {
                nonWinningValue = baseValue[Math.floor(Math.random() * baseValue.length)];
            } while (usedValues.has(nonWinningValue));

            usedValues.add(nonWinningValue);
            value[i] = nonWinningValue * bet;
        }
    }

    winPos.sort((a, b) => a - b);

    // Assign the random multiplier
    const multiplier = multiplierValue[Math.floor(Math.random() * multiplierValue.length)];

    return {
        value,
        multiplier,
        winMultiplier,
        winPos,
        winValue,
        isWin,
    };
}


server.on("connection", (ws) => {
    wsocket = ws;

    // ws.send("4515ce54-c62a-43ed-964e-0f4d4dc402b3");

    ws.on("message", (message) => {
        const jsonContent = JSON.parse(message);

        // login request
        if (jsonContent.type == 0) {
            let response = loginRequest();
            ws.send(JSON.stringify(response));
        }

        // lobby request
        if (jsonContent.type == 2) {
            let response = lobbyRequest();
            ws.send(JSON.stringify(response));
        }

        // room list request
        if (jsonContent.type == 200017) {
            let response = roomListRequest();
            ws.send(JSON.stringify(response));
        }

        if (jsonContent.type == 100000) {
            // join Room request
            if (jsonContent.data.subType == 100004) {
                roomId = jsonContent.data.subData.roomId;
                let response = joinRoomRequest();
                ws.send(JSON.stringify(response));
            }

            // transfer info request
            if (jsonContent.data.subType == 100068) {
                let response = transferRequest();
                ws.send(JSON.stringify(response));
            }

            // custom request
            if (jsonContent.data.subType == 100070) {
                // get records request
                if (jsonContent.data.subData.opCode == "GetRecords") {
                    let response = recordRequest();
                    ws.send(JSON.stringify(response));
                }
                // sync room info request
                if (jsonContent.data.subData.opCode == "SyncRoomInfo") {
                    let response = roomInfoRequest();
                    ws.send(JSON.stringify(response));
                }
                // set bet request
                if (jsonContent.data.subData.opCode == "SetBet") {
                    let bet = jsonContent.data.subData.message.bet;
                    //original
                    let response = setBetRequest(bet);
                    ws.send(JSON.stringify(response));
                }
            }
        }
    })
});