from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import os
import time
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

AWS_REGION = os.getenv("AWS_REGION", "ca-central-1")
S3_BUCKET = os.getenv("S3_BUCKET")

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION
)

@app.route("/", methods=["GET"])
def index():
    return "Flask backend is running!"

@app.route("/upload-video", methods=["POST"])
def upload_video():
    try:
        if "video" not in request.files:
            return jsonify({"error": "No video file provided"}), 400

        file = request.files["video"]
        filename = f"recordings/{int(time.time())}.webm"

        s3.upload_fileobj(file, S3_BUCKET, filename, ExtraArgs={"ContentType": "video/webm"})

        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{filename}"
        return jsonify({"message": "Upload successful"}), 200

    except Exception as e:
        print("Upload error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")