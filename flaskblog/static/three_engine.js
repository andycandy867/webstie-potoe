import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

import {Octree} from 'three/addons/math/Octree.js';

import {Capsule} from 'three/addons/math/Capsule.js';

import {GUI} from 'three/addons/libs/lil-gui.module.min.js';

const clock = new THREE.Clock();

const scene = new THREE.Scene();
const texture_loader = new THREE.CubeTextureLoader();
const texture = texture_loader.load([
	'/static/resources/skybox/dabomb.jpg',
	'/static/resources/skybox/dabomb.jpg',
	'/static/resources/skybox/dabomb.jpg',
	'/static/resources/skybox/dabomb.jpg',
	'/static/resources/skybox/dabomb.jpg',
	'/static/resources/skybox/dabomb.jpg',
]);

scene.background = texture;
// scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100);
camera.rotation.order = 'YXZ';

const fillLight1 = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
fillLight1.position.set(2, 1, 1);
scene.add(fillLight1);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(-5, 25, -1);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.top	= 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = -0.00006;
scene.add(directionalLight);

const container = document.getElementById('container');

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // THREE.VSMShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild(stats.domElement);

const GRAVITY = 20;

const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.2;

const STEPS_PER_FRAME = 10;

const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
const sphereMaterial = new THREE.MeshLambertMaterial({color: 0xbbbb44});

const spheres = [];
let sphereIdx = 0;

for (let i = 0; i < NUM_SPHERES; i ++) {
	const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphere.castShadow = true;
	sphere.receiveShadow = true;

	scene.add(sphere);

	spheres.push({
		mesh: sphere,
		collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
		velocity: new THREE.Vector3()
	});
}

const worldOctree = new Octree();

const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;
let jumps_remaining = 2;
let mouseTime = 0;

const mouse_states = {};
const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

const loader = new GLTFLoader()

const debugg = document.querySelector('#debugger')

let wave = 1
let enemies_remaining = 5
let wave_maps = {}
let wave_enemy_spawn_locations = {}

const raycaster = new THREE.Raycaster();

const bullet_point = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({color: 0xffff00}))
bullet_point.name = 'bullet_point'
scene.add(bullet_point)

// Returns a Promise that resolves after "ms" Milliseconds
const timer = ms => new Promise(res => setTimeout(res, ms))

async function scale_down(mesh) { // We need to wrap the loop into an async function for this to work
	let scaler = 1

	for (var i = 0; i < 10; i++) {
		scaler *= .75
		mesh.scale.set(scaler, 1, scaler)
		await timer(25); // then the created Promise can be awaited
	}
}

function cast_ray() {
	raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects(scene.children);

	let final_intersects = []
	let hit_enemies_id = []
	if (intersects) {
		for (var i = 0; i < intersects.length; i++) {
			if (!(hit_enemies_id.includes(intersects[i].object.parent.id)) && intersects[i].object.parent.name == 'enemy' && final_intersects.length <= 3) {
				final_intersects.push(intersects[i])
				hit_enemies_id.push(intersects[i].object.parent.id)
			} else if (!(intersects[i].object.name == 'bullet_point')) {
				final_intersects.push(intersects[i])
				break
			}
		 }

		 return final_intersects
	}
}

const carrot_blaster_material = new THREE.MeshBasicMaterial({color: 0xffffff})
function cylinder_mesh(pointX, pointY, radius) {
	// edge from X to Y
	const direction = new THREE.Vector3().subVectors(pointY, pointX);
	const arrow = new THREE.ArrowHelper(direction.clone().normalize(), pointY);

	const edgeGeometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 3, 1);

	const edge = new THREE.Mesh(edgeGeometry, carrot_blaster_material);
	edge.setRotationFromEuler(arrow.rotation)
	edge.position.copy(new THREE.Vector3().addVectors(pointX, direction.multiplyScalar(0.5)))
	return edge;
}

