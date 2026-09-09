require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');

const app = express();

// Configura tu clave de API (puedes usar .env o pegarla aquí directamente)
const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";

const groq = new Groq({ apiKey: GROQ_API_KEY });

app.use(express.urlencoded({ extended: true }));

let chatHistory = [];

function renderHTML(history, systemMsg = "") {
  const chatMessages = history.map(msg => {
    const role = msg.role === 'user' ? '<b>Tú:</b>' : '<b>IA:</b>';
    const formattedText = msg.content.replace(/\n/g, '<br>');
    return `<p style="margin: 4px 0;">${role} ${formattedText}</p><hr size="1" color="#cccccc">`;
  }).join('');

  return `
    <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
    <html>
      <head>
        <title>Simple IA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body bgcolor="#ffffff" text="#000000">
        <font face="sans-serif" size="2">
          <h3>Simple IA</h3>
          ${systemMsg ? `<p style="color: red;"><b>${systemMsg}</b></p>` : ""}
          <div id="chat-box">
            ${chatMessages || '<p><i>Escribe una pregunta para comenzar...</i></p>'}
          </div>
          <br>
          <form action="/chat" method="POST">
            <label for="prompt"><b>Mensaje:</b></label><br>
            <input type="text" id="prompt" name="prompt" size="18" required><br><br>
            <input type="submit" value="Enviar">
          </form>
          <br>
          <form action="/reset" method="POST">
            <input type="submit" value="Borrar Historial">
          </form>
        </font>
      </body>
    </html>
  `;
}

app.get('/', (req, res) => {
  res.send(renderHTML(chatHistory));
});

app.post('/chat', async (req, res) => {
  const userPrompt = req.body.prompt;

  if (userPrompt) {
    chatHistory.push({ role: 'user', content: userPrompt });

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'Eres un asistente útil y conciso. Responde siempre y únicamente en español, de forma directa y clara.' 
          },
          ...chatHistory
        ],
        model: 'allam-2-7b',
        max_tokens: 200
      });

      const aiResponse = completion.choices[0]?.message?.content || 'Sin respuesta.';
      chatHistory.push({ role: 'assistant', content: aiResponse });
    } catch (error) {
      console.error("=== ERROR DETALLADO ===", error);
      const mensajeError = error.message || "Error desconocido";
      chatHistory.push({ role: 'assistant', content: `ERROR: ${mensajeError}` });
    }
  }

  res.redirect('/');
});

app.post('/reset', (req, res) => {
  chatHistory = [];
  res.redirect('/');
});

app.listen(3000, '0.0.0.0', () => {
  console.log("=== SERVIDOR SIMPLE IA LISTO EN PUERTO 3000 ===");
});