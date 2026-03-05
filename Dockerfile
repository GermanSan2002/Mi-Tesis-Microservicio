# Usa la última versión de Node.js
FROM node:20

# Crea un usuario no root para mejorar la seguridad
RUN useradd -ms /bin/bash appuser
USER appuser

# Establece el directorio de trabajo
WORKDIR /app

# Copia el archivo package.json y package-lock.json
COPY --chown=appuser:appuser package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de la aplicación
COPY --chown=appuser:appuser . .

# Compila el proyecto
RUN npm run build

# Expone el puerto en el que correrá la aplicación
EXPOSE 3000

# El CMD por defecto.
CMD ["npm", "run", "start:prod"]