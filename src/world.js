
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Global reference for shared materials to save performance
const MATERIALS = {
    packet: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }),
    packetTrail: new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4 })
};

export function createWorld(scene) {
    const objects = {
        packets: [],
        stars: null,
        coreGroup: new THREE.Group() // Group to hold core + rings
    };

    scene.add(objects.coreGroup);

    // 1. The Neural Core (Icosahedron)
    const geometry = new THREE.IcosahedronGeometry(1.5, 1);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x001133,
        emissiveIntensity: 0.8,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
        roughness: 0.2,
        metalness: 0.8
    });
    const core = new THREE.Mesh(geometry, material);
    objects.coreGroup.add(core); // Add to group
    objects.core = core;

    // 2. Inner Glow (Soul)
    const glowGeo = new THREE.SphereGeometry(1, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    objects.coreGroup.add(glow); // Add to group
    objects.glow = glow;

    // 3. Gyroscope Rings
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.3 });
    
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.05, 16, 100), ringMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.05, 16, 100), ringMat);
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.05, 16, 100), ringMat);
    
    objects.coreGroup.add(ring1);
    objects.coreGroup.add(ring2);
    objects.coreGroup.add(ring3);
    
    objects.rings = [ring1, ring2, ring3];


    // 4. Warp Stars (Particle Field)
    // We use a custom shader logic approach or just simple stretching for "warp"
    const starsGeo = new THREE.BufferGeometry();
    const count = 4000;
    const posArray = new Float32Array(count * 3);
    const randomArray = new Float32Array(count); // For random speeds/offsets

    for (let i = 0; i < count; i++) {
        posArray[i * 3] = (Math.random() - 0.5) * 100; // x
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 100; // y
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 100; // z
        randomArray[i] = Math.random();
    }

    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    starsGeo.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));

    const starsMat = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });

    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);
    objects.stars = stars;
    
    // Store original positions for reset/warp calculations if needed, 
    // but for warp we'll just move them fast.
    objects.starPositions = posArray; 

    return objects;
}

// Function to spawn a "Data Packet" (Energy particle)
export function spawnDataPacket(scene, objects) {
    // Start from bottom of screen (roughly) in 3D space
    // We'll estimate a position. 
    // Ideally user types -> raycast, but hardcoding visual origin is fine for effect.
    const startX = (Math.random() - 0.5) * 2;
    const startY = -4; // Below view
    const startZ = 4;  // Closer to camera

    const geo = new THREE.SphereGeometry(0.08, 8, 8);
    const mesh = new THREE.Mesh(geo, MATERIALS.packet);
    
    mesh.position.set(startX, startY, startZ);
    
    // Random velocity curve
    const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1, // Slight X drift
        0.1 + Math.random() * 0.1,   // Upwards
        -0.2 // Into the screen (towards core at 0,0,0)
    );

    const packet = { mesh, velocity, life: 1.0 };
    scene.add(mesh);
    objects.packets.push(packet);
}

export function animateWorld(objects, time, state = { warp: false, intensity: 1 }) {
    // 1. Core & Ring Rotation
    // Intensity multiplier spins things faster when user types
    const speed = 0.5 * state.intensity;
    
    if (objects.core) {
        objects.core.rotation.x = time * 0.5 * speed;
        objects.core.rotation.y = time * 0.2 * speed;
        // Heartbeat pulse
        const scale = 1 + Math.sin(time * 3 * speed) * (0.05 * state.intensity);
        objects.core.scale.set(scale, scale, scale);
    }

    if (objects.rings) {
        objects.rings[0].rotation.x = time * 0.4 * speed;
        objects.rings[0].rotation.y = time * 0.1;
        
        objects.rings[1].rotation.x = -time * 0.2;
        objects.rings[1].rotation.y = time * 0.5 * speed;

        objects.rings[2].rotation.x = time * 0.1;
        objects.rings[2].rotation.z = time * 0.3 * speed;
    }

    // 2. Data Packets Logic
    for (let i = objects.packets.length - 1; i >= 0; i--) {
        const p = objects.packets[i];
        
        // Move
        p.mesh.position.add(p.velocity);
        
        // Suck into core effect (Gravity)
        const target = new THREE.Vector3(0, 0, 0); // Core Position
        const dir = new THREE.Vector3().subVectors(target, p.mesh.position).normalize();
        
        p.velocity.add(dir.multiplyScalar(0.02)); // Acceleration towards center
        p.velocity.multiplyScalar(1.02); // Accelerate speed

        // Shrink as it gets closer/older
        p.mesh.scale.multiplyScalar(0.95);
        
        // Distance check
        if (p.mesh.position.distanceTo(target) < 0.5) {
            // Hit core!
            p.mesh.visible = false; // Hide
            objects.packets.splice(i, 1);
            // Could trigger a minimal flash here if we wanted
        }
    }

    // 3. Warp Drive / Star Field
    if (objects.stars) {
        if (state.warp) {
            // WARP SPEED: Stretch stars into lines and fly through
            const positions = objects.stars.geometry.attributes.position.array;
            for(let i = 0; i < positions.length; i+=3) {
                // Move towards camera (Z+)
                positions[i+2] += 2.0; 
                
                // Reset if passes camera
                if (positions[i+2] > 20) {
                    positions[i+2] = -50;
                    positions[i] = (Math.random() - 0.5) * 100;
                    positions[i+1] = (Math.random() - 0.5) * 100;
                }
            }
            objects.stars.geometry.attributes.position.needsUpdate = true;
            
            // Visual stretch
            // Note: True "Lines" require LinesGeometry or specialized shaders. 
            // For a simple effect, we just move them fast. Speed is convincing enough.
        } else {
            // Idle Drift
            objects.stars.rotation.y = time * 0.05 * speed;
        }
    }
}
