-- ════════════════════════════════════════════════════════════
-- QUERIES ÚTEIS PARA MONITORAR O BOT
-- ════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. VER TODOS OS AGENDAMENTOS E STATUS DE NOTIFICAÇÃO
-- ─────────────────────────────────────────────────────────────
SELECT 
    a.id,
    a.cliente_nome,
    a.telefone,
    a.data_horario,
    a.status as status_agendamento,
    CASE 
        WHEN wn.enviado = 1 THEN '✅ Enviado'
        WHEN wn.enviado = 0 THEN '⏳ Falhou'
        ELSE '❌ Não enviado'
    END as status_notificacao,
    wn.enviado_em as data_envio
FROM agendamentos a
LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
WHERE a.data_horario > NOW()
ORDER BY a.data_horario ASC;

-- ─────────────────────────────────────────────────────────────
-- 2. VER APENAS AGENDAMENTOS PENDENTES DE NOTIFICAÇÃO
-- ─────────────────────────────────────────────────────────────
SELECT 
    a.id,
    a.cliente_nome,
    a.telefone,
    a.data_horario,
    s.nome_servico,
    p.nome_profissional
FROM agendamentos a
INNER JOIN servicos s ON a.id_servico = s.id
INNER JOIN profissionais p ON a.id_profissional = p.id
LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
WHERE 
    a.status = 'agendado'
    AND a.data_horario > NOW()
    AND (wn.enviado IS NULL OR wn.enviado = 0)
ORDER BY a.data_horario ASC;

-- ─────────────────────────────────────────────────────────────
-- 3. VER TODAS AS NOTIFICAÇÕES JÁ ENVIADAS
-- ─────────────────────────────────────────────────────────────
SELECT 
    wn.id,
    wn.agendamento_id,
    a.cliente_nome,
    a.telefone,
    a.data_horario,
    wn.enviado,
    wn.enviado_em
FROM whatsapp_notificacoes wn
INNER JOIN agendamentos a ON wn.agendamento_id = a.id
WHERE wn.enviado = 1
ORDER BY wn.enviado_em DESC;

-- ─────────────────────────────────────────────────────────────
-- 4. ESTATÍSTICAS DE ENVIOS
-- ─────────────────────────────────────────────────────────────
SELECT 
    COUNT(*) as total_agendamentos_futuros,
    SUM(CASE WHEN wn.enviado = 1 THEN 1 ELSE 0 END) as notificacoes_enviadas,
    SUM(CASE WHEN wn.enviado IS NULL THEN 1 ELSE 0 END) as pendentes
FROM agendamentos a
LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
WHERE a.status = 'agendado' AND a.data_horario > NOW();

-- ─────────────────────────────────────────────────────────────
-- 5. LIMPAR NOTIFICAÇÕES (para testar novamente)
-- ⚠️ USE COM CUIDADO - Isso permite reenviar lembretes
-- ─────────────────────────────────────────────────────────────
-- DELETE FROM whatsapp_notificacoes;

-- Ou limpar apenas um específico:
-- DELETE FROM whatsapp_notificacoes WHERE agendamento_id = 36;

-- ─────────────────────────────────────────────────────────────
-- 6. VER AGENDAMENTOS QUE VÃO SER NOTIFICADOS NAS PRÓXIMAS 24H
-- (considerando LEMBRETE_ANTECEDENCIA_MINUTOS = 1440)
-- ─────────────────────────────────────────────────────────────
SELECT 
    a.id,
    a.cliente_nome,
    a.telefone,
    a.data_horario,
    TIMESTAMPDIFF(MINUTE, NOW(), a.data_horario) as minutos_ate_agendamento,
    CASE 
        WHEN wn.enviado = 1 THEN 'Já enviado'
        ELSE 'Será enviado'
    END as status
FROM agendamentos a
LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
WHERE 
    a.status = 'agendado'
    AND a.data_horario > NOW()
    AND a.data_horario <= DATE_ADD(NOW(), INTERVAL 1440 MINUTE)
ORDER BY a.data_horario ASC;

-- ─────────────────────────────────────────────────────────────
-- 7. CRIAR UM AGENDAMENTO DE TESTE (para daqui 2 horas)
-- ─────────────────────────────────────────────────────────────
/*
INSERT INTO agendamentos 
(id_empresa, id_servico, id_profissional, cliente_nome, telefone, data_horario, status) 
VALUES 
(1, 3, 3, 'TESTE BOT', '(44) 99999-9999', DATE_ADD(NOW(), INTERVAL 2 HOUR), 'agendado');
*/

-- ─────────────────────────────────────────────────────────────
-- 8. VER HORÁRIO ATUAL DO SERVIDOR (para debugging)
-- ─────────────────────────────────────────────────────────────
SELECT 
    NOW() as horario_servidor,
    DATE_ADD(NOW(), INTERVAL 1440 MINUTE) as limite_para_notificar;
