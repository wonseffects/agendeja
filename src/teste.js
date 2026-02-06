import dotenv from 'dotenv';
import WhatsAppBot from './whatsapp.js';
import {
  testarConexao,
  buscarAgendamentosPendentes,
  marcarNotificacaoEnviada
} from './database.js';
import { delay } from './utils.js';
import pool from './database.js';

dotenv.config();

/**
 * Script de teste para verificar o bot funcionando
 */
async function testarBot() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 TESTE DO BOT WHATSAPP');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Testa conexão com banco
    console.log('1️⃣ Testando conexão com banco...');
    const dbOk = await testarConexao();
    if (!dbOk) {
      throw new Error('Falha na conexão com banco');
    }

    // 2. Busca TODOS os agendamentos futuros (ignora tempo de antecedência)
    console.log('\n2️⃣ Buscando agendamentos futuros...');
    const query = `
      SELECT 
        a.id,
        a.id_empresa,
        a.cliente_nome,
        a.telefone,
        a.data_horario,
        s.nome_servico,
        p.nome_profissional,
        e.nome_empresa,
        wn.enviado
      FROM agendamentos a
      INNER JOIN servicos s ON a.id_servico = s.id
      INNER JOIN profissionais p ON a.id_profissional = p.id
      INNER JOIN empresas e ON a.id_empresa = e.id
      LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
      WHERE 
        a.status = 'agendado'
        AND a.data_horario > NOW()
      ORDER BY a.data_horario ASC
      LIMIT 5
    `;

    const [agendamentos] = await pool.execute(query);

    if (agendamentos.length === 0) {
      console.log('⚠️ Nenhum agendamento futuro encontrado!');
      console.log('\n💡 DICA: Crie um agendamento de teste no seu sistema');
      process.exit(0);
    }

    console.log(`✅ ${agendamentos.length} agendamento(s) encontrado(s):\n`);

    agendamentos.forEach((ag, index) => {
      console.log(`📋 Agendamento ${index + 1}:`);
      console.log(`   ID: ${ag.id}`);
      console.log(`   Cliente: ${ag.cliente_nome}`);
      console.log(`   Telefone: ${ag.telefone}`);
      console.log(`   Data/Hora: ${ag.data_horario}`);
      console.log(`   Serviço: ${ag.nome_servico}`);
      console.log(`   Profissional: ${ag.nome_profissional}`);
      console.log(`   Já notificado: ${ag.enviado ? '✅ SIM' : '❌ NÃO'}`);
      console.log('');
    });

    // 3. Pergunta qual enviar
    console.log('\n3️⃣ Vamos testar o envio...');
    console.log('⚠️ ATENÇÃO: Isso vai REALMENTE enviar uma mensagem WhatsApp!\n');

    // Filtra apenas não enviados
    const naoEnviados = agendamentos.filter(a => !a.enviado);

    if (naoEnviados.length === 0) {
      console.log('⚠️ Todos os agendamentos já foram notificados!');
      console.log('\n💡 Para testar novamente, execute:');
      console.log('DELETE FROM whatsapp_notificacoes;');
      process.exit(0);
    }

    console.log(`📤 Vou enviar lembrete para: ${naoEnviados[0].cliente_nome}`);
    console.log('⏳ Aguarde 5 segundos para cancelar (Ctrl+C)...\n');

    await delay(5000);

    // 4. Conecta WhatsApp
    console.log('4️⃣ Conectando WhatsApp...');
    const bot = new WhatsAppBot();
    await bot.iniciar();

    console.log('⏳ Aguardando conexão...');
    let tentativas = 0;
    while (!bot.estaConectado() && tentativas < 30) {
      await delay(1000);
      tentativas++;
    }

    if (!bot.estaConectado()) {
      throw new Error('Timeout: WhatsApp não conectou');
    }

    console.log('✅ WhatsApp conectado!\n');

    // 5. Envia mensagem de teste
    console.log('5️⃣ Enviando mensagem de teste...\n');
    const agendamento = naoEnviados[0];
    const sucesso = await bot.processarAgendamento(agendamento);

    if (sucesso) {
      // Marca como enviado
      await marcarNotificacaoEnviada(agendamento.id);
      
      console.log('\n╔═══════════════════════════════════════════════════╗');
      console.log('║  ✅ TESTE CONCLUÍDO COM SUCESSO!                  ║');
      console.log('╚═══════════════════════════════════════════════════╝\n');
      
      console.log('📊 O que aconteceu:');
      console.log('1. ✅ Mensagem enviada para o cliente');
      console.log('2. ✅ Registro criado em whatsapp_notificacoes');
      console.log('3. ✅ Campo "enviado" marcado como 1\n');
      
      console.log('🔍 Verifique no banco:');
      console.log(`SELECT * FROM whatsapp_notificacoes WHERE agendamento_id = ${agendamento.id};`);
      
    } else {
      console.log('\n❌ Falha no envio. Verifique os logs acima.');
    }

    await bot.desconectar();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  }
}

// Executa teste
testarBot();
