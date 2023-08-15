import React from "react";
import Guacamole from "guacamole-common-js";
import createWebSocket from '../api/WebSocket';

interface GuacamoleClientProps {
  wsEndpoint: string;
}

export default class GuacamoleClient extends React.Component<GuacamoleClientProps> {
  private websocket!: WebSocket;
  // TODO: Get the full url from the websocket
  // Hijack the websocket from guacamole for test purposes for now

  /*
   * https://guacamole.apache.org/doc/gug/json-auth.html
   * Token erstellt durch Daten auf dem Guacamole-Server:
   * auth.json
   * Nutzung von secret key in guacamole.properties
   * encrypt-json.sh
   * Post des Base64 encodierten JSONs an https://prona-research-project.westeurope.cloudapp.azure.com/api/tokens
   * => per data=BASE64_ENCODED_JSON
   * => urlencoded
   * => GUAC_DATA_SOURCE=json&GUAC_ID=testcon
   * => Timestamp im JSON muss aktualisiert werden (aktuell wahrsch. abgelaufen)
   * GUAC_ID => ID hinterlegt im JSON
   * MYSQL und JSON Daten sind unabhängig voneinander
   *  => Connection Data muss also extra angelegt werden in einer Config Datei
   * Ggf. in Prona ein Guacamole Admin Tab?
   * Each normal connection defined within each submitted JSON object has the following properties: id, protocol, parameters
   * Connections which share or shadow other connections use a join property instead of a protocol property, where join contains the value of the id property of the connection being joined
   * => Somit anlegen durch einen Server User (id, protocol, parameters) und dann joinen durch den Client User (id, join, parameters) ?
   */
  private websocketUrl: string = "";
  private guacaClient!: Guacamole.Client;
  private tunnel!: Guacamole.WebSocketTunnel;
  private currentScale: number = 1;

  constructor(props: GuacamoleClientProps) {
    super(props);
    //this.websocket = createWebSocket(this.props.wsEndpoint);
  }

  componentDidMount() {
    /*this.websocket.onopen = (e) => {
      if ((e.target as WebSocket).readyState !== WebSocket.OPEN) return;
      this.websocket.send(`auth ${localStorage.getItem("token")}`);
    }*/

    /*this.tunnel = new Guacamole.WebSocketTunnel(this.websocketUrl);
    this.tunnel.connect();

    this.tunnel.onstatechange = (state) => {
      console.log("Tunnel state changed: " + state);
    }

    this.tunnel.onerror = (error) => {
      console.log("Tunnel error: ");
      Guacamole.Status.Code;
      console.log(error);
    }*/

    const tunnel = new Guacamole.WebSocketTunnel(this.websocketUrl);

    this.guacaClient = new Guacamole.Client(
      tunnel
    );

    const guacDisplay = this.guacaClient.getDisplay();
    const guacElement = guacDisplay.getElement();
    document.getElementById("guacContainer")!.appendChild(guacElement);

    // TODO: Keyboard still focused on Code Editor (right side)
    let keyboard = new Guacamole.Keyboard(guacElement);

    keyboard.onkeydown = (keysym) => {
      this.guacaClient.sendKeyEvent(1, keysym);
    };

    keyboard.onkeyup = (keysym) => {
      this.guacaClient.sendKeyEvent(0, keysym);
    };

    let mouse = new Guacamole.Mouse(guacElement);

    mouse.onmousemove = (mouseState) => {
      mouseState.x = mouseState.x / this.currentScale;
      mouseState.y = mouseState.y / this.currentScale;
      this.guacaClient.sendMouseState(mouseState);
    };

    mouse.onmousedown = mouse.onmouseup = (mouseState) => {
      this.guacaClient.sendMouseState(mouseState);
    };

    this.observerForInitialResize(guacDisplay);
    // TODO: Resize on window resize

    this.guacaClient.onerror = function (error) {
      console.log(error);
      alert(error);
    }

    this.guacaClient.onstatechange = (state) => {
      console.log("Client state changed: " + state);
    }

    // TODO: Still tries to connect even after failure
    this.guacaClient.connect();
  }

  observerForInitialResize(display: Guacamole.Display) {
    var targetElement = document.getElementById("guacContainer")!.children[0];

    if (targetElement !== null) {
      // Create a new MutationObserver instance
      var observer = new MutationObserver( (mutationsList, observer) => {
        let changed = false;
        for (var mutation of mutationsList) {
          console.log(mutation);
          if (mutation.type === "attributes" && mutation.attributeName === "style") {
            if (!changed) {
              changed = true;
              var width = targetElement.clientWidth;
              this.currentScale = (document.getElementById("guacContainer")!.offsetWidth - 10) / width;
              display.scale(this.currentScale);
              observer.disconnect();
            }
          }
        }
      });

      // Configuration for the observer (watch for style attribute changes)
      var observerConfig = { attributes: true, attributeFilter: ["style"] };

      // Start observing the target element
      observer.observe(targetElement, observerConfig);
    }
  }

  componentWillUnmount() {
    console.log("GuacamoleClient will unmount...")
    //this.websocket.close()
    try {
      if (this.tunnel) this.tunnel.disconnect();
    } catch (e) {
      console.log(e);
    }
    this.guacaClient.disconnect();
  }

  render() {
    return (
      <div id="guacContainer"></div>
    );
  }
}

/*let guaca = new Guacamole.Client(new Guacamole.WebSocketTunnel(webSocketFullUrl));
guaca.onerror = function (error) {
    alert(error);
};
guaca.connect();

// Disconnect on close
window.onunload = function () {
     guaca.disconnect();
}

let display = document.getElementById("display");
display.appendChild(guaca.getDisplay().getElement());*/