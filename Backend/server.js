/*
 * NOME DO FICHEIRO: server.js
 * DESCRIÇÃO:
 * Versão final corrigida com uma configuração de CORS mais robusta
 * para garantir a comunicação entre o frontend e o backend.
 */

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// --- INÍCIO DA CORREÇÃO DE CORS ROBUSTA ---

// Lista de URLs permitidos. Adicione outros se necessário no futuro.
const allowedOrigins = [
  'https://minha-pagina-intermediaria.onrender.com'
  // Pode adicionar 'http://localhost:3000' aqui se for testar localmente
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite pedidos sem 'origin' (como apps mobile ou Postman) ou se o 'origin' estiver na lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pela política de CORS'));
    }
  }
};

app.use(cors(corsOptions));

// --- FIM DA CORREÇÃO DE CORS ROBUSTA ---

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
    // ... (resto do código permanece igual)
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
