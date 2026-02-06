# 🔧 TROUBLESHOOTING - Mensagens Não Chegam

## ❌ Problema: "Mensagem enviada mas não chegou"

Quando você vê nos logs:
```
✅ Mensagem enviada para 5544998193466@s.whatsapp.net
```

Mas a mensagem **NÃO chega** no WhatsApp, pode ser:

---

## 🔍 Causa 1: Número não existe no WhatsApp (MAIS COMUM)

### Como verificar:
```bash
npm run test-numero
```

Este script vai:
1. Conectar no WhatsApp
2. Verificar se o número existe
3. Tentar enviar mensagem de teste

### Sintomas:
- Código diz "✅ Enviado"
- WhatsApp não recebe nada
- Número pode estar incorreto

### Solução:
1. **Use seu próprio número para testar primeiro!**
2. Verifique o formato no banco de dados:
   ```sql
   SELECT telefone FROM agendamentos WHERE id = 37;
   ```
3. Certifique-se que tem WhatsApp ativo

---

## 🔍 Causa 2: Formato de número incorreto

### Formatos aceitos:
```
✅ (44) 99819-3466
✅ 44998193466
✅ 5544998193466
❌ 44 99819-3466 (espaço extra)
❌ +55 44 99819-3466 (símbolo +)
```

### Teste manual:
```javascript
// No seu terminal Node.js
import { formatarTelefoneWhatsApp } from './src/utils.js';

console.log(formatarTelefoneWhatsApp('(44) 99819-3466'));
// Deve retornar: 5544998193466@s.whatsapp.net
```

### Solução:
Padronize os telefones no banco:
```sql
-- Remove caracteres especiais
UPDATE agendamentos 
SET telefone = REPLACE(REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), '-', ''), ' ', '');

-- Verifica resultado
SELECT id, telefone FROM agendamentos;
```

---

## 🔍 Causa 3: WhatsApp não está realmente conectado

### Como verificar:
Veja se nos logs aparece:
```
✅ WhatsApp conectado com sucesso!
```

### Se aparecer só:
```
⏳ Aguardando conexão...
```

Significa que o QR Code não foi escaneado corretamente.

### Solução:
1. Delete a pasta `auth/`
2. Rode novamente: `npm start`
3. Escaneie o QR Code
4. Aguarde aparecer "✅ WhatsApp conectado com sucesso!"

---

## 🔍 Causa 4: Sessão do WhatsApp expirou

### Sintomas:
- Bot estava funcionando
- Parou de enviar do nada
- Logs mostram erros de autenticação

### Solução:
```bash
# Pare o bot (Ctrl+C)
# Delete a sessão
rm -rf auth/

# Rode novamente
npm start

# Escaneie QR Code novamente
```

---

## 🔍 Causa 5: WhatsApp bloqueou temporariamente

### Sintomas:
- Muitas mensagens enviadas rapidamente
- Mensagens param de chegar
- Pode aparecer erro "rate limit"

### Solução:
1. **Aumente o delay** no `.env`:
   ```env
   DELAY_ENTRE_MENSAGENS=10000  # 10 segundos
   ```

2. **Reduza mensagens por ciclo**:
   ```env
   MAX_MENSAGENS_POR_CICLO=5
   ```

3. **Aguarde algumas horas** antes de tentar novamente

---

## ✅ TESTE DEFINITIVO: Use seu próprio número!

### Passo a passo:

1. **Edite o arquivo de teste:**
```bash
nano src/testar-numero.js
```

2. **Troque para SEU número:**
```javascript
const numerosParaTestar = [
  '5544999999999',  // ← COLOQUE SEU NÚMERO AQUI
];
```

3. **Execute:**
```bash
npm run test-numero
```

4. **Verifique seu WhatsApp!**

---

## 🧪 Teste com 2 Números

Para ter certeza absoluta, teste assim:

```javascript
// src/testar-numero.js
const numerosParaTestar = [
  '5544998193466',  // Número do cliente
  '5544999887766',  // SEU número
];
```

Se **APENAS o seu** receber:
- ✅ Bot funcionando
- ❌ Número do cliente incorreto/sem WhatsApp

Se **NENHUM** receber:
- ❌ Problema no bot/conexão
- Verifique logs detalhados

---

## 🔍 Logs Detalhados

Para ver TUDO que está acontecendo:

1. **Edite `src/whatsapp.js`** linha 12:
```javascript
const logger = pino({ level: 'info' }); // Era 'silent'
```

2. **Rode novamente:**
```bash
npm start
```

3. **Veja logs completos** do Baileys

---

## 📊 Verificação Final no Banco

```sql
-- Ver número formatado vs original
SELECT 
    id,
    cliente_nome,
    telefone,
    REPLACE(REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), '-', ''), ' ', '') as numero_limpo,
    CONCAT('55', REPLACE(REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), '-', ''), ' ', ''), '@s.whatsapp.net') as formato_whatsapp
FROM agendamentos
WHERE data_horario > NOW();
```

Copie o `formato_whatsapp` e teste manualmente no WhatsApp Web!

---

## 🆘 Ainda não funciona?

### Checklist final:
- [ ] QR Code foi escaneado?
- [ ] Logs mostram "✅ WhatsApp conectado com sucesso!"?
- [ ] Testou com SEU PRÓPRIO número?
- [ ] Número tem 13 dígitos (55 + DDD + 9 dígitos)?
- [ ] WhatsApp está ativo nesse número?
- [ ] Deletou pasta `auth/` e reconectou?

### Se tudo estiver ✅ mas ainda não funciona:

Pode ser limitação do Baileys com sua conta. Tente:

1. **Usar outro número** para conectar o bot
2. **WhatsApp Business API oficial** (pago mas garantido)
3. **Evolution API** (wrapper do Baileys mais robusto)

---

## 📞 Contato de Emergência

Se nada funcionar, me envie:

1. Logs completos do bot
2. Resultado de `npm run test-numero`
3. Query do banco mostrando o telefone
4. Print do erro (se houver)

Vou te ajudar! 💪
