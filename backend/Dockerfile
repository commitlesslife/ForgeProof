# =============================================================================
# ForgeProof AI Backend — Production Dockerfile
# Multi-stage optimized build for Python 3.11 with dlib & OpenCV
# =============================================================================

FROM python:3.11-slim as builder

# Install system dependencies required for compiling dlib and image libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /install

# Copy requirements and pre-build wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install/pkg -r requirements.txt

# =============================================================================
# Runtime Image
# =============================================================================
FROM python:3.11-slim

# Install runtime shared libraries (OpenCV & OpenGL runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libopenblas0 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install/pkg /usr/local

WORKDIR /app

# Copy application source code
COPY . /app

# Create static asset subdirectories
RUN mkdir -p /app/static/uploads /app/static/forensics /app/static/faces /app/static/samples

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

# Launch production server with multi-worker Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
