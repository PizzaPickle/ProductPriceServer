const express = require('express');
const axios = require('axios');
const { getToken } = require("./apiUtils");
const app = express();
const port = 8081; 
const key = process.env.KEY;
const secret = process.env.SECRET_KEY;
app.use(express.json());

const URL_BASE = "https://openapi.koreainvestment.com:9443";

app.post('/api/stock/current-price', async (req, res) => {
    const { stockId } = req.body; 

    if (!stockId) {
        return res.status(400).json({ error: "stockId is required" });
    }

    try {
        const ACCESS_TOKEN = await getToken();
        const PATH = "uapi/domestic-stock/v1/quotations/inquire-price";
        const URL = `${URL_BASE}/${PATH}`;
        const authorization = ACCESS_TOKEN.access_token;
        const token_type = ACCESS_TOKEN.token_type;
        const headers = {
            "Content-Type": "application/json",
            authorization: `${token_type} ${authorization}`,
            appKey: key,
            appSecret: secret,
            tr_id: "FHKST01010100",
        };

        const params = {
            fid_cond_mrkt_div_code: "J",
            fid_input_iscd: stockId,
        };
        const response = await axios.get(URL, { headers, params });
        return res.json(response.data); 
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
            error_description: 'Failed to fetch current price',
            error_code: 'SERVER_ERROR'
        });
    }
});


app.post('/api/overseas-stock/current-price', async (req, res) => {
    const { stockId } = req.body; 

    if (!stockId) {
        return res.status(400).json({ error: "stockId is required" });
    }

    try {
        const ACCESS_TOKEN = await getToken();
        const PATH = "/uapi/overseas-price/v1/quotations/price";
        const URL = `${URL_BASE}/${PATH}`;
        const authorization = ACCESS_TOKEN.access_token;
        const token_type = ACCESS_TOKEN.token_type;
        const headers = {
            authorization: `${token_type} ${authorization}`,
            appKey: key,
            appSecret: secret,
            tr_id: "HHDFS00000300",
        };

        const params = {
            AUTH: "",
            EXCD: stockId.slice(0,3),
            SYMB: stockId.slice(3)
        };
        const response = await axios.get(URL, { headers, params });
        return res.json(response.data); 
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
            error_description: 'Failed to fetch current price',
            error_code: 'SERVER_ERROR'
        });
    }
});





app.post('/api/bond/current-price', async (req, res) => {
    const { stockId } = req.body; 

    if (!stockId) {
        return res.status(400).json({ error: "stockId is required" });
    }

    try {
        const ACCESS_TOKEN = await getToken();
        const PATH = "/uapi/domestic-bond/v1/quotations/inquire-price";
        const URL = `${URL_BASE}/${PATH}`;
        const authorization = ACCESS_TOKEN.access_token;
        const token_type = ACCESS_TOKEN.token_type;
        const headers = {
            "Content-Type": "application/json",
            authorization: `${token_type} ${authorization}`,
            appKey: key,
            appSecret: secret,
            tr_id: "FHKBJ773400C0",
            custtype: "P"
        };

        const params = {
            fid_cond_mrkt_div_code: "B",
            fid_input_iscd: stockId,
        };
        const response = await axios.get(URL, { headers, params });
        return res.json(response.data); 
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
            error_description: 'Failed to fetch current price',
            error_code: 'SERVER_ERROR'
        });
    }
});



app.post('/api/ETF/current-price', async (req, res) => {
    const { stockId } = req.body; 
    
    if (!stockId) {
        return res.status(400).json({ error: "stockId is required" });
    }
    const url = `https://polling.finance.naver.com/api/realtime/domestic/stock/${stockId}`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        console.log('Stock Price Data:', data.datas[0]);
        return res.json({ currentPrice: data.datas[0].closePrice}) ;
    }catch (error) {
        console.error('Error fetching stock price:', error.message);
    }

});


app.listen(port, () => {
    console.log(`REST API server is listening on port ${port}`);
});
