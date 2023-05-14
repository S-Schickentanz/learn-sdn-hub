import React from "react";
import Guacamole from "guacamole-common-js";
import createWebSocket from '../api/WebSocket'

interface GuacamoleClientProps {
  wsEndpoint: string;
}

export default class GuacamoleClient extends React.Component<GuacamoleClientProps> {
    private websocket!: WebSocket;
    // TODO: Get the full url from the websocket
    // Hijack the websocket from guacamole for test purposes for now
    private websocketUrl: string = "";
    private guacaClient!: Guacamole.Client;
  
    constructor(props: GuacamoleClientProps) {
      super(props);
      //this.websocket = createWebSocket(this.props.wsEndpoint);
    }
  
    componentDidMount() {
      /*this.websocket.onopen = (e) => {
        if ((e.target as WebSocket).readyState !== WebSocket.OPEN) return;
        this.websocket.send(`auth ${localStorage.getItem("token")}`);
      }*/
      this.guacaClient = new Guacamole.Client(
        new Guacamole.WebSocketTunnel(this.websocketUrl)
      );

      document.getElementById("guacContainer")!.appendChild(this.guacaClient.getDisplay().getElement());

      this.guacaClient.onerror = function (error) {
        alert(error);
      }

      // TODO: Still tries to connect even after failure
      this.guacaClient.connect();
    }
  
    componentWillUnmount() {
      console.log("GuacamoleClient will unmount...")
      //this.websocket.close()
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