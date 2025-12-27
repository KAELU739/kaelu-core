#!/bin/bash
cd "$(dirname "$0")/.."

BACKUP_DIR="backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$BACKUP_DIR"

echo "[BACKUP] Saving world..."
cp -r world "$BACKUP_DIR/"
cp -r world_nether "$BACKUP_DIR/"
cp -r world_the_end "$BACKUP_DIR/"

echo "[BACKUP] Completed: $BACKUP_DIR"
