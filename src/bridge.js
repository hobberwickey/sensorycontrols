import { State } from "./js/state";

let ports = [];
let state = new State();
let sync_chain = [
  "sync_start",
  "sync_ready",
  "sync_state",
  "sync_videos",
  "sync_end",
];

let video_positions = [0, 0, 0, 0, 0, 0];

let ready = false;
let queue = [];

onconnect = function (e) {
  let port = e.ports[0];
  ports.push(port);

  port.addEventListener("message", function (e) {
    // Keep the state updated
    if (typeof e.data !== "object") {
      let msg = JSON.parse(e.data);
      let { action, updates, data } = msg;

      if (sync_chain.includes(action)) {
        console.log(action);

        if (action === "sync_start") {
          // If this is the primary port, then we just end the sync
          // and wait for the sync_ready message from the thread
          // to unqueue any other syncs
          if (data.primary) {
            return e.target.postMessage(
              JSON.stringify({
                action: "sync_end",
              }),
            );
          }

          if (!ready) {
            return queue.push(e.target);
          }

          return e.target.postMessage(
            JSON.stringify({
              action: "sync_start",
            }),
          );
        }

        if (action === "sync_ready") {
          ready = true;

          let p;
          while ((p = queue.pop())) {
            p.postMessage(
              JSON.stringify({
                action: "sync_start",
              }),
            );
          }

          return;
        }

        if (action === "sync_state") {
          return e.target.postMessage(
            JSON.stringify({
              action: "sync_state",
              updates: state,
            }),
          );
        }

        if (action === "sync_videos") {
          let { idx } = updates;

          if (state.files[idx] instanceof File) {
            e.target.postMessage(
              JSON.stringify({
                action: "sync_video",
                updates: {
                  loading: idx,
                  loading_time: video_positions[idx],
                },
              }),
            );

            e.target.postMessage(state.files[idx]);
          } else if (state.files[idx] !== null) {
            e.target.postMessage(
              JSON.stringify({
                action: "sync_media",
                updates: {
                  media: state.files[idx],
                },
                data: {
                  idx: idx,
                },
              }),
            );
          }

          return e.target.postMessage(
            JSON.stringify({
              action: "sync_videos",
              updates: { idx },
            }),
          );
        }

        if (action === "sync_end") {
          return e.target.postMessage(
            JSON.stringify({
              action: "sync_end",
            }),
          );
        }
      } else {
        state.handleUpdate(msg);
      }
    } else {
      if (state.loading !== null) {
        state.files[state.loading] = e.data;
      }
    }

    // Keep track of the ports
    let deadPorts = [];
    ports.map((p, idx) => {
      if (p !== e.target) {
        try {
          p.postMessage(e.data);
        } catch (e) {
          deadPorts.push(p);
        }
      }
    });

    ports = ports.filter((p) => deadPorts.indexOf(p) === -1);
  });

  port.start();
};