function fire() {
	let intersects = cast_ray();

	if (intersects[0]) {
		let mesh = cylinder_mesh(carrot_blaster_model.position, intersects[0].point, 0.01)
		scene.add(mesh)

		bullet_point.position.copy(intersects[0].point)
		if (intersects[0].object.parent.name == 'enemy') {
			let enemy = enemies.find(enemy => enemy.id == intersects[0].object.parent.id);
			enemy.take_damage(1)
		}

		animation.play().reset()

		window.setTimeout(() => {
			scene.remove(mesh);
			mesh.geometry.dispose();
		}, 100)
	}

	window.setTimeout(() => {
		carrot_blaster_debounce = true
	}, 500)
}

const carrot_blaster_battery = document.querySelector('#carrot_blaster_battery')
const carrot_blaster_alt_charge_doc = document.querySelector('#carrot_blaster_charge')

function carrot_blaster_charge() {
	if (carrot_blaster_alt_debounce) {
		if (carrot_blaster_alt_charge == 0) {
			carrot_blaster_battery.src = '/static/resources/images/green_battery.png'
		} else {
			carrot_blaster_battery.src = '/static/resources/images/blue_battery.png'
		}
	}

	carrot_blaster_alt_charge_doc.style.width = `${carrot_blaster_alt_charge}%`
}

async function carrot_blaster_recharge() {
	carrot_blaster_alt_charge_doc.style.width = '0%'
	carrot_blaster_battery.src = '/static/resources/images/red_battery.png'
	await timer(1500)
	carrot_blaster_battery.src = '/static/resources/images/yellow_battery.png'
	await timer(1500)
	carrot_blaster_battery.src = '/static/resources/images/green_battery.png'
	carrot_blaster_alt_debounce = true
}

function alt_fire() {
	// 3 dmg, split between peirce. If no second target then 3 to first, if 2 then 1.5, 1.5, if 3 then 1, 1, 1
	let intersects = cast_ray();

	if (intersects[0]) {
		let mesh = cylinder_mesh(carrot_blaster_model.position, intersects[intersects.length - 1].point, 0.25)
		scene.add(mesh)

		bullet_point.position.copy(intersects[intersects.length - 1].point)

		let hit_enemies = []
		for (var i = 0; i < intersects.length; i++) {
			if (intersects[i].object.parent.name == 'enemy') {
				let enemy = enemies.find(enemy => enemy.id == intersects[i].object.parent.id);
				hit_enemies.push(enemy)
			}
		}

		if (hit_enemies.length > 0) {
			let hit_count = 3
			i = 0
			while (hit_count >= 0) {
				if (!hit_enemies[i]) {
					i = 0
					continue
				}

				hit_count -= 1
				hit_enemies[i].take_damage(1)
				i++
			}
		}

		animation.play().reset()

		window.setTimeout(() => {
			scene.remove(mesh);
			mesh.geometry.dispose();
		}, 500)

		scale_down(mesh)
	}

	carrot_blaster_recharge()
}

let invulnerable = false
let hp = 100
const death_screen = document.querySelector('#death-screen')
const hp_count = document.querySelector('#health_bar_count')
const hp_bar = document.querySelector('#health_bar_progress')
function update_hp() {
	hp_count.innerHTML = hp
	hp_bar.style.width = `${hp}%`

	if (hp <= 0) {
		death_screen.style.display = 'flex'
		// Player Death
	}
}
let carrot_blaster_model = null
let carrot_blaster_debounce = true
let carrot_blaster_alt_debounce = true
let carrot_blaster_alt_charge = 0
let equipped_weapon
let unlocked_weapons = []

