$(document).ready(function () {
  const socket = io.connect("http://localhost:3000");
  var myPeer = new Peer();
  let roomID = document.getElementById("getID").innerHTML;

  socket.on("connect", () => {
    console.log("User has connected!");
    // socket.send("User has connected!");
  });

  const constrants = {
    video: true,
    audio: false,
  };

  const localVideo = document.createElement("video");
  const videoGrid = document.getElementById("video-grid");
  let localStream;
  function gotLocalmediaStream(stream) {
    localStream = stream;
    addVideoStream(localVideo, stream);

    myPeer.on("call", (call) => {
      console.log("calllllllllllllllllllllll");
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (peerID) => {
      console.log("new user!");
      connectToNewUser(peerID, stream);
    });
  }

  myPeer.on("open", function (id) {
    console.log("myPeerID: " + id);
    console.log("roomID: " + roomID);
    socket.emit("join", roomID, id);
  });

  function handleLocalMediaStream(error) {
    console.log("error accessing media devices", error);
  }

  function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
    videoGrid.append(video);
    record(stream);
  }

  function connectToNewUser(peerID, stream) {
    const call = myPeer.call(peerID, stream);
    console.log("connectToNewUser");
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });

    // call.on("close", () => {
    //   video.remove();
    // });
  }

  navigator.mediaDevices
    .getUserMedia(constrants)
    .then(gotLocalmediaStream)
    .catch(handleLocalMediaStream);

  // let recordedChunks;
  function record(stream) {
    let options = { mimeType: "video/webm;codecs=vp9" };
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = function (result) {
      if (result.data && result.data.size > 0) {
        // recordedChunks.push(blob.data);
        blob = result.data;
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          var base64 = reader.result;
          //split and get string base64 after comma
          var dataPath = base64.split(",")[1];
          //emit to server
          mediaRecorder.onstop = function () {
            socket.emit("my event", {
              data: dataPath,
            });
          };
          // console.log("emitted, waiting for response");
        };
      }
      // const superBuffer = new Blob(recordedChunks, { type: "video/webm" });
      // console.log("superBuffer", superBuffer);

      mediaRecorder.start();
    };
    mediaRecorder.start();
    mediaRecorder.onstart = function (event) {
      setTimeout(function () {
        mediaRecorder.stop();
      }, 1000);
    };
  }

  socket.on("my response", (data) => {
    console.log(data);
  });

  let text = $("input");

  $("html").keydown((e) => {
    if (e.which == 13 && text.val().length !== 0) {
      console.log(text.val());
      socket.emit("message", text.val(), roomID);
      text.val("");
    }
  });

  socket.on("show-message", (msg) => {
    $("ul").append(`<li class="message"><b>user</b>${msg}</li>`);
  });
});
