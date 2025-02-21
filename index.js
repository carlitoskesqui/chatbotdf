const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
const sessionClient = new dialogflow.SessionsClient({ credentials });
const projectId = credentials.project_id;
const sessionId = uuid.v4();

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
    console.log('Escanea este código QR con tu aplicación de WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('¡Bot conectado y listo para recibir mensajes!');
});

async function sendToDialogflow(message, sessionId) {
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: message,
                languageCode: 'es',
            },
        },
    };
    try {
        const responses = await sessionClient.detectIntent(request);
        return responses[0].queryResult.fulfillmentText;
    } catch (error) {
        console.error("Error al procesar el mensaje en Dialogflow:", error);
        return "Lo siento, no pude procesar tu mensaje en este momento.";
    }
}

client.on('message', async (message) => {
    console.log(`Mensaje recibido de ${message.from}: ${message.body}`);
    const dialogflowResponse = await sendToDialogflow(message.body, sessionId);
    client.sendMessage(message.from, dialogflowResponse);
});

client.on('auth_failure', (msg) => {
    console.error('Error de autenticación:', msg);
});


const express = require('express');
const app = express();

// Definir el puerto que Render proporcionará automáticamente
const port = process.env.PORT || 3000; // Puerto predeterminado 3000

app.get('/', (req, res) => {
    res.send('Bot de WhatsApp funcionando');
});

// Escuchar en el puerto
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});


client.initialize();
