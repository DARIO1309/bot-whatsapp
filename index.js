const express = require('express');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());

// Suas credenciais (vamos preencher depois)
const VERIFY_TOKEN = 'minha_senha_secreta';
const WHATSAPP_TOKEN = 'COLE_SEU_TOKEN_DA_META_AQUI';
const PHONE_ID = 'COLE_SEU_PHONE_ID_AQUI';
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

const ai = new Anthropic({ apiKey: ANTHROPIC_KEY });

// Validação do webhook
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// Receber e responder mensagens
app.post('/webhook', async (req, res) => {
  const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || msg.type !== 'text') return res.sendStatus(200);

  const from = msg.from;
  const texto = msg.text.body;

  try {
    // IA gera a resposta
    const ia = await ai.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `Você é o assistente virtual da minha empresa.
               Responda sempre em português, de forma simpática e objetiva.
               Só fale sobre o que for relevante ao negócio.`,
      messages: [{ role: 'user', content: texto }]
    });

    const resposta = ia.content[0].text;

    // Enviar resposta ao cliente
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: from,
        text: { body: resposta }
      },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );

  } catch (erro) {
    console.error('Erro:', erro.message);
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log('✅ Bot rodando na porta 3000'));