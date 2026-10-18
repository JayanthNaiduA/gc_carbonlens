# Build/pull/deployment are separate approval-required operations.
FROM python:3.11-slim
WORKDIR /srv/carbonlens
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && useradd --system --uid 10001 carbonlens
COPY app ./app
USER carbonlens
EXPOSE 8080
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 1 --threads 4 app.main:application"]
