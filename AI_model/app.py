from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from tensorflow.keras.models import load_model

# Load the pre-trained model
model = load_model('AI_model/model.h5')  # Update with your model's path
unique_labels = ["hello", "thank you", "no gesture","what","your","name"]

# Constants
sequence_length = 120 # Length of sequences for prediction (130 samples)

app = Flask(__name__)

# Configure CORS: Allow all origins (you can limit this to your frontend URL for security)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["POST"], "allow_headers": ["Content-Type"]}})

@app.route('/predict', methods=['POST'])
def predict():
    # Get the sensor data from the request
    data = request.get_json()

    # Validate the incoming data
    new_data = data.get('sensor_data', [])

    # Ensure we have exactly 130 samples of 12 values each
    if len(new_data) != sequence_length * 12:
        return jsonify({"error": f"Invalid data format, expected {sequence_length * 12} values, got {len(new_data)}."}), 400
    
    # Reshape the data to match the model's expected input (1, 130, 12)
    data_buffer = np.array(new_data).reshape((1, sequence_length, 12))  # (1, 130, 12)

    try:
        # Make the prediction
        prediction = model.predict(data_buffer)
        predicted_class = np.argmax(prediction, axis=1)

        # Output the predicted class
        result = unique_labels[predicted_class[0]]
        return jsonify({"prediction": result})

    except Exception as e:
        return jsonify({"error": f"Error in prediction: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)
