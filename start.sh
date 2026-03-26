#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# Create drafts directory if needed
mkdir -p drafts

# Start the app
echo "Starting Viamed Newsletter Builder at http://localhost:5001"
python app.py
