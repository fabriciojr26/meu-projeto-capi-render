/*
 * NOME DO ARQUIVO: server.js
 * DESCRIÇÃO:
 * Este é um servidor web simples usando Express.js, projetado para rodar no Render.
 * Ele cria um endpoint que recebe os dados da sua página intermediária e os envia
 * para a API de Conversões da Meta.
 */

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Importa o pacote CORS

const app = express();
const PORT = process.env.PORT || 10000; // O Render define a porta automaticamente

// Middlewares
app.use(cors()); // Habilita o CORS para permitir requisições do seu frontend
app.use(express.json()); // Habilita o parsing de JSON no corpo da requisição

// Endpoint para receber o evento da CAPI
app.post('/api/enviar-evento', async (req, res) => {
  // Pega as credenciais das variáveis de ambiente (método seguro)
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  // Validação de segurança
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

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
