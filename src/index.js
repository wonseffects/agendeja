import dotenv from 'dotenv';
import WhatsAppBot from './whatsapp.js';
import {
  testarConexao,
  buscarAgendamentosPendentes,
  buscarAgendamentos1Hora,
  buscarAgendamentos30Min,
  marcarNotificacaoEnviada,
  marcarMensagem1hEnviada,
  marcarMensagem30minEnviada,
  registrarErroEnvio
} from './database.js';
import { delay } from './utils.js';

dotenv.config();

class BotAgendamentos {
  constructor() {
    this.bot = new WhatsAppBot();
    this.intervaloVerificacao = (parseInt(process.env.INTERVALO_VERIFICACAO_MINUTOS) || 30) * 60 * 1000;
    this.isRunning = false;
  }

  /**
   * Inicia o sistema completo
   */
  async iniciar() {
    try {
      console.log('═══════════════════════════════════════════════════');
      console.log('🤖 BOT DE AGENDAMENTOS - WHATSAPP');
      console.log('═══════════════════════════════════════════════════\n');

      // Testa conexão com banco
      console.log('🔍 Testando conexão com banco de dados...');
      const dbOk = await testarConexao();
      
      if (!dbOk) {
        throw new Error('Falha ao conectar no banco de dados');
      }

      // Inicializa WhatsApp
      console.log('\n🔍 Inicializando WhatsApp...');
      await this.bot.iniciar();

      // Aguarda conexão
      console.log('⏳ Aguardando conexão...\n');
      while (!this.bot.estaConectado()) {
        await delay(2000);
      }

      console.log('\n✅ Sistema iniciado com sucesso!');
      console.log(`⏰ Verificação a cada ${this.intervaloVerificacao / 60000} minutos`);
      console.log('═══════════════════════════════════════════════════\n');

      // Inicia loop de verificação
      this.isRunning = true;
      await this.loopVerificacao();

    } catch (error) {
      console.error('❌ Erro fatal ao iniciar:', error);
      process.exit(1);
    }
  }

  /**
   * Loop principal de verificação de agendamentos
   */
  async loopVerificacao() {
    while (this.isRunning) {
      try {
        await this.verificarEEnviarLembretes();
      } catch (error) {
        console.error('❌ Erro no loop de verificação:', error);
      }

      // Aguarda próximo ciclo
      console.log(`\n⏰ Próxima verificação em ${this.intervaloVerificacao / 60000} minutos...`);
      console.log(`📅 ${new Date().toLocaleString('pt-BR')}\n`);
      await delay(this.intervaloVerificacao);
    }
  }

  /**
   * Verifica agendamentos e envia lembretes
   */
  async verificarEEnviarLembretes() {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  🔍 VERIFICANDO AGENDAMENTOS PENDENTES            ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log(`🕐 ${new Date().toLocaleString('pt-BR')}\n`);

    // Verifica se o WhatsApp está conectado
    if (!this.bot.estaConectado()) {
      console.log('⚠️ WhatsApp não está conectado. Aguardando...');
      return;
    }

    let totalEnviados = 0;

    // 1. CONFIRMAÇÕES (assim que agendar)
    const confirmacoes = await buscarAgendamentosPendentes();
    
    if (confirmacoes.length > 0) {
      console.log(`\n📋 [CONFIRMAÇÃO] ${confirmacoes.length} agendamento(s) novo(s)`);
      const resultado = await this.bot.processarAgendamentos(confirmacoes);
      
      console.log('\n╔═══════════════════════════════════════════════════╗');
      console.log('║  📊 RESULTADO - CONFIRMAÇÕES                      ║');
      console.log('╚═══════════════════════════════════════════════════╝');
      console.log(`✅ Enviados: ${resultado.enviados}`);
      console.log(`❌ Erros: ${resultado.erros}`);

      for (const agendamento of confirmacoes) {
        await marcarNotificacaoEnviada(agendamento.id);
      }

      totalEnviados += resultado.enviados;
    }

    // 2. LEMBRETES DE 1 HORA
    const lembretes1h = await buscarAgendamentos1Hora();
    
    if (lembretes1h.length > 0) {
      console.log(`\n📋 [1 HORA] ${lembretes1h.length} lembrete(s) de 1 hora`);
      const resultado = await this.bot.processarAgendamentos1Hora(lembretes1h);
      
      console.log('\n╔═══════════════════════════════════════════════════╗');
      console.log('║  📊 RESULTADO - 1 HORA                            ║');
      console.log('╚═══════════════════════════════════════════════════╝');
      console.log(`✅ Enviados: ${resultado.enviados}`);
      console.log(`❌ Erros: ${resultado.erros}`);

      for (const agendamento of lembretes1h) {
        await marcarMensagem1hEnviada(agendamento.id);
      }

      totalEnviados += resultado.enviados;
    }

    // 3. LEMBRETES DE 30 MINUTOS
    const lembretes30min = await buscarAgendamentos30Min();
    
    if (lembretes30min.length > 0) {
      console.log(`\n📋 [30 MIN] ${lembretes30min.length} lembrete(s) de 30 minutos`);
      const resultado = await this.bot.processarAgendamentos30Min(lembretes30min);
      
      console.log('\n╔═══════════════════════════════════════════════════╗');
      console.log('║  📊 RESULTADO - 30 MINUTOS                        ║');
      console.log('╚═══════════════════════════════════════════════════╝');
      console.log(`✅ Enviados: ${resultado.enviados}`);
      console.log(`❌ Erros: ${resultado.erros}`);

      for (const agendamento of lembretes30min) {
        await marcarMensagem30minEnviada(agendamento.id);
      }

      totalEnviados += resultado.enviados;
    }

    if (totalEnviados === 0) {
      console.log('ℹ️ Nenhum lembrete pendente no momento.');
    } else {
      console.log('\n✅ Todos os lembretes processados!');
    }
  }

  /**
   * Para o bot
   */
  async parar() {
    console.log('\n⏹️ Parando bot...');
    this.isRunning = false;
    await this.bot.desconectar();
    process.exit(0);
  }
}

// Inicializa o bot
const botAgendamentos = new BotAgendamentos();

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Sinal de interrupção recebido...');
  await botAgendamentos.parar();
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Sinal de término recebido...');
  await botAgendamentos.parar();
});

// Inicia o bot
botAgendamentos.iniciar().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
