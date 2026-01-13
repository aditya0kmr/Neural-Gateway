import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { EffectComposer } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { PlayerControls } from './PlayerControls.js';
import { buildWorld } from './WorldGen.js';

// --- CONFIG ---
const CONFIG = {
    fov: 75,
    fogColor: 0x020205, // Darker fog for contrast
    fogDensity: 0.015
};

// --- ENGINE STATE ---
const state = {
    lastTime: 0,
    isLocked: false,
    interactables: []
};

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.fogColor);
scene.fog = new THREE.FogExp2(CONFIG.fogColor, CONFIG.fogDensity);

const camera = new THREE.PerspectiveCamera(CONFIG.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 5);

const renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialias off for post-processing performance
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- POST PROCESSING (BLOOM) ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.15;
bloomPass.strength = 1.2; // Sci-fi Glow strength
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); // Dim ambient
scene.add(ambientLight);

const blueLight = new THREE.PointLight(0x00f3ff, 2, 50);
blueLight.position.set(0, 10, 0);
scene.add(blueLight);

// --- WORLD GENERATION ---
const worldData = buildWorld(scene);
state.interactables = worldData.crystals;

// --- PLAYER ---
const player = new PlayerControls(camera, document.body);
scene.add(player.getObject());

// --- RAYCASTER (INTERACTION) ---
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
const prompt = document.getElementById('interact-prompt');

function checkInteraction() {
    raycaster.setFromCamera(center, camera);
    const intersects = raycaster.intersectObjects(state.interactables);

    if (intersects.length > 0) {
        if (intersects[0].distance < 5) { // Activation distance
            prompt.style.opacity = 1;
            prompt.innerText = "[E] ANALYZE DATA SHARD";
            return intersects[0].object;
        }
    }
    prompt.style.opacity = 0;
    return null;
}

// --- UI EVENT HANDLERS ---
const instructions = document.getElementById('instructions');

instructions.addEventListener('click', () => {
    player.lock();
});

player.addEventListener('lock', () => {
    instructions.classList.add('hidden');
    state.isLocked = true;
});

player.addEventListener('unlock', () => {
    instructions.classList.remove('hidden');
    state.isLocked = false;
});


// --- ANIMATION LOOP ---
function animate(time) {
    requestAnimationFrame(animate);

    const delta = (time - state.lastTime) / 1000;
    state.lastTime = time;

    if (state.isLocked) {
        player.update(delta);
        checkInteraction(); // Update raycast

        // Animate Crystals
        state.interactables.forEach((obj, i) => {
            obj.rotation.y += delta;
            obj.position.y = 2 + Math.sin(time / 500 + i) * 0.5;
        });
    }

    composer.render();
}

animate(0);


// --- RESIZE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
