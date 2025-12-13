FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "server.js"]
```

### **Archivo: `.dockerignore`**
```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
.DS_Store