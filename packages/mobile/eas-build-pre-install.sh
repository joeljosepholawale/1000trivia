#!/usr/bin/env bash

# Install workspace root dependencies
echo "Installing workspace root dependencies..."
cd ../..
yarn install --frozen-lockfile

echo "Workspace dependencies installed successfully"
