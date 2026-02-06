# 🧪 GUIA DE TESTES - Bot WhatsApp

## 📊 Como Funciona o Sistema

### Fluxo Normal:
```
1. Cliente faz agendamento
   ↓
2. Registro vai para tabela "agendamentos"
   ↓
3. Tabela "whatsapp_notificacoes" fica VAZIA (normal!)
   ↓
4. Bot verifica agendamentos a cada 30 minutos
   ↓
5. Se agendamento estiver nas próximas 24h:
   - Bot envia WhatsApp
   - Cria registro em "whatsapp_notificacoes" com enviado=1
   ↓
6. Próxima verificação: bot ignora esse agendamento (já enviado)
```

## ⚠️ IMPORTANTE: Tabela `whatsapp_notificacoes`

A tabela **começa vazia** e só é preenchida **DEPOIS** que o bot enviar!

```sql
-- ANTES do bot enviar:
SELECT * FROM whatsapp_notificacoes;
-- Resultado: vazio (0 registros) ✅ NORMAL!

-- DEPOIS do bot enviar:
SELECT * FROM whatsapp_notificacoes;
-- Resultado: 
-- | id | agendamento_id | enviado | enviado_em          |
-- | 1  | 36             | 1       | 2026-02-06 10:30:00 |
```

## 🧪 TESTE 1: Verificar Status (Rápido)

Execute essas queries no seu banco:

```sql
-- Ver agendamentos futuros e se foram notificados
SELECT 
    a.id,
    a.cliente_nome,
    a.telefone,
    a.data_horario,
    CASE 
        WHEN wn.enviado = 1 THEN '✅ Enviado'
        ELSE '❌ Não enviado'
    END as status
FROM agendamentos a
LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
WHERE a.data_horario > NOW()
ORDER BY a.data_horario;
```

**Resultado esperado ANTES do bot rodar:**
- Todos os agendamentos aparecem como "❌ Não enviado" ✅

**Resultado esperado DEPOIS do bot rodar:**
- Agendamentos dentro de 24h aparecem como "✅ Enviado" ✅

## 🧪 TESTE 2: Rodar Bot em Modo Teste

Para testar **SEM ESPERAR 24 horas**, use o script de teste:

```bash
npm run test
```

**O que esse script faz:**
1. ✅ Busca agendamentos futuros
2. ✅ Mostra todos os agendamentos
3. ✅ Pergunta se quer enviar
4. ✅ Conecta WhatsApp (escaneie QR Code)
5. ✅ Envia mensagem de teste
6. ✅ Marca em whatsapp_notificacoes

## 🧪 TESTE 3: Criar Agendamento de Teste

Crie um agendamento para **daqui 2 horas**:

```sql
INSERT INTO agendamentos 
(id_empresa, id_servico, id_profissional, cliente_nome, telefone, data_horario, status) 
VALUES 
(1, 3, 3, 'TESTE BOT', '(44) 99819-3466', DATE_ADD(NOW(), INTERVAL 2 HOUR), 'agendado');
```

Depois execute:
```bash
npm run test
```

## 🧪 TESTE 4: Verificar se Bot Detectou

Depois de rodar o bot, verifique:

```sql
-- Ver se a notificação foi registrada
SELECT * FROM whatsapp_notificacoes 
WHERE agendamento_id = 36; -- use o ID do seu agendamento

-- Deve retornar algo assim:
-- | id | agendamento_id | enviado | enviado_em          |
-- | 1  | 36             | 1       | 2026-02-06 10:30:00 |
```

## 🔄 TESTE 5: Testar Novamente (Reenviar)

Se quiser testar o mesmo agendamento de novo:

```sql
-- Limpa a notificação
DELETE FROM whatsapp_notificacoes WHERE agendamento_id = 36;

-- Agora pode rodar o teste novamente
```

## ⏰ TESTE 6: Bot em Produção (Tempo Real)

Para testar o bot rodando sozinho:

1. **Rode o bot:**
```bash
npm start
```

2. **Crie agendamento para AGORA + 23 horas:**
```sql
INSERT INTO agendamentos 
(id_empresa, id_servico, id_profissional, cliente_nome, telefone, data_horario, status) 
VALUES 
(1, 3, 3, 'TESTE REAL', '(44) 99819-3466', DATE_ADD(NOW(), INTERVAL 23 HOUR), 'agendado');
```

3. **Aguarde até 30 minutos** (ou reinicie o bot para verificação imediata)

4. **Veja os logs:**
```
📋 1 agendamento(s) encontrado(s)
📤 Enviando lembrete para TESTE REAL...
✅ Lembrete enviado com sucesso!
```

## 📊 Queries Úteis

### Ver todos pendentes:
```sql
SELECT a.*, wn.enviado
FROM agendamentos a
LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
WHERE a.data_horario > NOW() 
  AND a.status = 'agendado'
  AND (wn.enviado IS NULL OR wn.enviado = 0);
```

### Ver todos já enviados:
```sql
SELECT a.cliente_nome, a.telefone, wn.enviado_em
FROM agendamentos a
INNER JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
WHERE wn.enviado = 1
ORDER BY wn.enviado_em DESC;
```

### Estatísticas:
```sql
SELECT 
    COUNT(*) as total_futuros,
    SUM(CASE WHEN wn.enviado = 1 THEN 1 ELSE 0 END) as enviados,
    SUM(CASE WHEN wn.enviado IS NULL THEN 1 ELSE 0 END) as pendentes
FROM agendamentos a
LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
WHERE a.data_horario > NOW() AND a.status = 'agendado';
```

## 🐛 Problemas Comuns

### "Tabela whatsapp_notificacoes está vazia"
✅ **NORMAL!** Ela só é preenchida depois do envio.

### "Bot não está enviando"
Verifique:
1. Bot está conectado? (logs mostram "✅ WhatsApp conectado")
2. Agendamento está dentro de 24h?
3. Status é 'agendado'?
4. Já foi enviado antes? (check tabela whatsapp_notificacoes)

### "Quer testar sem esperar 24h"
Use: `npm run test` (envia imediatamente)

### "Quer reenviar para o mesmo agendamento"
```sql
DELETE FROM whatsapp_notificacoes WHERE agendamento_id = SEU_ID;
```

## 📝 Checklist de Teste

- [ ] Criar agendamento de teste
- [ ] Verificar que whatsapp_notificacoes está vazio (normal!)
- [ ] Rodar `npm run test`
- [ ] Escanear QR Code
- [ ] Receber mensagem no WhatsApp
- [ ] Verificar que whatsapp_notificacoes agora tem 1 registro
- [ ] Campo `enviado` = 1
- [ ] Campo `enviado_em` preenchido

## 🎯 Resultado Esperado

```sql
-- ANTES:
SELECT * FROM whatsapp_notificacoes;
-- 0 rows

-- DEPOIS:
SELECT * FROM whatsapp_notificacoes;
-- +----+----------------+---------+---------------------+
-- | id | agendamento_id | enviado | enviado_em          |
-- +----+----------------+---------+---------------------+
-- | 1  | 36             | 1       | 2026-02-06 10:30:15 |
-- +----+----------------+---------+---------------------+
```

✅ **Isso significa que funcionou!**

---

**Dúvidas? Veja os logs do bot - eles são bem detalhados! 📝**
