FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY frontend/src/ ./frontend/

EXPOSE 5000

CMD ["gunicorn", "app:app", "--workers", "2", "--bind", "0.0.0.0:5000", "--timeout", "120", "--access-logfile", "-"]
