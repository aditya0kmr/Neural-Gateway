
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { createWorld, animateWorld, spawnDataPacket } from './world.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.02); // Deep Space Fog

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;
camera.position.y = 0;

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// --- Controls (Restricted for cinematic field) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false; // Disable zoom to keep UI framing
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2; // Slow drift

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00f3ff, 2, 50);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const coreLight = new THREE.PointLight(0xbc13fe, 1, 20); // Inner core purple glow
coreLight.position.set(0, 0, 0);
scene.add(coreLight);


// --- World Content ---
const worldObjects = createWorld(scene);


// --- State Management ---
const gameState = {
    warp: false,
    intensity: 1.0,
    typingCooldown: 0
};


// --- Animation Loop ---
const clock = new THREE.Clock(); // For smooth animation

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const delta = clock.getDelta();

    // Smooth return to base intensity
    if (gameState.intensity > 1.0) {
        gameState.intensity -= 0.05;
    }

    // Update controls
    controls.update();

    // Animate World Objects
    animateWorld(worldObjects, elapsedTime, gameState);

    // Dynamic Camera Drift (Parallax) if NOT warping
    if (!gameState.warp) {
        // Subtle mouse parallax could go here, but OrbitControls handles rotation nicely.
    } else {
        // Warp Camera Effect: Shake + Zoom In
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 0, 0.02);
        camera.position.x += (Math.random() - 0.5) * 0.05; // Shake
        camera.position.y += (Math.random() - 0.5) * 0.05; // Shake
    }

    renderer.render(scene, camera);
}

animate();


// --- Interaction Logic ---
const ui = {
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    form: document.getElementById('login-form'),
    btn: document.getElementById('btn-login'),
    panel: document.getElementById('login-panel'),
    status: document.getElementById('status-msg')
};

// 1. Typing Effects
function handleTyping() {
    // Spawn particles
    spawnDataPacket(scene, worldObjects);

    // Boost intensity (spins core faster)
    gameState.intensity = 5.0;

    // Play sound? (Browser policy restricts audio context usually, sticking to visuals)
}

ui.username.addEventListener('input', handleTyping);
ui.password.addEventListener('input', handleTyping);

// 2. Focus/Blur Effects
const focusCamera = () => {
    // Zoom in slightly logic if we want, or just stop auto-rotate?
    controls.autoRotate = false;
};
const blurCamera = () => {
    controls.autoRotate = true;
};

ui.username.addEventListener('focus', focusCamera);
ui.username.addEventListener('blur', blurCamera);
ui.password.addEventListener('focus', focusCamera);
ui.password.addEventListener('blur', blurCamera);


// 3. Login Validation (The "xoxo" Check)
ui.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = ui.username.value.trim().toLowerCase();
    const pass = ui.password.value;

    let isAuthenticated = false;

    // Authentication Logic
    if ((user === 'aadi' || user === 'nanniii') && pass === 'xoxo') {
        isAuthenticated = true;
    } else if (user === 'other' && pass === '') {
        isAuthenticated = true;
    }

    if (isAuthenticated) { // SECURE PASSWORD CHECK :P
        initiateWarpSequence();
    } else {
        visualReject();
    }
});

function initiateWarpSequence() {
    // 1. Lock UI
    ui.username.disabled = true;
    ui.password.disabled = true;
    ui.btn.innerHTML = "ACCESS GRANTED";
    ui.btn.style.borderColor = "#33ff33";
    ui.btn.style.color = "#33ff33";
    ui.status.textContent = "NEURAL LINK ESTABLISHED. INITIATING JUMP...";
    ui.status.className = "status-msg success";

    // 2. Hide UI gradually
    ui.panel.classList.add('fade-out'); // Add transition class to fade out

    // 3. Trigger 3D Warp
    gameState.warp = true;

    // 4. Whiteout / Redirect (Simulated)
    setTimeout(() => {
        // Create white overlay
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.background = 'white';
        div.style.zIndex = '9999';
        div.style.opacity = '0';
        div.style.transition = 'opacity 2s ease';
        document.body.appendChild(div);

        // Trigger fade to white
        requestAnimationFrame(() => div.style.opacity = '1');

        // Message after whiteout
        setTimeout(() => {
            document.body.innerHTML = '<h1 style="color:black; text-align:center; margin-top: 20%; font-family: sans-serif;">WELCOME TO THE SYSTEM</h1>';
        }, 2000);

    }, 3000); // 3 seconds of warp flight
}

function visualReject(msg = "ACCESS DENIED") {
    // Shake animation
    ui.panel.style.transform = "translateY(0) translateX(10px)";
    setTimeout(() => ui.panel.style.transform = "translateY(0) translateX(-10px)", 50);
    setTimeout(() => ui.panel.style.transform = "translateY(0) translateX(10px)", 100);
    setTimeout(() => ui.panel.style.transform = "translateY(0) translateX(0)", 150);

    ui.status.innerText = msg.toUpperCase();
    ui.status.className = "status-msg error";
    ui.btn.disabled = false;

    // Dim core briefly (Red pulse?)
    if (worldObjects.core) {
        worldObjects.core.material.emissive.setHex(0xff0000);
        setTimeout(() => worldObjects.core.material.emissive.setHex(0x001133), 500);
    }
}


// --- Resize Handler ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
