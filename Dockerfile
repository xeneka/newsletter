FROM python:3.11-slim

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias primero (cache de capas)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del proyecto
COPY . .

# Crear carpeta de borradores (persistida via volumen)
RUN mkdir -p drafts

# Puerto expuesto
EXPOSE 5001

# Arrancar con gunicorn en producción
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "app:app"]
