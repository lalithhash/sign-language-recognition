import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';

const watch = new TouchSDK.Watch();

// Create a connect button for the smartwatch
const connectButton = watch.createConnectButton();
document.body.appendChild(connectButton);

const sequenceLength = 120; // Number of samples needed for prediction
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

// Create elements for header, prediction, and time taken
const headerElement = document.createElement('div');
headerElement.id = 'header';
headerElement.innerHTML = "REAL TIME GESTURE TRACKING";
document.body.appendChild(headerElement);

const predictionElement = document.createElement('div');
predictionElement.id = 'prediction';
document.body.appendChild(predictionElement);

const timeTakenElement = document.createElement('div');
timeTakenElement.id = 'timeTaken';
document.body.appendChild(timeTakenElement);

// Style the UI
document.body.style.margin = "0";
document.body.style.height = "100vh";
document.body.style.background = "##dee1e2";
document.body.style.color = "#ffffff";
document.body.style.fontFamily = "'Poppins', sans-serif";
// document.body.style.display = "grid";
document.body.style.gridTemplateColumns = "1fr  auto 1fr"; // Layout: Left, Center (Model), Right
document.body.style.gridTemplateRows = "auto 1fr auto"; // Rows for header, model, footer
document.body.style.gridTemplateAreas = `
    "header header header"
    ". model ."
    "footer footer footer"
`;
document.body.style.gap = "10px";
document.body.style.padding = "10px";
document.body.style.marginTop = "10px";

// Style the header
headerElement.style.gridArea = "header";
headerElement.style.display = "flex";
headerElement.style.justifyContent = "space-between";
headerElement.style.alignItems = "center";
headerElement.style.fontSize = "35px";
headerElement.style.fontWeight = "bold";
headerElement.style.marginLeft = "10px";
headerElement.style.marginRight = "10px";
headerElement.style.color = "#333";
headerElement.style.marginLeft = "550px"
// headerElement.style.marginTop = "70px";


// Style the connect button
connectButton.style.gridArea = "header";
connectButton.style.width = "250px";
connectButton.style.marginLeft = "1200px";

connectButton.style.padding = "10px 20px";
connectButton.style.borderRadius = "20px";
connectButton.style.border = "none";
/// connectButton.style.gridTemplateColumns = "1fr "; // Layout: Left, Center (Model), Right
// connectButton.style.gridTemplateRows = "auto 1fr auto"; 
connectButton.style.cursor = "pointer";
connectButton.style.color = "#ffffff";
connectButton.style.fontSize = "14px";
connectButton.style.font = "Poppins";
connectButton.style.marginTop = "70px";
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

predictionElement.style.padding = "10px";
predictionElement.style.textAlign = "center";
predictionElement.style.borderRadius = "20px"; // Adjusted to match the rounder style in the image
predictionElement.style.background = "linear-gradient(90deg, #0072ff, #a200ff)"; // Blue to Magenta gradient
predictionElement.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.25)";
predictionElement.style.color = "white"; // To match the white text in the image
predictionElement.style.fontSize = "18px";
predictionElement.style.fontFamily = "Poppins, sans-serif";
predictionElement.innerHTML = "Prediction will appear here";



// Style for the time taken element
timeTakenElement.style.padding = "10px"; // Adjusted padding for better proportions
timeTakenElement.style.textAlign = "center";
timeTakenElement.style.borderRadius = "50px"; // Increased for more pronounced curve
// timeTakenElement.style.background = "transparent"; // Transparent background for the outlined effect
timeTakenElement.style.background = "linear-gradient(90deg, #0072ff, #a200ff)";
// timeTakenElement.style.border = "2px solid transparent"; // Transparent border to highlight the gradient effect
timeTakenElement.style.borderImage = "linear-gradient(90deg, #0072ff, #a200ff) 1"; // Gradient border
timeTakenElement.style.fontSize = "18px";
// timeTakenElement.style.color = "rgba(0, 114, 255, 1)"; // Blue color for the text
timeTakenElement.style.color = "white";
timeTakenElement.style.fontFamily = "Poppins, sans-serif";
timeTakenElement.style.marginTop = "5px";
timeTakenElement.innerHTML = "Gesture time will appear here";


// Create the 3D canvas container (Renderer)
const threeCanvasContainer = document.createElement('div');
threeCanvasContainer.style.maxWidth = "1050px"; // Retain original size
threeCanvasContainer.style.height = "500px";
threeCanvasContainer.style.margin = "0 auto";
threeCanvasContainer.style.padding = "5px";
threeCanvasContainer.style.background = "black";
threeCanvasContainer.style.borderRadius = "20px";
threeCanvasContainer.style.boxShadow = "0 0px 12px rgba(128, 128, 128, 0.8)";
threeCanvasContainer.style.gridArea = "model"; // Grid area for renderer (center)
threeCanvasContainer.style.marginTop = "25px";
threeCanvasContainer.style.display = "grid";
document.body.appendChild(threeCanvasContainer);


// Style for footer elements (prediction and time)
const footerContainer = document.createElement('div');
footerContainer.style.gridArea = "footer";
footerContainer.style.display = "flex";
footerContainer.style.fontFamily = "Poppins";
footerContainer.style.justifyContent = "space-around";
footerContainer.style.alignItems = "center";
footerContainer.style.marginTop = "10px";
footerContainer.appendChild(timeTakenElement);
footerContainer.appendChild(predictionElement);
document.body.appendChild(footerContainer);

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 30, 50); // Position the camera
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Focus on the origin
scene.add(camera);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(1000, 480); // Retain original size
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
    if (text.trim() && text !== "No gesture") {
        if ('speechSynthesis' in window) {
            try {
                speechSynthesis.cancel(); // Stop any ongoing speech
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.pitch = 1; // Customize pitch
                utterance.rate = 1;  // Customize rate
                speechSynthesis.speak(utterance);
            } catch (error) {
                console.error("Speech synthesis failed:", error);
            }
        } else {
            console.warn("Speech synthesis not supported in this browser.");
        }
    }
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
        predictionElement.innerHTML = data.prediction ? `Prediction: ${data.prediction}` : `Error: ${data.error}`;
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
