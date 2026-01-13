import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js';

export class PlayerControls extends PointerLockControls {
    constructor(camera, domElement) {
        super(camera, domElement);

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Physics Params
        this.speed = 20.0;
        this.gravity = 30.0;
        this.jumpHeight = 15.0;

        this._initListeners();
    }

    _initListeners() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = true; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = true; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = true; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = true; break;
                case 'Space':
                    if (this.canJump === true) {
                        this.velocity.y += this.jumpHeight;
                        this.canJump = false;
                    }
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = false; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = false; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = false; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = false; break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    update(delta) {
        // Delta Limit for stability
        if (delta > 0.1) delta = 0.1;

        // Decrease velocity (Friction)
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= this.gravity * delta; // Gravity

        // Direction from inputs
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        // Move
        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * this.speed * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * this.speed * delta;

        // Apply Movement
        this.moveRight(-this.velocity.x * delta);
        this.moveForward(-this.velocity.z * delta);

        // Y Position (Simple floor collision)
        this.getObject().position.y += this.velocity.y * delta;

        if (this.getObject().position.y < 1.7) { // Floor at y=0, eye height 1.7
            this.velocity.y = 0;
            this.getObject().position.y = 1.7;
            this.canJump = true;
        }
    }
}
