#!/bin/bash
cd "$(dirname "$0")/.."

echo "[START] Minecraft server starting..."
java -Xms2G -Xmx4G -jar paper.jar nogui

echo "[STOP] Minecraft server stopped."
