import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';

const watch = new TouchSDK.Watch();

// Create a connect button for the smartwatch
const connectButton = watch.createConnectButton();
document.body.appendChild(connectButton);

const sequenceLength = 100; // Number of samples needed for prediction
let sensorDataBuffer = []; // Buffer to accumulate sensor data
let isCollectingData = true; // Flag to control data collection

// Object to store sensor data
const sensorData = {
    acceleration: [0, 0, 0],
    gravity: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    orientation: [0, 0, 0, 0],
};

let startTime = null;

// Create elements to display prediction result and time taken
const predictionElement = document.createElement('div');
predictionElement.id = 'prediction';
document.body.appendChild(predictionElement);

const timeTakenElement = document.createElement('div');
timeTakenElement.id = 'timeTaken';
document.body.appendChild(timeTakenElement);

// Style the UI with the requested changes
document.body.style.margin = "0";
document.body.style.height = "100vh";
document.body.style.background = "#000000"; // Set background to black
document.body.style.color = "#ffffff";
document.body.style.fontFamily = "Arial, sans-serif";
document.body.style.display = "grid";
document.body.style.gridTemplateColumns = "1fr 1fr"; // Two columns: one for renderer and one for connect & prediction
document.body.style.gridTemplateRows = "1fr 1fr"; // First row adjusts height, second row is for time
document.body.style.gridTemplateAreas = `
    "renderer connect"
    "time prediction"
`; // Define the grid layout

document.body.style.gap = "20px"; // Add some gap between containers
document.body.style.padding = "10px"; // Padding for overall space


// Style for the connect button
connectButton.style.padding = "15px 30px";
connectButton.style.borderRadius = "30px";
connectButton.style.height="256px";
connectButton.style.border = "none";
connectButton.style.cursor = "pointer";
connectButton.style.color = "#ffffff";
connectButton.style.fontSize = "18px";
connectButton.style.background = "linear-gradient(135deg, #0f0, #0a0)";
connectButton.style.transition = "background 0.3s ease, transform 0.3s ease";
connectButton.onmouseover = () => {
    connectButton.style.background = "linear-gradient(135deg, #0a0, #050)";
    connectButton.style.transform = "scale(1.05)";
};
connectButton.onmouseout = () => {
    connectButton.style.background = "linear-gradient(135deg, #0f0, #0a0)";
    connectButton.style.transform = "scale(1)";
};

// Style for the prediction element
predictionElement.style.padding = "20px";
predictionElement.style.textAlign = "center";
predictionElement.style.borderRadius = "10px";
predictionElement.style.background = "grey";
predictionElement.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.5)";
predictionElement.style.fontSize = "24px";
predictionElement.style.fontWeight = "bold";
predictionElement.innerHTML = "Prediction will appear here";
predictionElement.style.gridArea = "prediction"; // Grid area for prediction

// Style for the time taken element
timeTakenElement.style.padding = "20px";
timeTakenElement.style.textAlign = "center";
timeTakenElement.style.borderRadius = "10px";
timeTakenElement.style.background = "linear-gradient(135deg, #0f2027, #203a43)";
timeTakenElement.style.boxShadow = "0 0 10px rgba(255, 255, 0, 0.5)";
timeTakenElement.style.fontSize = "18px";
timeTakenElement.style.fontWeight = "normal";
timeTakenElement.innerHTML = "Gesture time will appear here";
timeTakenElement.style.gridArea = "time"; // Grid area for time taken

// Create the 3D canvas container (Renderer)
const threeCanvasContainer = document.createElement('div');
threeCanvasContainer.style.maxWidth = "720px";
threeCanvasContainer.style.height = "480px";
threeCanvasContainer.style.margin = "0 auto";
threeCanvasContainer.style.padding = "15px";
threeCanvasContainer.style.background = "black";
threeCanvasContainer.style.borderRadius = "40px";
threeCanvasContainer.style.boxShadow = "0 0px 12px rgba(128, 128, 128, 0.8)";
threeCanvasContainer.style.display = "flex";
threeCanvasContainer.style.justifyContent = "center";
threeCanvasContainer.style.alignItems = "center";
threeCanvasContainer.style.gridArea = "renderer"; // Grid area for renderer (on the left)
document.body.appendChild(threeCanvasContainer);

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 30, 50);  // Position the camera
camera.lookAt(new THREE.Vector3(0, 0, 0));  // Focus on the origin
scene.add(camera);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(720, 480);
threeCanvasContainer.appendChild(renderer.domElement);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Load the hand model
let handModel = null;
const loader = new GLTFLoader();
loader.load('../3dmodel/arm.glb', (gltf) => {
    handModel = gltf.scene;

    // Reduce the hand model's size
    handModel.scale.set(1, 1, 1); // Adjust scale (reduce by 50%)
    scene.add(handModel);
    animate(); // Start rendering
});


// Update the 3D hand model's rotation
function updateHandModel() {
    if (handModel && isSensorDataValid()) {
        const [qx, qy, qz, qw] = sensorData.orientation;
        const quaternion = new THREE.Quaternion(qy, -qz, qx, -qw);
        const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');
        handModel.rotation.x = euler.x;
        handModel.rotation.y = euler.y;
        handModel.rotation.z = euler.z;
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updateHandModel();
    renderer.render(scene, camera);
}

// Event Listeners for sensor data updates
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

// Function to check if all sensor data values are non-zero
function isSensorDataValid() {
    const allData = [
        ...sensorData.acceleration,
        ...sensorData.gravity,
        ...sensorData.angularVelocity,
        ...sensorData.orientation
    ];
    return allData.every(value => value !== 0);
}

// Accumulate sensor data
function accumulateSensorData() {
    if (!isCollectingData || !isSensorDataValid()) return;

    if (sensorDataBuffer.length === 0) {
        startTime = Date.now();
    }

    const structuredData = [
        ...sensorData.acceleration,
        ...sensorData.gravity,
        ...sensorData.angularVelocity,
        ...sensorData.orientation.slice(0, 3) // x, y, z
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


    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text); // Create a speech utterance
        speechSynthesis.speak(utterance); // Speak the text
    };

// Send data to Flask API
async function sendDataToFlask(dataToSend) {
    
    try {
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_data: dataToSend.flat() })
        
        });


        const data = await response.json();
        if (data.prediction) {
            predictionElement.innerHTML = `Prediction: ${data.prediction}`;

            if(data.prediction!="no gesture") speak(data.prediction);
        } else {
            predictionElement.innerHTML = `Error: ${data.error}`;
        }
        
    } catch (error) {
        predictionElement.innerHTML = `Error: ${error.message}`;
    }
}

// Start accumulating data
setInterval(accumulateSensorData, 20);
