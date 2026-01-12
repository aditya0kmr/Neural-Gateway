# Neural Gateway

A React/Three.js based interactive 3D Login System representing a "Neural Interface".

## 🚀 Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/aditya0kmr/Neural-Gateway.git
    cd Neural-Gateway
    ```

2.  **Run Locally**
    You need a simple web server to handle the ES6 modules and texture loading.
    *   **Node.js**: `npx http-server . -p 8080`
    *   **Python**: `python -m http.server 8080`
    *   **VS Code**: Use "Live Server" extension.

    Open `http://localhost:8080` in your browser.

## 🔐 Authentication Modes

The system currently runs in **Mock / Sudo Mode** by default.

### Mock Credentials (Sudo Mode)
*   **User**: `other` (Anonymous access)
*   **User**: `aadi` (Admin access)
*   **User**: `nanniii` (Admin access)
*   **Password**: Any (must be > 6 characters)

### Firebase Mode (Production)
To enable real authentication:
1.  Open `src/main.js`.
2.  Uncomment the "REAL FIREBASE AUTHENTICATION" block.
3.  Comment out the "MOCK AUTHENTICATION" block.
4.  Ensure `src/firebase-config.js` contains your valid project keys.

## 🛡️ Security Features
*   **Rate Limiting**: Accounts are temporarily locked after 5 failed login attempts.
*   **Input Validation**: Passwords must be at least 6 characters long.
*   **Obfuscated Errors**: Returns generic "Invalid Credentials" to prevent username enumeration.

## 🛠️ Tech Stack
*   **Three.js**: 3D Core Rendering & Particles.
*   **Post-Processing**: UnrealBloomPass for neon glow effects.
*   **Firebase**: Authentication (Optional/Configured).
*   **Vanilla JS**: No bundler required for dev.
