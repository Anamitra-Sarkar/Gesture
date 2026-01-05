# Backend Dockerfile - Production Ready for Render
FROM python:3.10-slim-bullseye

WORKDIR /app

# Upgrade pip, setuptools, and wheel first
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install system dependencies for OpenCV and MediaPipe
# Using valid packages compatible with Debian Bullseye
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs

# Expose default port (will be overridden by Render's $PORT env var)
EXPOSE 8000

# Run the application with PORT environment variable support
CMD ["python", "main.py"]
