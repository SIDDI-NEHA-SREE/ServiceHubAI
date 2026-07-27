import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # thread_id -> Set of active WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # user_id -> Set of active WebSocket connections (for push notifications)
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        # Track online user_ids
        self.online_users: Set[str] = set()

    async def connect(self, websocket: WebSocket, thread_id: str, user_id: str):
        await websocket.accept()
        if thread_id not in self.active_connections:
            self.active_connections[thread_id] = set()
        self.active_connections[thread_id].add(websocket)

        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

        self.online_users.add(user_id)
        logger.info(f"WebSocket connected: User {user_id} in Thread {thread_id}")

        # Broadcast presence
        await self.broadcast_to_thread(thread_id, {
            "event_type": "PRESENCE_UPDATE",
            "thread_id": thread_id,
            "data": {"user_id": user_id, "is_online": True}
        })

    def disconnect(self, websocket: WebSocket, thread_id: str, user_id: str):
        if thread_id in self.active_connections:
            self.active_connections[thread_id].discard(websocket)
            if not self.active_connections[thread_id]:
                del self.active_connections[thread_id]

        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
                self.online_users.discard(user_id)

        logger.info(f"WebSocket disconnected: User {user_id} from Thread {thread_id}")

    async def broadcast_to_thread(self, thread_id: str, message: dict):
        if thread_id in self.active_connections:
            payload = json.dumps(message)
            disconnected = set()
            for connection in self.active_connections[thread_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    disconnected.add(connection)
            for dead in disconnected:
                self.active_connections[thread_id].discard(dead)

    async def send_user_notification(self, user_id: str, notification: dict):
        if user_id in self.user_connections:
            payload = json.dumps({
                "event_type": "NOTIFICATION",
                "data": notification
            })
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    pass


ws_manager = ConnectionManager()