let stamina = 3
let stamina_regen = true
const stamina_bar_1 = document.querySelector('#stamina_bar_1')
const stamina_bar_2 = document.querySelector('#stamina_bar_2')
const stamina_bar_3 = document.querySelector('#stamina_bar_3')
function update_stamina() {
	stamina_bar_3.style.width = `${Math.max((stamina - 2), 0) * 100}%`
	if (stamina_bar_3.style.width == '0%') {
		stamina_bar_2.style.width = `${Math.max((stamina - 1), 0) * 100}%`
		if (stamina_bar_2.style.width == '0%') {
			stamina_bar_1.style.width = `${Math.max(stamina, 0) * 100}%`
		}
	}
}

let dash_debounce = true;
let sliding = false
let slam = false
document.addEventListener('keydown', (event) => {
	switch (event.code) {
		// Double Jump
		case 'Space':
			if (!keyStates['Space']) {
				if (jumps_remaining == 2) {
					playerVelocity.y = 15
					jumps_remaining = 1
				} else if (jumps_remaining == 1 && stamina >= 1) {
					stamina -= 1
					update_stamina()
					if (playerVelocity.y < 0) {
						playerVelocity.y = 0
					} else {
						playerVelocity.y *= 0.2718
					}

					playerVelocity.y += 10
					jumps_remaining = 0
				}

				if (sliding) {
					sliding = false
				}
			}

			break
		// Dash
		case 'KeyF':
			if (dash_debounce && !sliding) {
				if (!keyStates['KeyF'] && stamina >= 1) {
					dash_debounce = false;
					invulnerable = true;
					stamina -= 1
					update_stamina()
					playerVelocity.x *= 0.2718;
					playerVelocity.y *= 0.2718;
					playerVelocity.z *= 0.2718;

					if (keyStates['KeyW']) {
						if (keyStates['KeyA']) {
							playerVelocity.add(getForwardVector().multiplyScalar(40 * (1 - 0.2718)));
							playerVelocity.add(getSideVector().multiplyScalar(-40 * (1 - 0.2718)));
						}

						if (keyStates['KeyD']) {
							playerVelocity.add(getForwardVector().multiplyScalar(40 * (1 - 0.2718)));
							playerVelocity.add(getSideVector().multiplyScalar(40 * (1 - 0.2718)));
						}

						if (!keyStates['KeyA'] && !keyStates['KeyD']) {
							playerVelocity.add(getForwardVector().multiplyScalar(40));
						}
					} else if (keyStates['KeyS']) {
						if (keyStates['KeyA']) {
							playerVelocity.add(getForwardVector().multiplyScalar(-40 * (1 - 0.2718)));
							playerVelocity.add(getSideVector().multiplyScalar(-40 * (1 - 0.2718)));
						}

						if (keyStates['KeyD']) {
							playerVelocity.add(getForwardVector().multiplyScalar(-40 * (1 - 0.2718)));
							playerVelocity.add(getSideVector().multiplyScalar(40 * (1 - 0.2718)));
						}

						if (!keyStates['KeyA'] && !keyStates['KeyD']) {
							playerVelocity.add(getForwardVector().multiplyScalar(-40));
						}
					} else if (keyStates['KeyA']) {
						if (!keyStates['KeyD']) {
							playerVelocity.add(getSideVector().multiplyScalar(-40));
						}
					} else if (keyStates['KeyD']) {
						playerVelocity.add(getSideVector().multiplyScalar(40));
					} else {
						playerVelocity.add(getForwardVector().multiplyScalar(40))
					}

					let x = playerVelocity.x
					let y = playerVelocity.y
					let z = playerVelocity.z

					window.setTimeout(() => {
						playerVelocity.x *= 0.2718
						playerVelocity.z *= 0.2718
						dash_debounce = true
						invulnerable = false
					}, 150)
				}
			}
			break
		case 'KeyC':
			if (!keyStates['KeyC']) {
				if (!playerOnFloor) {
					if (!sliding) {
						if (!slam && stamina >= 1) {
							slam = true
							stamina -= 1
							update_stamina()
							playerVelocity.y = -25
						}
					} else {
						sliding = true
					}
				} else if (sliding == false) {
					sliding = true

					if (Math.abs(getForwardVector().x) < 1 || Math.abs(getForwardVector().z) < 1 || Math.abs(getSideVector().x) < 1 || Math.abs(getSideVector().z) < 1) {
						if (keyStates['KeyW']) {
							if (keyStates['KeyA']) {
								playerVelocity.add(getForwardVector().multiplyScalar(8 * (1 - 0.2718)));
								playerVelocity.add(getSideVector().multiplyScalar(-8 * (1 - 0.2718)));
							}

							if (keyStates['KeyD']) {
								playerVelocity.add(getForwardVector().multiplyScalar(8 * (1 - 0.2718)));
								playerVelocity.add(getSideVector().multiplyScalar(8 * (1 - 0.2718)));
							}

							if (!keyStates['KeyA'] && !keyStates['KeyD']) {
								playerVelocity.add(getForwardVector().multiplyScalar(8));
							}
						} else if (keyStates['KeyS']) {
							if (keyStates['KeyA']) {
								playerVelocity.add(getForwardVector().multiplyScalar(-8 * (1 - 0.2718)));
								playerVelocity.add(getSideVector().multiplyScalar(-8 * (1 - 0.2718)));
							}

							if (keyStates['KeyD']) {
								playerVelocity.add(getForwardVector().multiplyScalar(-8 * (1 - 0.2718)));
								playerVelocity.add(getSideVector().multiplyScalar(8 * (1 - 0.2718)));
							}

							if (!keyStates['KeyA'] && !keyStates['KeyD']) {
								playerVelocity.add(getForwardVector().multiplyScalar(-8));
							}
						} else if (keyStates['KeyA']) {
							if (!keyStates['KeyD']) {
								playerVelocity.add(getSideVector().multiplyScalar(-8));
							}
						} else if (keyStates['KeyD']) {
							playerVelocity.add(getSideVector().multiplyScalar(8));
						} else {
							playerVelocity.add(getForwardVector().multiplyScalar(8))
						}
					}
				}
			}

			break
	}

	keyStates[event.code] = true;
});

