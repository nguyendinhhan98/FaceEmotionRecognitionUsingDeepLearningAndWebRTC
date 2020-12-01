if (location.href.substr(0, 5) !== "https")
  location.href = "https" + location.href.substr(4, location.href.length - 4);

const socket = io();

let urlAIServer = "http://127.0.0.1:8080/";

const socketModel = io(urlAIServer);

let producer = null;
let isHost = false;
nameInput.value = "nguoi_dung_" + new Date().getTime();

window.onbeforeunload = () => {
  resetDataEmotion();
};

var options = {
  series: [],
  animations: {
    enabled: true,
    easing: "easeinout",
    speed: 800,
    animateGradually: {
      enabled: true,
      delay: 150,
    },
    dynamicAnimation: {
      enabled: true,
      speed: 350,
    },
  },
  noData: {
    text: "Loading...",
  },
  chart: {
    type: "bar",
    height: 350,
    stacked: true,
    stackType: "100%",
  },
  plotOptions: {
    bar: {
      horizontal: true,
    },
  },
  stroke: {
    width: 1,
    colors: ["#fff"],
  },
  title: {
    text: "Emotion of user(Realtime)",
  },
  tooltip: {
    y: {
      formatter: function (val) {
        return val + " Times";
      },
    },
  },
  fill: {
    opacity: 1,
  },
  legend: {
    position: "top",
    horizontalAlign: "left",
    offsetX: 40,
  },
};

let chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();

function getListEmotion() {
  setInterval(() => {
    $.ajax({
      url: urlAIServer + "get-list-emotion",
    }).done((res) => {
      if (res) {
        let series = [
          {
            name: "Angry",
            data: [],
          },
          {
            name: "Disgust",
            data: [],
          },
          {
            name: "Happy",
            data: [],
          },
          {
            name: "Neutral",
            data: [],
          },
          {
            name: "Sad",
            data: [],
          },
          {
            name: "Scared",
            data: [],
          },
          {
            name: "Surprised",
            data: [],
          },
        ];
        let categories = [];
        res.forEach((e) => {
          series[0].data.push(e.angry);
          series[1].data.push(e.disgust);
          series[2].data.push(e.happy);
          series[3].data.push(e.neutral);
          series[4].data.push(e.sad);
          series[5].data.push(e.scared);
          series[6].data.push(e.surprised);
          categories.push(e.id);
        });
        console.log(categories);
        console.log(series);
        chart.updateOptions({
          xaxis: {
            categories,
          },
        });
        chart.updateSeries(series);
      }
    });
  }, 3000);
}

function resetDataEmotion() {
  $.ajax({
    url: urlAIServer + "reset-data",
  }).done(() => {
    console.log("Đã reset dữ liệu");
  });
}

window.open(urlAIServer);
$("#is-host").hide();
// socketModel.emit("send name", nameInput.value);

socket.request = function request(type, data = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(type, data, (data) => {
      if (data.error) {
        reject(data.error);
      } else {
        resolve(data);
      }
    });
  });
};

let rc = null; // Rc is room client

function joinRoom(name, room_id) {
  if (rc && rc.isOpen()) {
    console.log("already connected to a room");
  } else {
    rc = new RoomClient(
      localMedia,
      remoteVideos,
      remoteAudios,
      window.mediasoupClient,
      socket,
      room_id,
      name,
      roomOpen
    );
    $("#username").text(name);
    addListeners();
  }
}

function createRoom(name, room_id) {
  if (rc && rc.isOpen()) {
    console.log("already connected to a room");
  } else {
    rc = new RoomClient(
      localMedia,
      remoteVideos,
      remoteAudios,
      window.mediasoupClient,
      socket,
      room_id,
      name,
      roomOpen
    );
    $("#username").text(name);
    addListeners();
  }
  isHost = true;
  getListEmotion();
}

