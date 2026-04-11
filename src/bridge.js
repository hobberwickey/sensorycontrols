import { State } from "./js/state";

let ports = [];
let state = new State();
let sync_chain = ["sync_start", "sync_state", "sync_videos", "sync_end"];

let video_positions = [0, 0, 0, 0, 0, 0];

onconnect = function (e) {
  let port = e.ports[0];
  ports.push(port);

  port.addEventListener("message", function (e) {
    // Keep the state updated
    if (typeof e.data !== "object") {
      let data = JSON.parse(e.data);
      let { action, updates } = data;

      if (sync_chain.includes(action)) {
        if (action === "sync_start") {
          e.target.postMessage(
            JSON.stringify({
              action: "sync_start",
            }),
          );

          return;
        }

        if (action === "sync_state") {
          e.target.postMessage(
            JSON.stringify({
              action: "sync_state",
              updates: state,
            }),
          );

          return;
        }

        if (action === "sync_videos") {
          let { idx } = updates;

          if (state.files[idx] instanceof File) {
            e.target.postMessage(
              JSON.stringify({
                action: "update_state",
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
                action: "update_media",
                updates: {
                  media: state.files[idx],
                },
                data: {
                  idx: idx,
                },
              }),
            );
          }

          e.target.postMessage(
            JSON.stringify({
              action: "sync_videos",
              updates: { idx },
            }),
          );

          return;
        }

        if (action === "sync_end") {
          e.target.postMessage(
            JSON.stringify({
              action: "sync_end",
            }),
          );

          return;
        }
      } else {
        console.log(data);

        state.handleUpdate(data);
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
