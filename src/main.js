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
    loggedIn: false
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
    terminal: document.getElementById('terminal-feed')
};

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


// LOGIN HANDLER
ui.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = ui.username.value.trim().toLowerCase();

    ui.status.textContent = "ESTABLISHING UPLINK...";
    ui.status.className = "status-msg";
    ui.btn.disabled = true;

    try {
        // --- MOCK AUTH ---
        await new Promise(r => setTimeout(r, 1500));

        if (user === 'other' || user === 'aadi' || user === 'nanniii') {
            console.log("Mock success");
        } else {
            throw { message: 'Identity Unknown' };
        }

        /* FIREBASE AUTH (Commented) */

        // Success Flow
        transitionToDashboard(user);

    } catch (error) {
        console.error(error);
        ui.btn.disabled = false;
        ui.status.textContent = "ACCESS DENIED";
        ui.status.className = "status-msg error";

        // Error Shake
        ui.panel.style.transform = "translateX(10px)";
        setTimeout(() => ui.panel.style.transform = "translateX(-10px)", 50);
        setTimeout(() => ui.panel.style.transform = "translateX(0)", 100);
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

            // Stop extreme warp, settle into cruise
            gameState.warp = false;
            controls.autoRotateSpeed = 2.0; // Fast spin for energy

            // Add terminal line
            const line = document.createElement('div');
            line.innerHTML = `> User ${username} authenticated.<br>> Session started.`;
            ui.terminal.appendChild(line);

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
