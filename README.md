# 🤖 Bot WhatsApp - Sistema de Lembretes de Agendamentos

Bot automatizado para envio de lembretes de agendamentos via WhatsApp usando Baileys.

## 📋 Características

- ✅ Envia lembretes automáticos de agendamentos
- ✅ Suporta múltiplas empresas
- ✅ Controle de envios (evita duplicatas)
- ✅ Proteção anti-ban (delays configuráveis)
- ✅ Reconexão automática
- ✅ Logs detalhados
- ✅ Verificação de números válidos
- ✅ Mensagens personalizadas por empresa

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone seu-repositorio.git
cd whatsapp-bot
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Banco de Dados
DB_HOST=sql106.infinityfree.com
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=if0_40861652_agendamentos

# Configurações do Bot
LEMBRETE_ANTECEDENCIA_MINUTOS=1440  # 24 horas antes
INTERVALO_VERIFICACAO_MINUTOS=30     # Verifica a cada 30 minutos
DELAY_ENTRE_MENSAGENS=5000           # 5 segundos entre mensagens
MAX_MENSAGENS_POR_CICLO=10           # Máximo 10 mensagens por vez
```

## 📱 Como Usar

### 1. Inicie o bot
```bash
npm start
```

### 2. Escaneie o QR Code
- Um QR Code será exibido no terminal
- Abra o WhatsApp no celular
- Vá em **Dispositivos Conectados** → **Conectar um dispositivo**
- Escaneie o QR Code

### 3. Bot rodando!
Após conectar, o bot irá:
- Verificar agendamentos a cada 30 minutos (configurável)
- Enviar lembretes 24 horas antes (configurável)
- Marcar envios no banco para evitar duplicatas

## 🗄️ Estrutura do Banco de Dados

O bot usa as seguintes tabelas:

### `agendamentos`
- Armazena os agendamentos dos clientes
- Status deve ser 'agendado' para enviar lembrete

### `whatsapp_notificacoes`
- Controla quais lembretes já foram enviados
- Evita envios duplicados

### Queries importantes

```sql
-- Ver agendamentos pendentes de lembrete
SELECT a.*, wn.enviado 
FROM agendamentos a
LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
WHERE a.status = 'agendado' 
  AND a.data_horario > NOW()
  AND (wn.enviado IS NULL OR wn.enviado = 0);

-- Ver lembretes já enviados
SELECT * FROM whatsapp_notificacoes WHERE enviado = 1;
```

## ⚙️ Configurações Importantes

### Anti-Ban
O bot inclui proteções para evitar bloqueio:

1. **Delay entre mensagens**: 5 segundos por padrão
2. **Limite de mensagens por ciclo**: 10 por padrão
3. **Verificação de números válidos**: Apenas envia se o número existe no WhatsApp
4. **Intervalo entre verificações**: 30 minutos por padrão

### Ajuste conforme necessário:
- Muitas mensagens por dia? Aumente o `DELAY_ENTRE_MENSAGENS`
- Precisa enviar rápido? Diminua o `INTERVALO_VERIFICACAO_MINUTOS`
- Muitos agendamentos? Aumente o `MAX_MENSAGENS_POR_CICLO` (com cuidado!)

## 📂 Estrutura de Arquivos

```
whatsapp-bot/
├── src/
│   ├── index.js          # Arquivo principal
│   ├── whatsapp.js       # Lógica do WhatsApp
│   ├── database.js       # Conexão e queries do banco
│   └── utils.js          # Funções utilitárias
├── auth/                 # Sessão do WhatsApp (criada automaticamente)
├── .env                  # Variáveis de ambiente
├── .env.example          # Exemplo de configuração
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Desenvolvimento

### Modo desenvolvimento com auto-reload:
```bash
npm run dev
```

### Ver logs detalhados:
No arquivo `src/whatsapp.js`, linha 12, altere:
```javascript
const logger = pino({ level: 'info' }); // Mostra logs detalhados
```

## ☁️ Deploy em Produção

### Opções para manter o bot 24/7:

1. **Railway** (Recomendado - Grátis)
```bash
# Instale Railway CLI
npm install -g @railway/cli

# Faça login
railway login

# Crie projeto
railway init

# Configure as variáveis de ambiente no dashboard

# Deploy
railway up
```

2. **Render** (Grátis)
- Conecte seu GitHub
- Configure as variáveis de ambiente
- Deploy automático

3. **VPS** (Vultr, DigitalOcean, etc)
```bash
# Use PM2 para manter rodando
npm install -g pm2
pm2 start src/index.js --name whatsapp-bot
pm2 startup
pm2 save
```

4. **Docker** (Qualquer plataforma)
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

## 📊 Logs e Monitoramento

O bot exibe logs detalhados:

```
✅ WhatsApp conectado com sucesso!
🔍 Testando conexão com banco de dados...
✅ Conexão com banco de dados OK
📋 Processando 3 agendamento(s)...
📤 Enviando lembrete para JHONATHAN...
✅ Lembrete enviado com sucesso!
⏳ Aguardando 5s antes da próxima mensagem...
```

## ⚠️ Avisos Importantes

1. **Uso Responsável**: Não envie spam. Use apenas para lembretes legítimos.

2. **Risco de Ban**: WhatsApp pode banir números que enviam muitas mensagens. Respeite os limites.

3. **Backup da Sessão**: A pasta `auth/` contém sua sessão. Faça backup!

4. **Números Válidos**: O bot só envia para números cadastrados no WhatsApp.

5. **Formato de Telefone**: Aceita formatos:
   - `(44) 99819-3466`
   - `44998193466`
   - `5544998193466`

## 🐛 Troubleshooting

### QR Code não aparece
- Verifique se o terminal suporta QR Code
- Delete a pasta `auth/` e tente novamente

### Erro de conexão com banco
- Verifique as credenciais no `.env`
- Teste a conexão manualmente

### Mensagens não estão sendo enviadas
- Verifique se o WhatsApp está conectado
- Confira se há agendamentos pendentes no banco
- Veja os logs para detalhes do erro

### Bot desconecta constantemente
- Verifique sua conexão de internet
- O WhatsApp pode estar desconectando por inatividade
- Considere usar um VPS com IP fixo

## 📞 Formato de Telefone no Banco

Os telefones no banco podem estar nos formatos:
- `(44) 99819-3466` ✅
- `44998193466` ✅
- `449981934622` ✅

O bot converte automaticamente para: `5544998193466@s.whatsapp.net`

## 🔐 Segurança

- Nunca commite o arquivo `.env`
- Nunca commite a pasta `auth/`
- Use variáveis de ambiente em produção
- Mantenha as dependências atualizadas

## 📝 Licença

MIT

## 👨‍💻 Suporte

Para dúvidas ou problemas, abra uma issue no GitHub.

---

**Desenvolvido com ❤️ usando Baileys**