document.addEventListener('keyup', (event) => {
	if (event.code == 'KeyC' && sliding == true) {
		sliding = false
	}

	keyStates[event.code] = false;
});

container.addEventListener('mousedown', (event) => {
	document.body.requestPointerLock();
	mouseTime = performance.now();
});

document.addEventListener('mousedown', (event) => {
	mouse_states[event.button] = true;
});

document.addEventListener('mouseup', (event) => {
	if (event.button === 2) {
		if (carrot_blaster_alt_charge >= 100) {
			alt_fire()
			carrot_blaster_alt_debounce = false
		}

		carrot_blaster_alt_charge = 0
		carrot_blaster_charge()
	}

	mouse_states[event.button] = false;
});

document.body.addEventListener('mousemove', (event) => {
	if (document.pointerLockElement === document.body) {
		camera.rotation.y -= event.movementX / 500;
		camera.rotation.x -= event.movementY / 500;

		// User cannot look upside down
		if (camera.rotation.x <= -1.55) {
			camera.rotation.x = -1.55
		} else if (camera.rotation.x >= 1.55) {
			camera.rotation.x = 1.55
		}
	}
});

class Enemy {
	constructor(model, hp) {
		loader.setPath('/static/resources/models/enemies/')

		loader.load(`${model}`, (gltf) => {
			this.id = gltf.scene.id
			this.mesh = gltf.scene
			this.collider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);
			this.collider.translate(new THREE.Vector3(5, 5, 5));
			this.velocity = new THREE.Vector3()

			this.mesh.scale.setScalar(4)
			this.mesh.name = 'enemy'
			scene.add(gltf.scene)
		})

		this.on_floor = false
		this.hp = hp
		this.attack_debounce = true
		this.attack_cooldown = 500
	}

	take_damage(dmg) {
		this.hp -= dmg

		if (this.hp <= 0) {
			enemies.pop(this)
			scene.remove(this.mesh)
		}
	}

	async attack() {
		if (!invulnerable) {
			hp -= 5

			update_hp()
		}
	}
}

