from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import os
import time
import json
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

@app.route("/upload-video", methods=["POST"])
def upload_video():
    try:
        if "video" not in request.files:
            return jsonify({"error": "No video file provided"}), 400

        file = request.files["video"]
        title = request.form.get("title", "Untitled")
        description = request.form.get("description", "")

        timestamp = int(time.time())
        video_key = f"recordings/{timestamp}.webm"
        metadata_key = f"recordings/{timestamp}.json"

        # Upload video
        s3.upload_fileobj(file, S3_BUCKET, video_key, ExtraArgs={"ContentType": "video/webm"})

        # Upload metadata
        metadata = {
            "title": title,
            "description": description,
            "video_key": video_key,
            "uploaded_at": timestamp
        }
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=metadata_key,
            Body=json.dumps(metadata),
            ContentType="application/json"
        )

        # Presigned URL for immediate playback
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": S3_BUCKET, "Key": video_key},
            ExpiresIn=3600
        )

        return jsonify({"message": "Upload successful", "url": url}), 200

    except Exception as e:
        print("Upload error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/get-videos", methods=["GET"])
def get_videos():
    try:
        response = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix="recordings/")
        items = response.get("Contents", [])

        videos = []

        # Only process JSON metadata files
        json_files = [i for i in items if i["Key"].endswith(".json")]

        for json_file in json_files:
            obj = s3.get_object(Bucket=S3_BUCKET, Key=json_file["Key"])
            metadata = json.loads(obj["Body"].read().decode("utf-8"))

            video_url = s3.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": S3_BUCKET, "Key": metadata["video_key"]},
                ExpiresIn=3600
            )

            videos.append({
                "title": metadata["title"],
                "description": metadata["description"],
                "url": video_url,
                "uploaded_at": metadata["uploaded_at"]
            })

        # Sort newest first
        videos.sort(key=lambda x: x["uploaded_at"], reverse=True)

        return jsonify(videos), 200

    except Exception as e:
        print("Error fetching videos:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)