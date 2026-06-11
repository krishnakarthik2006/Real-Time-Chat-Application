import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "../api/client";

export function useChatSocket(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return undefined;
    }

    const connection = io(SOCKET_BASE_URL, {
      auth: {
        token,
      },
    });

    setSocket(connection);

    return () => {
      connection.disconnect();
      setSocket(null);
    };
  }, [token]);

  return socket;
}
