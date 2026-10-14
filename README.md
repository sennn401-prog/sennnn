# FOUR NEIGHT ENC Tool

A small Node.js CommonJS web app for encrypting/decrypting JavaScript source text or an ENC JSON payload.

## Requirements
- Node.js 18 or newer
- npm

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## Deploy to Render
1. Upload this folder to a GitHub repository.
2. In Render, choose **New + → Web Service** and connect the repository.
3. Set **Language** to `Node`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `npm start`.
6. Choose the Free instance if desired, then click **Create Web Service**.
7. Wait for deployment and open the `onrender.com` URL.

The app listens on `0.0.0.0` and reads Render's `PORT` environment variable.

## Security notes
- Uses AES-256-GCM with a random salt and IV; a key is derived from the password using scrypt.
- Source text is processed in memory and is not written to a file by the server.
- Do not paste secrets or code you are not authorized to handle. Use a unique strong password and keep it safe.
- The output is an encrypted data container, **not executable JavaScript**. This is encryption, not obfuscation.
- The 1 MB input limit is intentional for this demo.
- Free Render services can sleep after inactivity and take time to wake.

## Endpoints
- `GET /health`
- `POST /api/encrypt` JSON `{ "content": "...", "password": "..." }`
- `POST /api/decrypt` JSON `{ "content": "...ENC JSON...", "password": "..." }`
