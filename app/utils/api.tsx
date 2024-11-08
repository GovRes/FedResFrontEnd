import useWebSocket, { ReadyState } from "react-use-websocket";
import { useEffect } from "react";
import { WEB_SOCKET_URL, TEST_WEB_SOCKET_URL } from "@/app/constants";
const socketUrl = TEST_WEB_SOCKET_URL;

export function useSendJsonMessage({ data }: { data: object }) {
  const { readyState, sendJsonMessage, lastJsonMessage, lastMessage } =
    useWebSocket(socketUrl, { share: true });
  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];
  useEffect(() => {
    console.log("Connection Status: ", connectionStatus);
    if (readyState === ReadyState.OPEN) {
      console.log("sending message");
      sendJsonMessage(data);
      console.log("last message received", lastMessage);
    }
  }, [readyState, data]);
  return lastMessage;
}
