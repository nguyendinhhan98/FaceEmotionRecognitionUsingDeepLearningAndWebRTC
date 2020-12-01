const { Server } = require("http");
const os = require("os");

module.exports = {
  listenIp: "0.0.0.0",
  // listenIp: "127.0.0.1",
  listenPort: 3000,
  sslCrt: "../ssl/cert.pem",
  sslKey: "../ssl/key.pem",

  mediasoup: {
    // Worker settings
    numWorkers: Object.keys(os.cpus()).length,
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 20000,
      logLevel: "warn",
      logTags: [
        "info",
        "ice",
        "dtls",
        "rtp",
        "srtp",
        "rtcp",
        // 'rtx',
        // 'bwe',
        // 'score',
        // 'simulcast',
        // 'svc'
      ],
    },
    // Router settings
    router: {
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
      ],
    },
    // WebRtcTransport settings
    webRtcTransport: {
      listenIps: [
        {
          // ip: "10.0.0.6",
          ip: "127.0.0.1",
          // announcedIp: "52.237.83.38" // ip cá»§a mÃ¡y chá»§
          announcedIp: "127.0.0.1",
        },
      ],
      maxIncomingBitrate: 1500000,
      initialAvailableOutgoingBitrate: 1000000,
    },
  },
};
