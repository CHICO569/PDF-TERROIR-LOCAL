FROM debian:12

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies: omniORB C++ package, development files, and tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    omniorb \
    omniorb-nameserver \
    omniidl \
    omniorb-idl \
    libomniorb4-dev \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    wget \
    tar \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

# Download and compile omniORBpy 4.2.5 (matching the version of omniORB in Debian 12)
RUN wget https://sourceforge.net/projects/omniorb/files/omniORBpy/omniORBpy-4.2.5/omniORBpy-4.2.5.tar.bz2/download -O omniORBpy-4.2.5.tar.bz2 \
    && tar -xvf omniORBpy-4.2.5.tar.bz2 \
    && cd omniORBpy-4.2.5 \
    && ./configure --prefix=/usr --with-omniorb=/usr PYTHON=/usr/bin/python3 \
    && make \
    && make install \
    && cd .. \
    && rm -rf omniORBpy-4.2.5* \
    && ln -s /usr/local/lib/python3.11/dist-packages/omniidl_be/python.py /usr/lib/omniidl/omniidl_be/python.py

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy source code
COPY . /app

# Make start script executable
RUN chmod +x /app/start.sh

# Expose Flask port
EXPOSE 3001
# Expose omniNames port
EXPOSE 2809

CMD ["/bin/bash","-lc","/app/start.sh"]
