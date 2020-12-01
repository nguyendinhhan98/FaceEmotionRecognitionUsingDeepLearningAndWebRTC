from flask import Flask, render_template, Response, redirect, url_for, jsonify
from flask_socketio import SocketIO, emit, send, join_room, leave_room
import uuid
from keras.preprocessing.image import img_to_array
import imutils
import cv2
from keras.models import load_model
import numpy as np
import json
import base64
from io import StringIO
from flask_uuid import FlaskUUID
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

FeelingList = []


@socketio.on("my event")
def handle_my_custom_event(data):
    data = json.dumps(data)
    data = json.loads(data)
    # print(data)
    strB64 = data["data"]

    # print("strB64", strB64)
    # test camera video
    fh = open("test-data.mp4", "wb")
    fh.write(base64.b64decode(strB64))
    fh.close()

    #************Model**********************#
    # parameters for loading data and images
    detection_model_path = 'haarcascade/haarcascade_frontalface_default.xml'

    # pre-trained model
    emotion_model_path = 'pretrained_models/cnn.hdf5'
    # hyper-parameters for bounding boxes shape
    # loading models
    face_detection = cv2.CascadeClassifier(detection_model_path)
    emotion_classifier = load_model(emotion_model_path, compile=False)
    EMOTIONS = ["angry", "disgust", "scared", "happy", "sad", "surprised",
                "neutral"]
    try:
        camera = cv2.VideoCapture('test-data.mp4')
    except:
        print("khong doc duoc video!")
    if (camera.isOpened() == False):
        print("Error opening video stream or file")

    while (camera.isOpened()):
        ret, frame = camera.read()
        # reading the frame
        if ret == True:
            frame = imutils.resize(frame, width=800)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_detection.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30), flags=cv2.CASCADE_SCALE_IMAGE)

            # canvas = np.zeros((250, 300, 3), dtype="uint8")
            frameClone = frame.copy()
            if len(faces) > 0:
                faces = sorted(faces, reverse=True,
                               key=lambda x: (x[2] - x[0]) * (x[3] - x[1]))[0]
                (X, Y, W, H) = faces

                # Extract the facial key point of the face from the grayscale image, resize it to a fixed 64x64 pixels(pre-trained model shape)
                # the facial for classification via the CNN
                facial = gray[Y:Y + H, X:X + W]
                facial = cv2.resize(facial, (64, 64))
                facial = facial.astype("float") / 255.0
                facial = img_to_array(facial)
                facial = np.expand_dims(facial, axis=0)

                # ti le cua cam xuc
                preds = emotion_classifier.predict(facial)[0]
                # lay ra ti le cam xuc lon nhat
                emotion_probability = np.max(preds)
                # lay ra ten cua cam xuc lon nhat
                label = EMOTIONS[preds.argmax()]

                #socketio.emit("list-emotion", {"msg": request.sid })

                id = data["id"]
                global FeelingList

                # Kiem tra ton tai id nay trong Feeling list chua
                isIncluded = False
                for fl in FeelingList:
                    # Kiem tra bang id
                    if fl["id"] == id:
                        isIncluded = True
                        # Co roi thi tang gia tri da nhan dien duoc
                        fl[label] += 1
                        break

                # Chua co thi add vao
                if(isIncluded == False):
                    Feeling_add = {"id": id, "angry": 0, "disgust": 0, "scared": 0, "happy": 0,
                                   "sad": 0, "surprised": 0, "neutral": 0}
                    Feeling_add[label] += 1

                    FeelingList.append(Feeling_add)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        else:
            break

    camera.release()
    cv2.destroyAllWindows()

#****************************************#


@app.route('/', methods=['GET'])
def home():
    return "<h1>Connected to Face detect server is ok</h1>"


@app.route('/get-list-emotion', methods=['GET'])
def api_all():
    return jsonify(FeelingList)


@app.route('/reset-data', methods=['GET'])
def reset_data():
    global FeelingList
    FeelingList = []
    return jsonify("ok")


if __name__ == '__main__':
    socketio.run(app, host="127.0.0.1", port=8080, debug=True)
