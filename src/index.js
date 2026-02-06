import dotenv from 'dotenv';
import WhatsAppBot from './whatsapp.js';
import {
  testarConexao,
  buscarAgendamentosPendentes,
  marcarNotificacaoEnviada,
  registrarErroEnvio
} from './database.js';
import { delay } from './utils.js';

import express from 'express'
import path from 'path'


const app = express()

app.get('/qr', (req, res) => {
  res.sendFile(path.resolve('./qr.png'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT)

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

    // Busca agendamentos pendentes
    const agendamentos = await buscarAgendamentosPendentes();

    if (agendamentos.length === 0) {
      console.log('ℹ️ Nenhum agendamento pendente de lembrete no momento.');
      return;
    }

    console.log(`📋 ${agendamentos.length} agendamento(s) encontrado(s)\n`);

    // Processa os agendamentos
    const resultado = await this.bot.processarAgendamentos(agendamentos);

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  📊 RESULTADO DO ENVIO                            ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log(`✅ Enviados: ${resultado.enviados}`);
    console.log(`❌ Erros: ${resultado.erros}`);
    console.log(`📊 Total: ${resultado.total}`);

    // Marca notificações como enviadas
    for (const agendamento of agendamentos) {
      const index = agendamentos.indexOf(agendamento);
      
      if (index < resultado.enviados) {
        await marcarNotificacaoEnviada(agendamento.id);
      } else {
        await registrarErroEnvio(agendamento.id, 'Falha no envio');
      }
    }

    console.log('\n✅ Processamento concluído!');
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