function roomOpen() {
  reveal("#localStream");
  reveal("#serverInfo");
  hide("#login");
  if (isHost) {
    reveal("#chart");
    reveal("#resetData");
  } else {
    hide("#chart");
    hide("resetData");
  }
  reveal("#startAudioButton");
  hide("#stopAudioButton");
  reveal("#startVideoButton");
  hide("#stopVideoButton");
  reveal("#startScreenButton");
  hide("#stopScreenButton");
  reveal("#exitButton");
  reveal("#control");
  reveal("#videoMedia");
}

function hide(elem) {
  $(elem).hide();
}

function reveal(elem) {
  $(elem).show();
}

const constrants = {
  video: true,
  audio: true,
};

function addListeners() {
  socket.on("serverInfo", (data) => {
    $("#serverInfo").text(
      `CPU Core: ${data.cpuCount}, CPU usage: ${data.cpu}%, Ram: ${
        data.memoryInfo.usedMemMb
      }Mb/${data.memoryInfo.totalMemMb}Mb(${
        Math.round(
          (100 - data.memoryInfo.freeMemPercentage) * 100 + Number.EPSILON
        ) / 100
      }%)`
    );
  });

  rc.on(RoomClient.EVENTS.startScreen, () => {
    hide(startScreenButton);
    reveal(stopScreenButton);
  });

  rc.on(RoomClient.EVENTS.stopScreen, () => {
    hide(stopScreenButton);
    reveal(startScreenButton);
  });

  rc.on(RoomClient.EVENTS.stopAudio, () => {
    hide(stopAudioButton);
    reveal(startAudioButton);
  });
  rc.on(RoomClient.EVENTS.startAudio, () => {
    hide(startAudioButton);
    reveal(stopAudioButton);
  });

  rc.on(RoomClient.EVENTS.startVideo, () => {
    console.log("Chủ phòng?", isHost);
    if (!isHost) {
      $("#is-host").hide();
      navigator.mediaDevices.getUserMedia(constrants).then((stream) => {
        record(stream);
      });
    } else {
      $("#is-host").show();
    }
    hide(startVideoButton);
    reveal(stopVideoButton);
  });

  function record(stream) {
    console.log(stream);
    let options = { mimeType: "video/webm;codecs=vp9" };
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = function (result) {
      if (result.data && result.data.size > 0) {
        var blob = result.data;
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          var base64 = reader.result;
          // console.log("base64", base64);
          //split and get string base64 after comma
          var dataPath = base64.split(",");
          var lastData = dataPath[dataPath.length - 1];
          // console.log("dataPath", dataPath);
          //emit to server

          mediaRecorder.onstop = function () {
            socketModel.emit("my event", {
              data: lastData,
              id: nameInput.value,
            });
          };
        };
      }
      mediaRecorder.start();
    };
    mediaRecorder.start();
    mediaRecorder.onstart = function (event) {
      setTimeout(function () {
        mediaRecorder.stop();
      }, 1000);
    };
  }

  socketModel.on("my response", (data) => {
    console.log("emotion face :", data);
  });

  rc.on(RoomClient.EVENTS.stopVideo, () => {
    hide(stopVideoButton);
    reveal(startVideoButton);
  });
  rc.on(RoomClient.EVENTS.exitRoom, () => {
    hide("#control");
    hide("#chart");
    hide("#resetData");
    reveal("#login");
    hide("#videoMedia");
    hide("#localStream");
    hide("#serverInfo");
  });
}

// Load mediaDevice options
navigator.mediaDevices.enumerateDevices().then((devices) =>
  devices.forEach((device) => {
    let el = null;
    if ("audioinput" === device.kind) {
      el = audioSelect;
    } else if ("videoinput" === device.kind) {
      el = videoSelect;
    }
    if (!el) return;

    let option = document.createElement("option");
    option.value = device.deviceId;
    option.innerText = device.label;
    el.appendChild(option);
  })
);
