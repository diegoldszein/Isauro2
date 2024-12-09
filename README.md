README del Proyecto - Respuesta Automática de Correos
Descripción del Proyecto
Este proyecto consiste en un servicio automatizado en Node.js que responde automáticamente a los correos electrónicos de nuevos suscriptores. Detecta las direcciones de correo en el cuerpo de los mensajes recibidos y envía una respuesta automática solo a aquellas direcciones que no han sido contactadas previamente.

Requisitos Previos
Node.js instalado (versión 16 o superior).
Cuenta de correo con acceso IMAP y SMTP habilitados (por ejemplo, Gmail con contraseña de aplicaciones).
Configuración del entorno con las credenciales necesarias.
Instalación
Clona este repositorio:

git clone https://github.com/tu_usuario/tu_repositorio.git
cd tu_repositorio
Instala las dependencias:

npm install
Configura las credenciales del correo:
Crea un archivo .env en la raíz del proyecto y completa las variables con tus credenciales IMAP y SMTP:

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=tu_email@gmail.com
IMAP_PASSWORD=tu_contraseña_app

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_contraseña_app
Ejecución del Proyecto
Modo de desarrollo:
Para iniciar el servicio de respuesta automática:

node index.js
Modo de producción:
Instala PM2 y ejecuta el servicio en segundo plano:

npm install -g pm2
pm2 start index.js --name "auto-responder"
pm2 save
pm2 startup
Con esto, el script se ejecutará continuamente y se reiniciará automáticamente en caso de fallos.

Estructura del Proyecto
├── index.js            # Script principal del proyecto
├── package.json        # Información del proyecto y dependencias
├── .env                # Configuración de credenciales (ignorado por Git)
├── processed_emails.json  # Historial de correos procesados
├── processed_uids.json    # Historial de UIDs procesados
└── README.md           # Documento de instrucciones
Flujo de Trabajo del Script
Conexión IMAP: Se conecta a la bandeja de entrada y filtra correos no leídos.
Procesamiento del correo: Busca direcciones de correo en el cuerpo del mensaje.
Evita duplicados: Verifica en los archivos processed_uids.json y processed_emails.json para no reenviar respuestas a los mismos destinatarios.
Envía respuesta automática: Utiliza SMTP para enviar una respuesta personalizada.
Registra procesados: Almacena los UIDs y direcciones procesadas en sus respectivos archivos JSON.
Pruebas
Para probar la funcionalidad, envía correos a la cuenta configurada en el .env.
Asegúrate de que:

Los correos contienen direcciones válidas en el cuerpo.
Los correos procesados no sean respondidos nuevamente.
Notas de Seguridad
No compartas el archivo .env ni expongas tus credenciales en repositorios públicos.
Si usas Gmail, activa la autenticación en dos pasos y genera una contraseña de aplicación.
Mantén actualizado Node.js y las dependencias del proyecto.
Licencia
Este proyecto está bajo la licencia MIT. Puedes usarlo y modificarlo libremente.

Créditos
Proyecto desarrollado por Diego.
