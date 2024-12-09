require('dotenv').config();
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Archivos de persistencia
const UID_FILE = 'processed_uids.json';
const EMAIL_FILE = 'processed_emails.json';

// Cargar UID procesados
let processedUids = new Set();
if (fs.existsSync(UID_FILE)) {
    const data = fs.readFileSync(UID_FILE, 'utf8');
    processedUids = new Set(JSON.parse(data));
    console.log(`Cargados ${processedUids.size} UID procesados.`);
}

// Cargar correos procesados
let processedEmails = new Set();
if (fs.existsSync(EMAIL_FILE)) {
    const data = fs.readFileSync(EMAIL_FILE, 'utf8');
    processedEmails = new Set(JSON.parse(data));
    console.log(`Cargados ${processedEmails.size} correos procesados.`);
}

// Guardar UID procesados
const saveProcessedUids = () => {
    fs.writeFileSync(UID_FILE, JSON.stringify(Array.from(processedUids)));
};

// Guardar correos procesados
const saveProcessedEmails = () => {
    fs.writeFileSync(EMAIL_FILE, JSON.stringify(Array.from(processedEmails)));
};

// Configuración del cliente IMAP
const imapConfig = {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 30000,
};

// Función para enviar respuesta automática
const sendAutoReply = async (toEmail) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Respuesta Automática" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Gracias por tu suscripción',
        text: `Hola, gracias por tu suscripción.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Respuesta enviada a ${toEmail}`);
    } catch (error) {
        console.error(`Error al enviar respuesta a ${toEmail}:`, error);
    }
};

// Extraer dirección de correo del cuerpo
const extractEmailFromBody = (text) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : null;
};

// Procesar correos
const processEmails = (imap) => {
    imap.openBox('INBOX', false, (err, box) => {
        if (err) {
            console.error('Error al abrir el buzón:', err);
            return;
        }

        console.log(`Buzón abierto. Correos totales: ${box.messages.total}`);

        imap.search(['UNSEEN'], (err, results) => {
            if (err) {
                console.error('Error al buscar correos:', err);
                return;
            }

            if (!results || results.length === 0) {
                console.log('No hay correos nuevos.');
                return;
            }

            console.log(`Correos no vistos encontrados: ${results.length}`);
            const fetch = imap.fetch(results, { bodies: '', struct: true });

            fetch.on('message', (msg, seqno) => {
                let uid;
                msg.once('attributes', (attrs) => {
                    uid = attrs.uid;

                    if (processedUids.has(uid)) {
                        console.log(`El correo con UID ${uid} ya fue procesado.`);
                        return;
                    }

                    processedUids.add(uid);
                    saveProcessedUids();
                    console.log(`Procesando correo con UID: ${uid}`);
                });

                msg.on('body', async (stream) => {
                    const parsed = await simpleParser(stream);
                    const body = parsed.text || '';
                    const detectedEmail = extractEmailFromBody(body);

                    if (detectedEmail) {
                        if (processedEmails.has(detectedEmail)) {
                            console.log(`La dirección ${detectedEmail} ya recibió respuesta.`);
                            return;
                        }

                        console.log(`Correo detectado en el cuerpo: ${detectedEmail}`);
                        await sendAutoReply(detectedEmail);

                        processedEmails.add(detectedEmail);
                        saveProcessedEmails();
                    } else {
                        console.log('No se detectó ninguna dirección de correo en el cuerpo.');
                    }
                });
            });

            fetch.on('error', (err) => {
                console.error('Error al recuperar correos:', err);
            });

            fetch.on('end', () => {
                console.log('Finalizada la recuperación de correos.');
            });
        });
    });
};

// Configuración e inicio del cliente IMAP
const startAutoResponder = () => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
        console.log('Conexión IMAP establecida.');
        processEmails(imap);
    });

    imap.once('error', (err) => {
        console.error('Error en IMAP:', err);
    });

    imap.once('end', () => {
        console.log('Conexión IMAP cerrada.');
    });

    imap.connect();
};

// Ejecutar servicio automáticamente cada minuto
setInterval(startAutoResponder, 60 * 1000);

// Mensaje inicial
console.log('Servicio de respuesta automática en ejecución...');
