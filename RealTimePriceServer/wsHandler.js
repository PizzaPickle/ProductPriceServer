const WebSocket = require('ws');
const axios = require('axios');
require('dotenv').config();

let clients = []; 
let wsConnection = null;

const key = process.env.KEY;
const secret = process.env.SECRET_KEY;

let approvalKeyCache = null;
let approvalKeyExpiration = null;

async function getApproval(key, secret) {
    if (approvalKeyCache && approvalKeyExpiration > Date.now()) {
        return approvalKeyCache;
    }
    const url = 'https://openapi.koreainvestment.com:9443/oauth2/Approval';
    const headers = { "content-type": "application/json" };
    const body = {
        "grant_type": "client_credentials",
        "appkey": key,
        "secretkey": secret
    };

    try {
        const response = await axios.post(url, body, { headers });
        approvalKeyCache = response.data.approval_key;
        approvalKeyExpiration = Date.now() + 3600 * 1000; 
        return approvalKeyCache;
    } catch (error) {
        console.error('Error getting approval key:', error.response ? error.response.data : error.message);
        return null;
    }
}

function getWsConnection() {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        return wsConnection;
    }

    wsConnection = new WebSocket("ws://ops.koreainvestment.com:21000");

    wsConnection.on('open', function open() {
        console.log('WebSocket Opened');
    });

    wsConnection.on('message', function incoming(data) {
        const message = data.toString();
        console.log(message);

        if (message[0] === '0' || message[0] === '1') {  
            const d1 = message.split("|");
            if (d1.length >= 4) {
                const recvData = d1[3];
                clients.forEach(client => {
                    if (client.ws.readyState === WebSocket.OPEN) {
                        client.ws.send(JSON.stringify({ stockId: client.stockId, recvData }));
                    }
                });
            } else {
                console.log('Data Size Error=', d1.length);
            }
        }
    });

    wsConnection.on('error', function error(err) {
        console.error(`WebSocket Error: ${err.message}`);
    });

    wsConnection.on('close', function close(statusCode, closeMsg) {
        console.log(`WebSocket Closed: Status Code=${statusCode}, Message=${closeMsg}`);
        wsConnection = null; 
    });

    return wsConnection;
}

async function wsdata(ws, stockId) {
    const approvalKey = await getApproval(key, secret);

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
                "tr_key": stockId
            }
        }
    };

    const connection = getWsConnection();
    connection.on('open', function open() {
        console.log('Sending data:', JSON.stringify(payload));
        connection.send(JSON.stringify(payload));
    });

    addClient(ws, stockId); 
}

function addClient(ws, stockId) {
    clients.push({ ws, stockId });
}

function removeClient(ws) {
    clients = clients.filter(client => client.ws !== ws);
}

module.exports = { wsdata, addClient, removeClient };