let enemies = [/*new Enemy('Fries.glb', 1)*/]

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function throwBall() {
	const sphere = spheres[sphereIdx];

	camera.getWorldDirection(playerDirection);

	sphere.collider.center.copy(playerCollider.end).addScaledVector(playerDirection, playerCollider.radius * 1.5);

	// throw the ball with more force if we hold the button longer, and if we move forward

	const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));

	sphere.velocity.copy(playerDirection).multiplyScalar(impulse);
	sphere.velocity.addScaledVector(playerVelocity, 2);

	sphereIdx = (sphereIdx + 1) % spheres.length;
}

function playerCollisions() {
	const result = worldOctree.capsuleIntersect(playerCollider);

	playerOnFloor = false;

	if (result) {
		playerOnFloor = result.normal.y > 0;

		if (!playerOnFloor) {
			playerVelocity.addScaledVector(result.normal, -result.normal.dot(playerVelocity));
		}

		playerCollider.translate(result.normal.multiplyScalar(result.depth));
	}
}

function updatePlayer(deltaTime) {
	let damping = Math.exp(-4 * deltaTime) - 1;

	if (!playerOnFloor) {
		playerVelocity.y -= GRAVITY * deltaTime;

		// small air resistance
		damping *= 0.2718;

		if (slam) {
			slam = false
		}

	} else if (jumps_remaining != 2) {
		// Reset Jump Count
		if (playerVelocity.y != 15) {
			jumps_remaining = 2
		}
	}

	if (sliding == true) {
		playerVelocity.addScaledVector(new THREE.Vector3(0.01, playerVelocity.y, 0.01), damping)
	} else {
		playerVelocity.addScaledVector(playerVelocity, damping);
	}

	const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
	playerCollider.translate(deltaPosition);

	playerCollisions();

	camera.position.copy(playerCollider.end);
}

function playerSphereCollision(sphere) {
	const center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);

	const sphere_center = sphere.collider.center;

	const r = playerCollider.radius + sphere.collider.radius;
	const r2 = r * r;

	// approximation: player = 3 spheres

	for (const point of [playerCollider.start, playerCollider.end, center]) {
		const d2 = point.distanceToSquared(sphere_center);

		if (d2 < r2) {
			const normal = vector1.subVectors(point, sphere_center).normalize();
			const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
			const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

			playerVelocity.add(v2).sub(v1);
			sphere.velocity.add(v1).sub(v2);

			const d = (r - Math.sqrt(d2)) / 2;
			sphere_center.addScaledVector(normal, -d);
		}
	}
}

function spheresCollisions() {
	for (let i = 0, length = spheres.length; i < length; i++) {
		const s1 = spheres[i];

		for (let j = i + 1; j < length; j++) {
			const s2 = spheres[j];

			const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
			const r = s1.collider.radius + s2.collider.radius;
			const r2 = r * r;

			if (d2 < r2) {
				const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
				const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
				const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

				s1.velocity.add(v2).sub(v1);
				s2.velocity.add(v1).sub(v2);

				const d = (r - Math.sqrt(d2)) / 2;

				s1.collider.center.addScaledVector(normal, d);
				s2.collider.center.addScaledVector(normal, -d);
			}
		}
	}
}

function updateSpheres(deltaTime) {
	spheres.forEach(sphere => {
		sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

		const result = worldOctree.sphereIntersect(sphere.collider);

		if (result) {
			sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
			sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
		} else {
			sphere.velocity.y -= GRAVITY * deltaTime;
		}

		const damping = Math.exp(-1.5 * deltaTime) - 1;
		sphere.velocity.addScaledVector(sphere.velocity, damping);

		playerSphereCollision(sphere);
	});

	spheresCollisions();

	for (const sphere of spheres) {
		sphere.mesh.position.copy(sphere.collider.center);
	}
}

