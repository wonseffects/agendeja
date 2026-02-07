import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { 
  formatarTelefoneWhatsApp, 
  gerarMensagemLembrete, 
  delay,
  validarTelefone 
} from './utils.js';

const logger = pino({ level: 'silent' }); // Use 'info' para ver logs detalhados

class WhatsAppBot {
  constructor() {
    this.sock = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Inicializa o bot
   */
  async iniciar() {
    try {
      console.log('🚀 Iniciando WhatsApp Bot...');
      
      const { state, saveCreds } = await useMultiFileAuthState('auth');
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false, // Vamos usar qrcode-terminal
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
          return { conversation: '' };
        }
      });

      // Evento: Atualização de credenciais
      this.sock.ev.on('creds.update', saveCreds);

      // Evento: Mudança de conexão
      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update);
      });

      // Evento: Mensagens recebidas (opcional - para futuras funcionalidades)
      this.sock.ev.on('messages.upsert', async (m) => {
        // Aqui você pode implementar respostas automáticas se quiser
        // console.log('Mensagem recebida:', m);
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar bot:', error);
      throw error;
    }
  }

  /**
   * Gerencia atualizações de conexão
   */
  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    // Mostra QR Code
    if (qr) {
      console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:\n');
      qrcode.generate(qr, { small: true });
      console.log('\n');
    }

    // Conexão estabelecida
    if (connection === 'open') {
      console.log('✅ WhatsApp conectado com sucesso!');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    }

    // Desconectado
    if (connection === 'close') {
      this.isConnected = false;
      const shouldReconnect = (lastDisconnect?.error instanceof Boom) &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

      console.log('⚠️ Conexão fechada. Motivo:', lastDisconnect?.error);

      if (shouldReconnect) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Tentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          await delay(5000);
          await this.iniciar();
        } else {
          console.error('❌ Máximo de tentativas de reconexão atingido');
        }
      } else {
        console.log('🔑 Sessão encerrada. Delete a pasta "auth" e escaneie o QR Code novamente.');
      }
    }
  }

  /**
   * Envia mensagem para um número
   * @param {string} numero - Número no formato do WhatsApp
   * @param {string} mensagem - Texto da mensagem
   * @returns {Promise<boolean>}
   */
  async enviarMensagem(numero, mensagem) {
    try {
      if (!this.isConnected) {
        throw new Error('WhatsApp não está conectado');
      }

      console.log(`🔍 Verificando se ${numero} existe no WhatsApp...`);

      // Verifica se o número existe no WhatsApp
      const checkResult = await this.sock.onWhatsApp(numero);
      
      console.log(`📋 Resultado da verificação:`, checkResult);
      
      if (!checkResult || checkResult.length === 0) {
        console.log(`❌ Número ${numero} NÃO foi encontrado no WhatsApp`);
        console.log(`💡 Certifique-se que o número está correto e tem WhatsApp ativo`);
        return false;
      }
      
      const [result] = checkResult;
      
      if (!result?.exists) {
        console.log(`❌ Número ${numero} NÃO tem WhatsApp cadastrado`);
        console.log(`💡 Verifique se o número está no formato correto: DDI + DDD + Número`);
        return false;
      }

      console.log(`✅ Número verificado! Está no WhatsApp como: ${result.jid}`);
      console.log(`📤 Enviando mensagem...`);

      // Envia a mensagem usando o JID verificado
      await this.sock.sendMessage(result.jid, { text: mensagem });
      console.log(`✅ Mensagem REALMENTE enviada para ${result.jid}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para ${numero}:`, error.message);
      console.error(`Stack:`, error.stack);
      return false;
    }
  }

  /**
   * Processa um agendamento e envia lembrete
   * @param {object} agendamento 
   * @returns {Promise<boolean>}
   */
  /**
   * Processa agendamento de 1 hora
   */
  async processarAgendamento1Hora(agendamento) {
    try {
      if (!validarTelefone(agendamento.telefone)) {
        console.log(`⚠️ Telefone inválido para ${agendamento.cliente_nome}: ${agendamento.telefone}`);
        return false;
      }

      const numeroWhatsApp = formatarTelefoneWhatsApp(agendamento.telefone);
      const mensagem = gerarMensagem1Hora(agendamento);
      
      console.log(`\n📤 [1 HORA] Enviando para ${agendamento.cliente_nome}...`);
      console.log(`📞 Número: ${agendamento.telefone} → ${numeroWhatsApp}`);
      
      const enviado = await this.enviarMensagem(numeroWhatsApp, mensagem);
      
      if (enviado) {
        console.log(`✅ Lembrete de 1 hora enviado!`);
      }
      
      return enviado;
    } catch (error) {
      console.error(`❌ Erro ao processar lembrete 1h ${agendamento.id}:`, error);
      return false;
    }
  }

  /**
   * Processa agendamento de 30 minutos
   */
  async processarAgendamento30Min(agendamento) {
    try {
      if (!validarTelefone(agendamento.telefone)) {
        console.log(`⚠️ Telefone inválido para ${agendamento.cliente_nome}: ${agendamento.telefone}`);
        return false;
      }

      const numeroWhatsApp = formatarTelefoneWhatsApp(agendamento.telefone);
      const mensagem = gerarMensagem30Min(agendamento);
      
      console.log(`\n📤 [30 MIN] Enviando para ${agendamento.cliente_nome}...`);
      console.log(`📞 Número: ${agendamento.telefone} → ${numeroWhatsApp}`);
      
      const enviado = await this.enviarMensagem(numeroWhatsApp, mensagem);
      
      if (enviado) {
        console.log(`✅ Lembrete de 30 minutos enviado!`);
      }
      
      return enviado;
    } catch (error) {
      console.error(`❌ Erro ao processar lembrete 30min ${agendamento.id}:`, error);
      return false;
    }
  }
  async processarAgendamento(agendamento) {
    try {
      // Valida telefone
      if (!validarTelefone(agendamento.telefone)) {
        console.log(`⚠️ Telefone inválido para ${agendamento.cliente_nome}: ${agendamento.telefone}`);
        return false;
      }

      // Formata número
      const numeroWhatsApp = formatarTelefoneWhatsApp(agendamento.telefone);
      
      // Gera mensagem
      const mensagem = gerarMensagemLembrete(agendamento);
      
      console.log(`\n📤 Enviando lembrete para ${agendamento.cliente_nome}...`);
      console.log(`📞 Número: ${agendamento.telefone} → ${numeroWhatsApp}`);
      
      // Envia mensagem
      const enviado = await this.enviarMensagem(numeroWhatsApp, mensagem);
      
      if (enviado) {
        console.log(`✅ Lembrete enviado com sucesso!`);
      }
      
      return enviado;
    } catch (error) {
      console.error(`❌ Erro ao processar agendamento ${agendamento.id}:`, error);
      return false;
    }
  }

  /**
   * Processa múltiplos agendamentos com delay
   * @param {Array} agendamentos 
   * @returns {Promise<object>}
   */
  async processarAgendamentos(agendamentos) {
    const delayMs = parseInt(process.env.DELAY_ENTRE_MENSAGENS) || 5000;
    let enviados = 0;
    let erros = 0;

    console.log(`\n📋 Processando ${agendamentos.length} agendamento(s)...`);

    for (const agendamento of agendamentos) {
      const sucesso = await this.processarAgendamento(agendamento);
      
      if (sucesso) {
        enviados++;
      } else {
        erros++;
      }

      // Aguarda antes da próxima mensagem (anti-ban)
      if (agendamentos.indexOf(agendamento) < agendamentos.length - 1) {
        console.log(`⏳ Aguardando ${delayMs/1000}s antes da próxima mensagem...`);
        await delay(delayMs);
      }
    }

    return { enviados, erros, total: agendamentos.length };
  }

  /**
   * Verifica se o bot está conectado
   */
  estaConectado() {
    return this.isConnected;
  }

  /**
   * Desconecta o bot
   */
  async desconectar() {
    if (this.sock) {
      await this.sock.logout();
      console.log('👋 WhatsApp desconectado');
    }
  }
}
/**
   * Processa múltiplos agendamentos de 1 hora
   */
  async processarAgendamentos1Hora(agendamentos) {
    const delayMs = parseInt(process.env.DELAY_ENTRE_MENSAGENS) || 5000;
    let enviados = 0;
    let erros = 0;

    console.log(`\n📋 [1 HORA] Processando ${agendamentos.length} lembrete(s)...`);

    for (const agendamento of agendamentos) {
      const sucesso = await this.processarAgendamento1Hora(agendamento);
      
      if (sucesso) enviados++;
      else erros++;

      if (agendamentos.indexOf(agendamento) < agendamentos.length - 1) {
        console.log(`⏳ Aguardando ${delayMs/1000}s...`);
        await delay(delayMs);
      }
    }

    return { enviados, erros, total: agendamentos.length };
  }

  /**
   * Processa múltiplos agendamentos de 30 minutos
   */
  async processarAgendamentos30Min(agendamentos) {
    const delayMs = parseInt(process.env.DELAY_ENTRE_MENSAGENS) || 5000;
    let enviados = 0;
    let erros = 0;

    console.log(`\n📋 [30 MIN] Processando ${agendamentos.length} lembrete(s)...`);

    for (const agendamento of agendamentos) {
      const sucesso = await this.processarAgendamento30Min(agendamento);
      
      if (sucesso) enviados++;
      else erros++;

      if (agendamentos.indexOf(agendamento) < agendamentos.length - 1) {
        console.log(`⏳ Aguardando ${delayMs/1000}s...`);
        await delay(delayMs);
      }
    }

    return { enviados, erros, total: agendamentos.length };
  }
export default WhatsAppBot;
