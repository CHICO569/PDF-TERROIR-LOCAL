FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies: omniORB, Tesseract OCR, Python3, and required libraries
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    omniorb \
    omniidl \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Make omniORB Python bindings visible (package installed by apt in system dist-packages)
ENV PYTHONPATH="/usr/lib/python3/dist-packages:/usr/lib/python3.*/dist-packages"

# Copy source code
COPY . /app

# Make start script executable
RUN chmod +x /app/start.sh

# Expose Flask port
EXPOSE 3001
# Expose omniNames port
EXPOSE 2809

CMD ["/bin/bash","-lc","/app/start.sh"]