function enemy_player_collision(enemy) {
	const player_center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);
	const enemy_center = vector1.addVectors(enemy.collider.start, enemy.collider.end).multiplyScalar(0.5);;

	const r = playerCollider.radius + enemy.collider.radius;
	const r2 = r * r;

	// approximation: player = 3 spheres

	for (const point of [playerCollider.start, playerCollider.end, player_center]) {
		const d2 = point.distanceToSquared(enemy_center);

		if (d2 < r2) {
			const normal = vector1.subVectors(point, enemy_center).normalize();
			const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
			const v2 = vector3.copy(normal).multiplyScalar(normal.dot(enemy.velocity));

			playerVelocity.add(v2).sub(v1);
			enemy.velocity.add(v1).sub(v2);

			const d = (r - Math.sqrt(d2)) / 2;
			enemy_center.addScaledVector(normal, -d);
		}
	}
}

function enemy_collisions(delta_time) {
	enemies.forEach(enemy => {
		const result = worldOctree.capsuleIntersect(enemy.collider);

		enemy.on_floor = false;

		if (result) {
			enemy.on_floor = result.normal.y > 0;

			if (!enemy.on_floor) {
				enemy.velocity.addScaledVector(result.normal, -result.normal.dot(enemy.velocity));
			}

			enemy.collider.translate(result.normal.multiplyScalar(result.depth));
		}
	})
}

function update_enemies(delta_time) {
	let damping = Math.exp(-4 * delta_time) - 1;

	enemies.forEach(enemy => {
		enemy.mesh.lookAt(playerCollider.end.x, enemy.mesh.position.y, playerCollider.end.z)

		let enemy_direction = new THREE.Vector3()
		enemy.mesh.getWorldDirection(enemy_direction);
		enemy_direction.y = 0;
		enemy_direction.normalize();

		enemy.velocity.add(enemy_direction.multiplyScalar(0.01))

		if (!enemy.on_floor) {
			enemy.velocity.y -= GRAVITY * delta_time;
			// small air resistance
			damping *= 0.2718;
		}

		enemy.velocity.addScaledVector(enemy.velocity, damping);

		// edit in future (raycast instead of just this to player camera)
		let distance = new THREE.Vector3(playerCollider.end.x, playerCollider.end.y, playerCollider.end.z).distanceTo(new THREE.Vector3(enemy.collider.end.x, 0, enemy.collider.end.z))
		if (distance < 1.5) {
			enemy.velocity = new THREE.Vector3(0, 0, 0)

			if (enemy.attack_debounce) {
				enemy.attack_debounce = false
				enemy.attack()

				window.setTimeout(() => {
					enemy.attack_debounce = true
				}, enemy.attack_cooldown)
			}

			return
		}

		const deltaPosition = enemy.velocity.clone().multiplyScalar(delta_time);
		enemy.collider.translate(deltaPosition);

		enemy.mesh.position.copy(enemy.collider.start)
		enemy_player_collision(enemy)
	})

	enemy_collisions();
}

function getForwardVector() {
	camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();

	return playerDirection;
}

function getSideVector() {
	camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();
	playerDirection.cross(camera.up);

	return playerDirection;
}

