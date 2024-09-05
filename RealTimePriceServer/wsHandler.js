const WebSocket = require('ws');
const axios = require('axios');
require('dotenv').config();

const key = process.env.KEY;
const secret = process.env.SECRET_KEY;

async function getApproval(key, secret) {
    const url = 'https://openapi.koreainvestment.com:9443/oauth2/Approval';
    const headers = { "content-type": "application/json" };
    const body = {
        "grant_type": "client_credentials",
        "appkey": key,
        "secretkey": secret
    };

    try {
        const response = await axios.post(url, body, { headers });
        return response.data.approval_key;
    } catch (error) {
        console.error('Error getting approval key:', error.response ? error.response.data : error.message);
        return null;
    }
}

function createWsConnection(client, approvalKey, timeout) {
    const wsConnection = new WebSocket("ws://ops.koreainvestment.com:21000");

    wsConnection.on('open', function open() {
        console.log(`WebSocket Opened for client ${client.stockId}`);
        sendDataToClient(client, wsConnection, approvalKey);
    });

    wsConnection.on('message', function incoming(data) {
        const message = data.toString();
        console.log(`한투 ${client.stockId}에게 온 메시지:`, message);

        const parsedMessage = message.split("|");
        if (parsedMessage.length >= 4) {
            const segments = parsedMessage[3].split("^");
            if (segments.length >= 1) {
                const recvData = segments[2]; 
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify({ stockId: client.stockId, recvData }));
                }
            } else {
                console.log('Data Size Error=', segments.length);
            }
        } else {
            console.log('Data Size Error=', parsedMessage.length);
        }
    });

    wsConnection.on('error', function error(err) {
        console.error(`WebSocket Error for client ${client.stockId}: ${err.message}`);
    });

    wsConnection.on('close', function close(statusCode, closeMsg) {
        console.log(`WebSocket Closed for client ${client.stockId}: Status Code=${statusCode}, Message=${closeMsg}`);
    });


    setTimeout(() => {
        if (wsConnection.readyState === WebSocket.OPEN) {
            wsConnection.close();
        }
    }, timeout);
}

async function sendDataToClient(client, wsConnection, approvalKey) {
    try {
        const payload = {
            "header": {
                "approval_key": approvalKey,
                "custtype": "P",
                "tr_type": "1",
                "content-type": "utf-8"
            },
            "body": {
                "input": {
                    "tr_id": "H0STCNT0",
                    "tr_key": client.stockId
                }
            }
        };

        if (wsConnection.readyState === WebSocket.OPEN) {
            console.log(`Sending data to WebSocket for client ${client.stockId}:`, JSON.stringify(payload));
            wsConnection.send(JSON.stringify(payload));
        }
    } catch (error) {
        console.error(`Error sending data to client ${client.stockId}:`, error);
    }
}

async function processClientsSequentially(clients, delay, timeout) {
    console.log("왜");
    let index = 0; 

    while (true) {
        const client = clients[index];
        if (!client) {
            index = 0;
            continue;
        }

        const approvalKey = await getApproval(key, secret); 

        createWsConnection(client, approvalKey, timeout);
        await new Promise(resolve => setTimeout(resolve, delay));
        index = (index + 1) % clients.length;
    }
}

module.exports = { processClientsSequentially };
