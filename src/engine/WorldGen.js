import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function buildWorld(scene, physicsColliders) {
    const loader = new THREE.TextureLoader();

    // --- MATERIALS ---
    // 1. Sleek Black Metal (Floor/Towers)
    const materialDark = new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 0.1,
        metalness: 0.9,
    });

    // 2. Neon Blue Emission
    const materialNeon = new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x00f3ff,
        emissiveIntensity: 2.0,
        toneMapped: false
    });

    // 3. Neon Purple Emission
    const materialPurple = new THREE.MeshStandardMaterial({
        color: 0xbc13fe,
        emissive: 0xbc13fe,
        emissiveIntensity: 1.5,
        toneMapped: false
    });

    // --- PROCEDURAL CITY GENERATION ---
    const towerCount = 400;
    const geometryTower = new THREE.BoxGeometry(1, 1, 1);
    const towerMesh = new THREE.InstancedMesh(geometryTower, materialDark, towerCount);

    // Neon edges for towers
    const geometryEdge = new THREE.BoxGeometry(1.02, 0.05, 1.02);
    const edgeMesh = new THREE.InstancedMesh(geometryEdge, materialNeon, towerCount);

    const dummy = new THREE.Object3D();
    const spread = 200;

    for (let i = 0; i < towerCount; i++) {
        // Random Position
        const x = (Math.random() - 0.5) * spread;
        const z = (Math.random() - 0.5) * spread;

        // Clear center area for player
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;

        // Random Height
        const height = Math.random() * 20 + 5;

        dummy.position.set(x, height / 2, z);
        dummy.scale.set(Math.random() * 4 + 2, height, Math.random() * 4 + 2);
        dummy.updateMatrix();
        towerMesh.setMatrixAt(i, dummy.matrix);

        // Add Physics Collider (Simple Box approximation)
        // Note: For true physics we'd need a physics engine, here we just visual.
        // We'll add simple collision logic in PlayerControls if needed.

        // Add Neon "Ring" at random height on tower
        dummy.scale.set(dummy.scale.x, 1, dummy.scale.z);
        dummy.position.y = Math.random() * height;
        dummy.updateMatrix();
        edgeMesh.setMatrixAt(i, dummy.matrix);
    }

    scene.add(towerMesh);
    scene.add(edgeMesh);


    // --- FLOOR ---
    // Infinite Grid illusion
    const grid = new THREE.GridHelper(400, 100, 0x00f3ff, 0x111111);
    grid.position.y = 0.1;
    scene.add(grid);

    const reflectFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.0,
            metalness: 1.0
        })
    );
    reflectFloor.rotation.x = -Math.PI / 2;
    scene.add(reflectFloor);

    // --- INTERACTIVE CRYSTALS ---
    const crystalGeo = new THREE.OctahedronGeometry(0.5);
    const crystals = [];

    for (let i = 0; i < 10; i++) {
        const mesh = new THREE.Mesh(crystalGeo, materialPurple);
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;

        // Keep away from center
        if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

        mesh.position.set(x, 2, z);
        mesh.userData = { type: 'crystal', id: i };
        scene.add(mesh);
        crystals.push(mesh);
    }

    return { crystals }; // Return interactive objects
}
