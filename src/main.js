import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createWorld, animateWorld, spawnDataPacket } from './world.js';
import { auth } from './firebase-config.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.02);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// --- Post-Processing (Bloom) ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 2.0; // High glow
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00f3ff, 2, 50);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const coreLight = new THREE.PointLight(0xbc13fe, 1, 20);
coreLight.position.set(0, 0, 0);
scene.add(coreLight);

// --- World Content ---
const worldObjects = createWorld(scene);

// --- State Management ---
const gameState = {
    warp: false,
    intensity: 1.0,
    typingCooldown: 0,
    loggedIn: false,
    failedAttempts: 0,
    lockoutTime: 0
};

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Smooth return to base intensity
    if (gameState.intensity > 1.0) {
        gameState.intensity -= 0.05;
    }

    controls.update();
    animateWorld(worldObjects, elapsedTime, gameState);

    // Warp shake
    if (gameState.warp) {
        const shake = 0.05;
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
    }

    // Render via Composer (includes Bloom)
    composer.render();
}

animate();


// --- UI Logic ---
const ui = {
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    form: document.getElementById('login-form'),
    btn: document.getElementById('btn-login'),
    panel: document.getElementById('login-panel'),
    status: document.getElementById('status-msg'),
    // Dashboard elements
    dashboard: document.getElementById('dashboard-panel'),
    greeting: document.getElementById('user-greeting'),
    logoutBtn: document.getElementById('btn-logout'),
    terminal: document.getElementById('terminal-feed'),
    cmdInput: document.getElementById('cmd-input'),
    // Modules
    btnFirewall: document.getElementById('btn-firewall'),
    btnCore: document.getElementById('btn-core'),
    btnOverdrive: document.getElementById('btn-overdrive'),
    btnEncryption: document.getElementById('btn-encryption')
};

// --- TERMINAL HELPER ---
function printLog(text, color = "#bbb") {
    const line = document.createElement('div');
    line.style.color = color;
    line.innerHTML = `> ${text}`;
    ui.terminal.appendChild(line);
    ui.terminal.scrollTop = ui.terminal.scrollHeight;
}

// --- CLI LOGIC ---
if (ui.cmdInput) {
    ui.cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = ui.cmdInput.value.trim().toLowerCase();
            ui.cmdInput.value = '';

            printLog(cmd, "#fff"); // Echo command

            switch (cmd) {
                case 'help':
                    printLog("COMMANDS: status, clear, reboot, logout");
                    break;
                case 'status':
                    printLog("SYSTEM: ONLINE | CORE: STABLE | UPLINK: SECURE", "#00f3ff");
                    break;
                case 'clear':
                    ui.terminal.innerHTML = '';
                    break;
                case 'reboot':
                    printLog("REBOOTING SYSTEM...", "#ff0055");
                    setTimeout(() => location.reload(), 1000);
                    break;
                case 'logout':
                    location.reload();
                    break;
                default:
                    if (cmd.length > 0) printLog(`ERR: Unknown command '${cmd}'`, "#ff0055");
            }
        }
    });
}

// --- MODULE BUTTONS ---
function toggleModule(btn, name) {
    if (!btn) return;
    const isActive = btn.getAttribute('data-active') === 'true';
    const newState = !isActive;
    btn.setAttribute('data-active', newState);
    btn.textContent = `${name} [${newState ? 'ON' : 'OFF'}]`;

    if (newState) {
        printLog(`${name} ENABLED`, "#33ff33");
    } else {
        printLog(`${name} DISABLED`, "#ff0055");
    }
}

if (ui.btnFirewall) ui.btnFirewall.addEventListener('click', () => toggleModule(ui.btnFirewall, "FIREWALL"));
if (ui.btnCore) ui.btnCore.addEventListener('click', () => toggleModule(ui.btnCore, "CORE SYNC"));
if (ui.btnEncryption) ui.btnEncryption.addEventListener('click', () => toggleModule(ui.btnEncryption, "ENCRYPTION"));

if (ui.btnOverdrive) {
    ui.btnOverdrive.addEventListener('click', () => {
        printLog("WARNING: OVERDRIVE ENGAGED", "#ff0055");
        gameState.intensity = 8.0; // Spin core fast
    });
}


