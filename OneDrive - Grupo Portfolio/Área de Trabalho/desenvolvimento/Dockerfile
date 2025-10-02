# Dockerfile para Railway
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build do projeto
RUN npm run build

# Expor porta
EXPOSE 3001

# Comando de start
CMD ["npm", "start"]
