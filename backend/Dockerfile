FROM python:3.11-slim


ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


COPY . .

RUN python download_resources.py

# make sure any "uv-cache" or reloader/cache dir under /tmp is
# writable by everyone (sticky bit)
RUN mkdir -p /tmp/uv-cache \
    && chmod 1777 /tmp/uv-cache

EXPOSE 5000

ENV FLASK_APP=main.py \
    FLASK_RUN_HOST=0.0.0.0 \
    FLASK_RUN_PORT=5000

CMD ["flask", "run"] 