function controls(deltaTime) {
	// gives a bit of air control
	const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);

	if (!sliding) {
		if (keyStates['KeyW']) {
			if (keyStates['KeyA']) {
				playerVelocity.add(getForwardVector().multiplyScalar(speedDelta * (1 - 0.2718)));
				playerVelocity.add(getSideVector().multiplyScalar(-speedDelta * (1 - 0.2718)));
			}

			if (keyStates['KeyD']) {
				playerVelocity.add(getForwardVector().multiplyScalar(speedDelta * (1 - 0.2718)));
				playerVelocity.add(getSideVector().multiplyScalar(speedDelta * (1 - 0.2718)));
			}

			if (!keyStates['KeyA'] && !keyStates['KeyD']) {
				playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
			}

		} else if (keyStates['KeyS']) {
			if (keyStates['KeyA']) {
				playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta * (1 - 0.2718)));
				playerVelocity.add(getSideVector().multiplyScalar(-speedDelta * (1 - 0.2718)));
			}

			if (keyStates['KeyD']) {
				playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta * (1 - 0.2718)));
				playerVelocity.add(getSideVector().multiplyScalar(speedDelta * (1 - 0.2718)));
			}

			if (!keyStates['KeyA'] && !keyStates['KeyD']) {
				playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
			}
		} else if (keyStates['KeyA']) {
			if (!keyStates['KeyD']) {
				playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
			}
		} else if (keyStates['KeyD']) {
			playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
		}
	}
}

function shooting() {
	if (mouse_states[0]) {
		if (carrot_blaster_debounce && carrot_blaster_alt_charge < 100) {
			carrot_blaster_debounce = false

			fire()
		}
	} else if (mouse_states[2]) {
		if (carrot_blaster_alt_debounce) {
			if (carrot_blaster_alt_charge < 100) {
				carrot_blaster_alt_charge += 0.25
				carrot_blaster_charge();
			}
		}
	}
}

function teleportPlayerIfOob() {
	if (camera.position.y <= - 25) {
		playerCollider.start.set(0, 0.35, 0);
		playerCollider.end.set(0, 1, 0);
		camera.position.copy(playerCollider.end);
		camera.rotation.set(0, 0, 0);
	}
}

function regen_stamina() {
	if (!sliding) {
		if (stamina < 3) {
			stamina += 0.002
			update_stamina()
		}
	}
}

loader.setPath('/static/resources/models/maps/');
loader.load('map_3_5.glb', (gltf) => {
	scene.add(gltf.scene);

	worldOctree.fromGraphNode(gltf.scene);

	/*
	gltf.scene.traverse(child => {
		if (child.isMesh) {
			child.castShadow = true;
			child.receiveShadow = true;

			if (child.material.map) {
				child.material.map.anisotropy = 4;
			}
		}
	});
	*/
});

let mixer
let animation
loader.setPath('/static/resources/models/weapons/')
loader.load('carrot_blaster_joined_but_anim.glb', (gltf) => {
	carrot_blaster_model = gltf.scene
	carrot_blaster_model.scale.setScalar(0.05)
	scene.add(carrot_blaster_model)

	mixer = new THREE.AnimationMixer(carrot_blaster_model);
	mixer.timeScale = 2
	const clip = THREE.AnimationClip.findByName(gltf.animations, 'Recoil')
	animation = mixer.clipAction(clip)
	animation.setLoop(THREE.LoopOnce);

	animate();
})

function update_gun_position() {
	if (carrot_blaster_model) {
		carrot_blaster_model.position.copy(camera.position)
		carrot_blaster_model.translateX(0.2)
		carrot_blaster_model.translateY(-0.1)
		carrot_blaster_model.translateZ(-0.3)
		carrot_blaster_model.setRotationFromEuler(camera.rotation)
	}
}

function animate() {
	// Gets time each time the animate function is called clock.getDelta()
	// if clock.getDelta() is lower than 0.05, then it will be divided by STEPS_PER_FRAME instead of 0.05
	const delta_time = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

	// we look for collisions in substeps to mitigate the risk of
	// an object traversing another too quickly for detection.

	for (let i = 0; i < STEPS_PER_FRAME; i++) {
		controls(delta_time);
		updatePlayer(delta_time);
		update_enemies(delta_time);
		updateSpheres(delta_time);

		shooting()
		teleportPlayerIfOob();
		regen_stamina();
		update_gun_position();
		mixer.update(delta_time)
	}

	renderer.render(scene, camera);
	stats.update();
	requestAnimationFrame(animate);
}