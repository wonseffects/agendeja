# 🚀 GUIA RÁPIDO DE INSTALAÇÃO

## 📦 1. Preparação no seu PC

```bash
# Instale o Node.js (versão 18 ou superior)
# Baixe em: https://nodejs.org/

# Verifique a instalação
node --version
npm --version
```

## 📁 2. Configure o Projeto

```bash
# Navegue até a pasta do projeto
cd whatsapp-bot

# Instale as dependências
npm install

# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas credenciais
# Use qualquer editor de texto (Notepad++, VSCode, etc)
```

## ⚙️ 3. Configure o .env

Abra o arquivo `.env` e edite com seus dados:

```env
DB_HOST=sql106.infinityfree.com
DB_USER=if0_40861652          # SEU USUÁRIO DO BANCO
DB_PASSWORD=SUA_SENHA          # SUA SENHA DO BANCO
DB_NAME=if0_40861652_agendamentos

LEMBRETE_ANTECEDENCIA_MINUTOS=1440
INTERVALO_VERIFICACAO_MINUTOS=30
DELAY_ENTRE_MENSAGENS=5000
MAX_MENSAGENS_POR_CICLO=10
NODE_ENV=production
```

## ▶️ 4. Execute o Bot

```bash
npm start
```

Você verá um QR Code no terminal. Escaneie com seu WhatsApp!

## 📤 5. Subir para o GitHub

```bash
# Inicialize o git (se ainda não fez)
git init

# Adicione todos os arquivos
git add .

# Commit
git commit -m "Bot WhatsApp - Sistema de Lembretes"

# Adicione o repositório remoto
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git

# Envie para o GitHub
git push -u origin main
```

## ☁️ 6. Deploy 24/7 (Railway - GRÁTIS)

1. **Acesse**: https://railway.app/
2. **Faça login** com GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Selecione** seu repositório
5. **Adicione variáveis de ambiente**:
   - Vá em **Variables**
   - Cole todo o conteúdo do seu `.env`
6. **Deploy!** 🚀

### Importante no Railway:
- O bot vai reiniciar e você precisará escanear o QR Code novamente
- Veja os logs em **Deployments** → **View Logs**
- Para ver o QR Code, aguarde o deploy e veja os logs

## 🔄 Alternativas ao Railway

### **Render** (Grátis)
1. https://render.com/
2. New → Web Service
3. Conecte GitHub
4. Adicione variáveis de ambiente
5. Deploy

### **VPS (Recomendado para produção)**
```bash
# No VPS (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone seu repo
git clone https://github.com/SEU_USUARIO/SEU_REPO.git
cd SEU_REPO

# Instale dependências
npm install

# Configure .env
nano .env

# Execute com PM2
pm2 start src/index.js --name whatsapp-bot
pm2 startup
pm2 save

# Escaneie o QR Code
pm2 logs whatsapp-bot
```

## 🧪 Testar Localmente Primeiro

Antes de fazer deploy:

1. **Teste no seu PC**:
```bash
npm start
```

2. **Escaneie o QR Code**

3. **Verifique os logs**:
   - Deve aparecer "✅ WhatsApp conectado com sucesso!"
   - "✅ Conexão com banco de dados OK"

4. **Teste com um agendamento real**:
   - Crie um agendamento no seu sistema
   - Aguarde o bot verificar (30 minutos)
   - Ou reinicie o bot para forçar verificação imediata

## 📊 Como Saber se Está Funcionando?

```sql
-- Verifique os lembretes enviados
SELECT * FROM whatsapp_notificacoes WHERE enviado = 1;

-- Veja agendamentos pendentes
SELECT a.cliente_nome, a.telefone, a.data_horario 
FROM agendamentos a
LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
WHERE a.status = 'agendado' 
  AND (wn.enviado IS NULL OR wn.enviado = 0);
```

## ⚠️ Problemas Comuns

### "Erro ao conectar no banco"
- Verifique as credenciais do `.env`
- Teste a conexão do InfinityFree (pode ter limitações)

### "QR Code não aparece"
- Use um terminal que suporte QR Code
- Windows: use Windows Terminal ou CMD
- Linux/Mac: qualquer terminal

### "Bot desconecta"
- Verifique sua internet
- Use um VPS com IP fixo (Railway/Render podem desconectar)

### "Mensagens não enviadas"
- Verifique formato do telefone no banco
- Confirme que os números existem no WhatsApp
- Veja os logs para detalhes

## 📞 Precisa de Ajuda?

1. Veja os logs detalhados
2. Consulte o README.md completo
3. Abra uma issue no GitHub

---

**Boa sorte! 🚀**
