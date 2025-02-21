const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

// Configurar la autenticación con el archivo de credenciales JSON
process.env.GOOGLE_APPLICATION_CREDENTIALS = "C:\\Users\\CreaTecno\\Desktop\\chatbot\\arfix-ngdy-7bbd1e5dd892.json";

// Crear el cliente de Dialogflow
const sessionClient = new dialogflow.SessionsClient();
const projectId = 'arfix-ngdy'; // Cambia por tu ID de proyecto en Google Cloud
const sessionId = uuid.v4(); // Genera una sesión única

// Crear cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
});

// Mostrar el QR para iniciar sesión
client.on('qr', (qr) => {
    console.log('Escanea este código QR con tu aplicación de WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Confirmar conexión
client.on('ready', () => {
    console.log('¡Bot conectado y listo para recibir mensajes!');
});

// Función para enviar el mensaje al agente de Dialogflow
async function sendToDialogflow(message, sessionId) {
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: message,
                languageCode: 'es', // Cambia el idioma si es necesario
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        return responses[0].queryResult.fulfillmentText; // Obtiene la respuesta de Dialogflow
    } catch (error) {
        console.error("Error al procesar el mensaje en Dialogflow:", error);
        return "Lo siento, no pude procesar tu mensaje en este momento.";
    }
}

// Escuchar mensajes entrantes
client.on('message', async (message) => {
    console.log(`Mensaje recibido de ${message.from}: ${message.body}`);

    // Enviar el mensaje a Dialogflow para procesarlo
    const dialogflowResponse = await sendToDialogflow(message.body, sessionId);

    // Enviar la respuesta de Dialogflow al usuario de WhatsApp
    client.sendMessage(message.from, dialogflowResponse);
});

// Manejar errores de autenticación
client.on('auth_failure', (msg) => {
    console.error('Error de autenticación:', msg);
});

// Inicializar cliente
client.initialize();
