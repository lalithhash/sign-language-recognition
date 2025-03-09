import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';

// Initialize Touch SDK Watch
const watch = new TouchSDK.Watch();

// Create a connect button for the smartwatch only once
const connectButton = watch.createConnectButton();
connectButton.innerHTML = "Connect"; // Change button text to "Connect"
const connectSection = document.getElementById('connect-section');

// Ensure the button is only appended once, to prevent duplication
if (connectSection && !connectSection.contains(connectButton)) {
    connectSection.appendChild(connectButton);
}

// Sequence length and buffer for sensor data
const sequenceLength = 130;
let sensorDataBuffer = [];
let isCollectingData = true;

// Object to store sensor data
const sensorData = {
    acceleration: [0, 0, 0],
    gravity: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    orientation: [0, 0, 0, 0],
};

let startTime = null;

// Create elements to display prediction result and time taken
const predictionElement = document.getElementById('prediction-section');
const timeTakenElement = document.getElementById('time-section');

// Initialize Three.js scene for 3D model rendering
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 30, 50);
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Focus on the origin
scene.add(camera);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(720, 480);
document.getElementById('threejs-container').appendChild(renderer.domElement);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Load the 3D hand model
let handModel = null;
const loader = new GLTFLoader();
loader.load('../3dmodel/arm.glb', (gltf) => {
    handModel = gltf.scene;
    handModel.scale.set(1, 1, 1); // Adjust scale
    scene.add(handModel);
    animate(); // Start rendering
});

// Function to update hand model orientation based on sensor data
function updateHandModel() {
    if (handModel && isSensorDataValid()) {
        const [qx, qy, qz, qw] = sensorData.orientation;
        const quaternion = new THREE.Quaternion(qy, -qz, qx, -qw);
        const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');
        handModel.rotation.set(euler.x, euler.y, euler.z);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updateHandModel();
    renderer.render(scene, camera);
}

// Event Listeners for sensor data updates from Touch SDK
watch.addEventListener('accelerationchanged', (event) => {
    const { x, y, z } = event.detail;
    sensorData.acceleration = [x, y, z];
});

watch.addEventListener('angularvelocitychanged', (event) => {
    const { x, y, z } = event.detail;
    sensorData.angularVelocity = [x, y, z];
});

watch.addEventListener('gravityvectorchanged', (event) => {
    const { x, y, z } = event.detail;
    sensorData.gravity = [x, y, z];
});

watch.addEventListener('orientationchanged', (event) => {
    const { x, y, z, w } = event.detail;
    sensorData.orientation = [x, y, z, w];
});

// Function to check if all sensor data values are valid (non-zero)
function isSensorDataValid() {
    const allData = [
        ...sensorData.acceleration,
        ...sensorData.gravity,
        ...sensorData.angularVelocity,
        ...sensorData.orientation
    ];
    return allData.every(value => value !== 0);
}

// Accumulate sensor data into a buffer for prediction
function accumulateSensorData() {
    if (!isCollectingData || !isSensorDataValid()) return;

    if (sensorDataBuffer.length === 0) {
        startTime = Date.now();
    }

    const structuredData = [
        ...sensorData.acceleration,
        ...sensorData.gravity,
        ...sensorData.angularVelocity,
        ...sensorData.orientation.slice(0, 3) // Use only x, y, z of orientation
    ];

    sensorDataBuffer.push(structuredData);

    if (sensorDataBuffer.length >= sequenceLength) {
        isCollectingData = false;
        const timeTaken = (Date.now() - startTime) / 1000;
        timeTakenElement.innerHTML = `Time: ${timeTaken.toFixed(2)}s`;

        sendDataToFlask(sensorDataBuffer.slice(0, sequenceLength));
        sensorDataBuffer = [];
        setTimeout(() => { isCollectingData = true; }, 1000);
    }
}

// Send sensor data to Flask API for prediction
async function sendDataToFlask(dataToSend) {
    try {
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_data: dataToSend.flat() })
        });

        const data = await response.json();
        predictionElement.innerHTML = data.prediction ? `Prediction: ${data.prediction}` : `Error: ${data.error}`;
    } catch (error) {
        predictionElement.innerHTML = `Error: ${error.message}`;
    }
}

// Start accumulating sensor data every 20ms
setInterval(accumulateSensorData, 20);
