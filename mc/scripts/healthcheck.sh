#!/bin/bash
if nc -z localhost 25565; then
  echo "OK"
else
  echo "DOWN"
fi