function handleTyping() {
    spawnDataPacket(scene, worldObjects);
    gameState.intensity = 5.0;
}

if (ui.username) {
    ui.username.addEventListener('input', handleTyping);
    ui.password.addEventListener('input', handleTyping);
    ui.username.addEventListener('focus', () => controls.autoRotate = false);
    ui.username.addEventListener('blur', () => controls.autoRotate = true);
    ui.password.addEventListener('focus', () => controls.autoRotate = false);
    ui.password.addEventListener('blur', () => controls.autoRotate = true);
}

function visualReject(message) {
    ui.status.textContent = message;
    ui.status.className = "status-msg error";
    ui.btn.disabled = false; // Ensure button is re-enabled

    // Error Shake
    ui.panel.style.transform = "translateX(10px)";
    setTimeout(() => ui.panel.style.transform = "translateX(-10px)", 50);
    setTimeout(() => ui.panel.style.transform = "translateX(0)", 100);
}


// LOGIN HANDLER
ui.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = ui.username.value.trim().toLowerCase();
    const pass = ui.password.value.trim();

    // --- RATE LIMIT CHECK ---
    if (gameState.failedAttempts >= 5) {
        const resetTime = 30000; // 30 seconds lockout
        const timeLeft = Math.ceil((gameState.lockoutTime - Date.now()) / 1000);

        if (Date.now() < gameState.lockoutTime) {
            visualReject(`SYSTEM LOCKED (${timeLeft}s)`);
            ui.btn.disabled = false;
            return;
        } else {
            // Reset after timeout
            gameState.failedAttempts = 0;
        }
    }

    // --- PASSWORD VALIDATION ---
    if (pass.length < 6) {
        visualReject("PASSWORD TOO SHORT");
        ui.btn.disabled = false;
        return;
    }

    // Visual Feedback
    ui.status.textContent = "ESTABLISHING UPLINK...";
    ui.status.className = "status-msg";
    ui.btn.disabled = true;

    try {
        // --- MOCK AUTH ---
        await new Promise(r => setTimeout(r, 1500));

        let success = false;
        if (user === 'other' || user === 'aadi' || user === 'nanniii') {
            success = true;
        }

        if (!success) {
            throw { code: 'auth/invalid-credential', message: 'Identity check failed' };
        }

        // Reset counters on success
        gameState.failedAttempts = 0;

        /* FIREBASE AUTH (Commented) */

        // Success Flow
        transitionToDashboard(user);

    } catch (error) {
        console.error("Login Error:", error);

        // Increment Rate Limit
        gameState.failedAttempts++;
        if (gameState.failedAttempts >= 5) {
            gameState.lockoutTime = Date.now() + 30000; // 30s lock
            visualReject("SYSTEM LOCKED");
        } else {
            // Generic Error Message to prevent enumeration
            visualReject("INVALID CREDENTIALS");
        }
    }
});

function transitionToDashboard(username) {
    gameState.loggedIn = true;

    // 1. Success UI
    ui.status.textContent = "ACCESS GRANTED";
    ui.status.className = "status-msg success";
    ui.btn.style.borderColor = "#33ff33";
    ui.btn.style.color = "#33ff33";

    // 2. Warp Effect Logic
    gameState.warp = true;

    // 3. UI Transition
    setTimeout(() => {
        ui.panel.classList.add('fade-out'); // Hide login

        setTimeout(() => {
            // Show Dashboard
            ui.dashboard.classList.remove('hidden');
            // Trigger reflow
            void ui.dashboard.offsetWidth;
            ui.dashboard.classList.add('visible'); // Fade in

            ui.greeting.textContent = `WELCOME ${username.toUpperCase()}`;

            // Focus Command Input
            if (ui.cmdInput) ui.cmdInput.focus();

            // Stop extreme warp, settle into cruise
            gameState.warp = false;
            controls.autoRotateSpeed = 2.0; // Fast spin for energy

            // Add terminal line
            printLog(`User ${username} authenticated.`);
            printLog(`Session started.`);

        }, 1000);
    }, 1500);
}


// LOGOUT HANDLER
if (ui.logoutBtn) {
    ui.logoutBtn.addEventListener('click', () => {
        location.reload(); // Simple reload to logout
    });
}

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
