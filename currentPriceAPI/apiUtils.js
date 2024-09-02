const axios = require('axios');
require('dotenv').config();
const key = process.env.KEY;
const secret = process.env.SECRET_KEY;

let tokenCache = null;
let tokenExpiration = null;

async function getToken() {
    const now = Date.now();
    if (tokenCache && tokenExpiration > now) {
        return tokenCache;
    }

    const url = 'https://openapi.koreainvestment.com:9443/oauth2/tokenP';
    const headers = { "Content-Type": "application/json" };
    const body = {
        "grant_type": "client_credentials",
        "appkey": key,
        "appsecret": secret
    };

    try {
        const response = await axios.post(url, body, { headers });
        tokenCache = response.data;
        tokenExpiration = now + (3600 * 1000); // 토큰의 유효 기간을 1시간으로 설정 (필요에 따라 수정 가능)
        
        return tokenCache;
    } catch (error) {
        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
            console.error('Error response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw error;
    }
}

module.exports = { getToken };
