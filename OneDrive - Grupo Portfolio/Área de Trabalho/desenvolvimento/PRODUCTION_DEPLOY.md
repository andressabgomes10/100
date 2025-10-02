# 🚀 Deploy em Produção - Revenda Proximidade API

## 📋 Pré-requisitos

- **Node.js 18+**
- **PM2** (Process Manager)
- **Nginx** (Proxy Reverso)
- **SSL Certificate** (Let's Encrypt)
- **Git** (para deploy)

## ⚡ Deploy Rápido

### 1. **Preparar Servidor**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install nginx certbot python3-certbot-nginx git curl -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2
```

### 2. **Configurar Aplicação**

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/revenda-api.git
cd revenda-api

# Instalar dependências
npm ci --production

# Configurar ambiente
cp env.production .env
# Editar .env com suas configurações

# Build da aplicação
npm run build
```

### 3. **Configurar SSL**

```bash
# Obter certificado SSL
sudo certbot --nginx -d api.nacionalgas.com.br

# Verificar renovação automática
sudo certbot renew --dry-run
```

### 4. **Configurar Nginx**

```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/sites-available/revenda-api
sudo ln -s /etc/nginx/sites-available/revenda-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. **Iniciar Aplicação**

```bash
# Iniciar com PM2
npm run pm2:start

# Configurar PM2 para iniciar com sistema
pm2 startup
pm2 save
```

## 🔧 Comandos Úteis

### **Gerenciamento da Aplicação**
```bash
# Iniciar
npm run pm2:start

# Parar
npm run pm2:stop

# Reiniciar
npm run pm2:restart

# Recarregar (zero downtime)
npm run pm2:reload

# Ver logs
npm run pm2:logs

# Monitoramento
npm run pm2:monit
```

### **Backup e Deploy**
```bash
# Fazer backup
npm run backup

# Deploy completo
npm run deploy

# Monitoramento
npm run monitor
```

### **Docker (Alternativo)**
```bash
# Build da imagem
npm run docker:build

# Executar container
npm run docker:run

# Docker Compose
npm run docker:compose
```

## 📊 Monitoramento

### **Health Check**
```bash
curl https://api.nacionalgas.com.br/health
```

### **Estatísticas**
```bash
curl -H "x-api-key: sua_chave" https://api.nacionalgas.com.br/stats
```

### **Logs em Tempo Real**
```bash
pm2 logs revenda-api --follow
```

### **Status do Sistema**
```bash
pm2 status
pm2 monit
```

## 🔒 Segurança

### **Firewall**
```bash
# Configurar UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3001/tcp
sudo ufw enable
```

### **Fail2Ban**
```bash
# Instalar fail2ban
sudo apt install fail2ban

# Configurar para API
sudo nano /etc/fail2ban/jail.local
```

## 📈 Performance

### **Otimizações Nginx**
- Gzip habilitado
- Cache de arquivos estáticos
- Rate limiting configurado
- Headers de segurança

### **Otimizações Node.js**
- Cluster mode com PM2
- Max memory restart: 1GB
- Keep-alive connections
- Request timeouts

## 🚨 Troubleshooting

### **Aplicação não inicia**
```bash
# Verificar logs
pm2 logs revenda-api

# Verificar configuração
pm2 show revenda-api

# Verificar porta
netstat -tuln | grep :3001
```

### **Nginx não funciona**
```bash
# Verificar configuração
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log

# Recarregar configuração
sudo systemctl reload nginx
```

### **SSL não funciona**
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew

# Verificar DNS
nslookup api.nacionalgas.com.br
```

## 🔄 Backup e Restore

### **Backup Automático**
```bash
# Configurar cron job
crontab -e

# Adicionar linha:
0 2 * * * /path/to/revenda-api/backup.sh
```

### **Restore**
```bash
# Parar aplicação
pm2 stop revenda-api

# Restaurar backup
cp backups/revendas_YYYYMMDD_HHMMSS.json db/revendas.json

# Reiniciar aplicação
pm2 start revenda-api
```

## 📞 Suporte

### **Logs Importantes**
- `/var/log/nginx/access.log` - Acesso Nginx
- `/var/log/nginx/error.log` - Erros Nginx
- `pm2 logs revenda-api` - Logs da aplicação

### **Comandos de Diagnóstico**
```bash
# Status geral
npm run monitor all

# Verificar recursos
htop
df -h
free -h

# Verificar conectividade
curl -I https://api.nacionalgas.com.br/health
```

---

## 🎯 **Checklist de Produção**

- [ ] ✅ Servidor configurado (Node.js, PM2, Nginx)
- [ ] ✅ SSL configurado e funcionando
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Firewall configurado
- [ ] ✅ Backup automático configurado
- [ ] ✅ Monitoramento ativo
- [ ] ✅ Logs sendo coletados
- [ ] ✅ Health check funcionando
- [ ] ✅ Rate limiting ativo
- [ ] ✅ CORS configurado corretamente

**🎉 Sua API está pronta para produção!**
