# E2EE Chat Application

A secure, End-to-End Encrypted (E2EE) web chat application built with Flask, MySQL, Nginx, and Docker. This application prioritizes user privacy by ensuring that the server never has access to plaintext messages.

## Features

*   **End-to-End Encryption**: Messages are encrypted on the client side using the Web Crypto API. The server acts only as a relay for encrypted data.
*   **Secure Authentication**: Multi-factor authentication including Password + TOTP (2FA) + CAPTCHA.
*   **Forward Secrecy**: Supports key rotation during chat sessions.
*   **Session Management**: Secure, server-side session handling with inactivity timeouts.
*   **Containerized Deployment**: Fully dockerized with Nginx as a reverse proxy and MySQL as the database.

## Security Design & Implementation

### 1. Authentication & Access Control
The application implements a robust multi-layered authentication mechanism:
*   **Passwords**: User passwords are hashed using **bcrypt** (salted) before storage in the database.
*   **Two-Factor Authentication (2FA)**: 
    *   Uses Time-based One-Time Passwords (**TOTP**). 
    *   Upon registration, users scan a QR code to set up their authenticator app (e.g., Google Authenticator).
    *   TOTP verification is mandatory for every login.
*   **Bot Protection**: Integration of **Google reCAPTCHA v2** and a custom image-based CAPTCHA on login/registration forms.
*   **Session Security**: 
    *   Server-side sessions (filesystem storage).
    *   Cookies are configured with `HttpOnly`, `Secure`, and `SameSite=Strict` attributes.
    *   Automatic session timeout after 20 minutes of inactivity.

### 2. End-to-End Encryption (E2EE)
The core privacy feature relies on the **Web Crypto API** in the browser.

*   **Key Exchange (ECDH)**:
    *   Users generate an **Elliptic Curve Diffie-Hellman (ECDH)** key pair using the **P-384** curve upon first access.
    *   Public keys are published to the server, while private keys remain in the user's browser `localStorage`.
    *   When starting a chat, a shared secret is derived combining the user's private key and the peer's public key.

*   **Key Derivation (HKDF)**:
    *   The ECDH shared secret is not used directly. Instead, it is passed through **HKDF (HMAC-based Key Derivation Function)** using SHA-256.
    *   Two separate 256-bit keys are derived:
        1.  **AES Key**: For message encryption/decryption.
        2.  **MAC Key**: For signing the Initialization Vector (IV).

*   **Encryption Scheme**:
    *   **Algorithm**: **AES-GCM** (Galois/Counter Mode) with 256-bit keys.
    *   **Structure**: `Encrypted_Message = AES-GCM(Plaintext, Key, IV, AAD)`
    *   **AAD (Additional Authenticated Data)**: Binds the message to the specific sender and receiver context (e.g., `CHAT_MSG_FROM_X_TO_Y`) to prevent replay attacks in different contexts.
    *   **Integrity**: In addition to GCM's built-in authentication tag, the IV is signed using **HMAC-SHA256** to prevent IV manipulation.

*   **Key Rotation**: 
    *   The application supports manual key refreshing. This increments a localized salt and re-derives new session keys (AES & MAC) from the master shared secret, ensuring that future messages use different encryption parameters.

### 3. Database Schema
The database (MySQL) stores minimal information and **zero** plaintext messages:
*   `users`: Stores username, bcrypt-hashed password, ECDH public key, and encrypted security answers.
*   `messages`: Stores `ciphertext`, `iv`, `hmac`, `aad`, `sender_id`, and `receiver_id`.

## Prerequisites

*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/)
*   [OpenSSL](https://www.openssl.org/) (for generating SSL certificates)

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/TinkAnet/E2EE-CHAT-APPLICATION.git
    cd E2EE-CHAT-APPLICATION
    ```

2.  **Generate SSL Certificates**:
    The application uses HTTPS. You need to generate a self-signed certificate and key in the root directory:
    ```bash
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout cakey.pem -out cacert.crt
    ```
    *Note: When prompted, you can enter any details or just press Enter.*

3.  **Start the application**:
    Run the following command to build and start the containers:
    ```bash
    docker-compose up --build
    ```

4.  **Access the Chat**:
    Open your browser and navigate to `https://localhost:8443` (or the port configured in docker-compose).
    *Note: Since this uses self-signed certificates, you will need to accept the security warning in your browser.*

## Project Structure

*   `webapp/`: Flask application source code (backend & frontend templates).
    *   `app.py`: Main backend logic.
    *   `helpers.py`: Crypto and utility helpers.
    *   `templates/chat.html`: Contains the client-side E2EE implementation (Web Crypto API).
*   `nginx.conf`: Nginx configuration for the reverse proxy and SSL termination.
*   `init.sql`: Initial database schema setup.
*   `docker-compose.yaml`: Orchestration for App, DB, and Web Server containers.

## Contributors

*   Ivan
*   Bruce
*   Jason
*   Gabriel
*   Mike
