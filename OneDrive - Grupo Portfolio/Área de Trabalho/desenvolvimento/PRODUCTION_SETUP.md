# 🚀 Configuração para Produção - Revenda Proximidade API

## 📋 Checklist de Produção

### 1. **Configuração de Ambiente**

#### Arquivo `.env` para Produção
```env
# Servidor
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Segurança
API_KEY=sua_chave_super_secreta_aqui_para_producao
CORS_ORIGINS=https://nacionalgas.com.br,https://app.minharevenda.com.br

# Rate Limiting (mais restritivo em produção)
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000

# Geocodificação (escolha um provedor)
GEO_PROVIDER=google
GEO_API_KEY=sua_chave_do_google_maps_aqui

# Timeouts (mais conservadores)
HTTP_TIMEOUT=10000
REQUEST_TIMEOUT=30000
```

#### Variáveis de Ambiente por Servidor
```bash
# Desenvolvimento
NODE_ENV=development
API_KEY=dev_key_123

# Homologação  
NODE_ENV=staging
API_KEY=staging_key_456

# Produção
NODE_ENV=production
API_KEY=prod_key_789_super_secreta
```

### 2. **Configuração do Servidor**

#### PM2 (Process Manager)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Criar arquivo ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'revenda-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

#### Nginx (Proxy Reverso)
**nginx.conf:**
```nginx
server {
    listen 80;
    server_name api.nacionalgas.com.br;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.nacionalgas.com.br;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Health Check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

### 3. **Banco de Dados**

#### Backup Automático
```bash
#!/bin/bash
# backup-revendas.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/revendas"
SOURCE_FILE="/app/db/revendas.json"

mkdir -p $BACKUP_DIR

# Backup local
cp $SOURCE_FILE "$BACKUP_DIR/revendas_$DATE.json"

# Backup para S3 (opcional)
aws s3 cp "$BACKUP_DIR/revendas_$DATE.json" s3://seu-bucket/backups/

# Manter apenas últimos 30 backups
find $BACKUP_DIR -name "revendas_*.json" -mtime +30 -delete

echo "Backup completed: revendas_$DATE.json"
```

#### Cron Job para Backup
```bash
# Adicionar ao crontab
0 2 * * * /path/to/backup-revendas.sh
```

### 4. **Monitoramento**

#### Logrotate
**/etc/logrotate.d/revenda-api:**
```
/var/log/revenda-api/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### Uptime Monitoring
```bash
# Instalar Uptime Kuma ou usar serviço externo
# Configurar alertas para:
# - Servidor down
# - Tempo de resposta > 2s
# - Taxa de erro > 5%
# - Uso de CPU > 80%
# - Uso de memória > 90%
```

### 5. **Deploy Automatizado**

#### GitHub Actions
**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /app/revenda-api
          git pull origin main
          npm ci --production
          npm run build
          pm2 reload ecosystem.config.js --env production
```

### 6. **Scripts de Deploy**

#### deploy.sh
```bash
#!/bin/bash
set -e

echo "🚀 Iniciando deploy para produção..."

# Backup atual
echo "📦 Fazendo backup..."
./backup-revendas.sh

# Pull código
echo "📥 Atualizando código..."
git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --production

# Build
echo "🔨 Fazendo build..."
npm run build

# Testes
echo "🧪 Executando testes..."
npm test

# Restart PM2
echo "🔄 Reiniciando aplicação..."
pm2 reload ecosystem.config.js --env production

# Verificar saúde
echo "🏥 Verificando saúde..."
sleep 5
curl -f http://localhost:3001/health || exit 1

echo "✅ Deploy concluído com sucesso!"
```

### 7. **Configuração de Segurança**

#### Firewall
```bash
# UFW (Ubuntu)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3001/tcp  # Bloquear acesso direto ao Node.js
ufw enable
```

#### Fail2Ban
```bash
# Instalar fail2ban
apt install fail2ban

# Configurar jail para API
echo '[revenda-api]
enabled = true
port = 443
filter = revenda-api
logpath = /var/log/nginx/access.log
maxretry = 10
bantime = 3600' >> /etc/fail2ban/jail.local
```

### 8. **Performance e Escalabilidade**

#### Redis Cache (Opcional)
```bash
# Instalar Redis
apt install redis-server

# Configurar cache de CEP
# Adicionar ao .env:
REDIS_URL=redis://localhost:6379
CACHE_TTL=86400
```

#### Load Balancer
```nginx
upstream revenda_api {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    location / {
        proxy_pass http://revenda_api;
    }
}
```

### 9. **Comandos de Deploy**

```bash
# 1. Preparar servidor
sudo apt update && sudo apt upgrade -y
sudo apt install nginx certbot python3-certbot-nginx -y

# 2. Configurar SSL
sudo certbot --nginx -d api.nacionalgas.com.br

# 3. Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Instalar PM2
sudo npm install -g pm2

# 5. Configurar PM2 para iniciar com sistema
pm2 startup
pm2 save

# 6. Deploy da aplicação
git clone https://github.com/seu-usuario/revenda-api.git
cd revenda-api
npm ci --production
npm run build

# 7. Iniciar com PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

### 10. **Verificação Pós-Deploy**

```bash
# Verificar status
pm2 status
pm2 logs revenda-api

# Testar endpoints
curl https://api.nacionalgas.com.br/health
curl -H "x-api-key: sua_chave" https://api.nacionalgas.com.br/cep/60115000

# Verificar logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 11. **Alertas e Monitoramento**

#### Configurar alertas para:
- ✅ Servidor down
- ✅ Tempo de resposta > 2s
- ✅ Taxa de erro > 5%
- ✅ Uso de CPU > 80%
- ✅ Uso de memória > 90%
- ✅ Espaço em disco < 20%
- ✅ Falhas de backup

### 12. **Rollback de Emergência**

```bash
#!/bin/bash
# rollback.sh

echo "🚨 Iniciando rollback de emergência..."

# Parar aplicação atual
pm2 stop revenda-api

# Restaurar versão anterior
git reset --hard HEAD~1

# Restaurar backup do banco
cp /backups/revendas/revendas_latest.json /app/db/revendas.json

# Rebuild e restart
npm run build
pm2 start ecosystem.config.js --env production

echo "✅ Rollback concluído!"
```

---

## 🎯 **Resumo dos Passos para Produção:**

1. **✅ Configurar variáveis de ambiente**
2. **✅ Instalar PM2 e configurar cluster**
3. **✅ Configurar Nginx com SSL**
4. **✅ Implementar backup automático**
5. **✅ Configurar monitoramento**
6. **✅ Implementar CI/CD**
7. **✅ Configurar segurança (firewall, fail2ban)**
8. **✅ Testar deploy e rollback**

**Quer que eu ajude com algum passo específico?** 🚀
