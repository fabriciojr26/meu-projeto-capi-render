/*
 * NOME DO FICHEIRO: server.js
 * DESCRIÇÃO:
 * Versão de diagnóstico para identificar o URL de origem exato e resolver o problema de CORS.
 */

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// --- INÍCIO DO CÓDIGO DE DIAGNÓSTICO ---

// Temporariamente, vamos permitir todos os URLs para teste
app.use(cors());

// Middleware para nos dizer qual é o URL de origem de cada pedido
app.use((req, res, next) => {
  console.log(`Pedido recebido de: ${req.headers.origin}`);
  next();
});

// --- FIM DO CÓDIGO DE DIAGNÓSTICO ---

app.use(express.json());

// Endpoint para receber o evento da CAPI
app.post('/api/enviar-evento', async (req, res) => {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.error("Credenciais da API da Meta não configuradas no servidor.");
    return res.status(500).json({ error: 'Configuração interna do servidor incompleta.' });
  }

  try {
    const body = req.body;
    const payload = {
      event_name: body.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      event_source_url: body.source_url,
      action_source: "website",
      user_data: body.user_data,
      custom_data: body.custom_data
    };

    const response = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [payload] })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Erro recebido da API da Meta:", responseData);
      throw new Error('A API da Meta retornou um erro.');
    }

    console.log("Evento enviado com sucesso para a Meta:", responseData);
    res.status(200).json({ success: true, meta_response: responseData });

  } catch (error) {
    console.error('Erro na execução da função:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor a rodar na porta ${PORT}`);
});
