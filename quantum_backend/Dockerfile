FROM node:22-alpine AS frontend-build

WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

RUN useradd --create-home --shell /usr/sbin/nologin sandboxuser

COPY quantum_backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY quantum_backend/app ./app
COPY --from=frontend-build /web/dist ./dist

USER sandboxuser

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
