const socket = new JsSIP.WebSocketInterface('wss://asteriskDomain/ws');
const configuration = {
  sockets  : [ socket ],
  uri      : 'sip:user@asteriskDomain.com',
  password : 'password'
};

let ua = new JsSIP.UA(configuration);

ua.start();

// Register callbacks to desired call events
let eventHandlers = {
  progress: (e) => {
    console.log('call is in progress');
  },
  failed: (e) => {
    console.log(`call failed with cause: ${e.data.cause}`);
  },
  ended: (e) => {
    console.log(`call ended with cause: ${e.data.cause}`);
  },
  confirmed: (e) => {
    console.log('call confirmed');
  }
};

let options = {
  eventHandlers,
  mediaConstraints: {
    audio: true,
    video: false
  },
  pcConfig: {
    iceServers: [
      {
        urls: [ 'stun:stun.l.google.com:19302' ]
      }
    ]
  },
};


ua.on('newRTCSession', (data) => {

  let rtcSession = data.session;

  let audio = new Audio();

  rtcSession.on('icecandidate', (evt) => {
    console.log(`Ice Candidate: ${evt.candidate.candidate}`);
  })

  let _attachPCListeners = (pc) => {
    pc.addEventListener('addstream', (event) => {
      let stream = event.stream;
      // Play the remote stream.
      audio.srcObject = stream;
      audio.play();
    });

    pc.addEventListener('track', (event) => {
      let track = event.track;
      let stream = new MediaStream();

      stream.addTrack(track);

      // Play the remote stream.
      audio.srcObject = stream;
      audio.play();
    });
  };

  if (rtcSession._connection) {
    _attachPCListeners(rtcSession._connection);
  }
  else {
    rtcSession.on('peerconnection', (data) => {
      let pc = data.peerconnection;
      _attachPCListeners(pc);
    });
  }
});

ua.on('registered', () => {
  window.session = ua.call(`sip:endpoint@asteriskDomain`, options);
});