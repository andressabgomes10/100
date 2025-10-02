# Dockerfile simplificado para Railway
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache git

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

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Mudar propriedade dos arquivos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expor porta
EXPOSE 3001

# Comando de start
CMD ["npm", "start"]
