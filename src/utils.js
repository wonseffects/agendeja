/**
 * Formata número de telefone para o padrão do WhatsApp
 * @param {string} telefone - Telefone no formato (44) 99819-3466 ou 44998193466
 * @returns {string} - Formato: 5544998193466@s.whatsapp.net
 */
export function formatarTelefoneWhatsApp(telefone) {
  // Remove todos os caracteres não numéricos
  let numeroLimpo = telefone.replace(/\D/g, '');
  
  // Se não começar com 55 (DDI Brasil), adiciona
  if (!numeroLimpo.startsWith('55')) {
    numeroLimpo = '55' + numeroLimpo;
  }
  
  // Retorna no formato do WhatsApp
  return `${numeroLimpo}@s.whatsapp.net`;
}

/**
 * Formata data e hora para mensagem
 * @param {string|Date} dataHorario 
 * @returns {string} - Exemplo: "05/02/2026 às 14:30"
 */
export function formatarDataHora(dataHorario) {
  const data = new Date(dataHorario);
  
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  
  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');
  
  return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
}

/**
 * Gera mensagem de lembrete personalizada
 * @param {object} agendamento 
 * @returns {string}
 */
export function gerarMensagemLembrete(agendamento) {
  const dataFormatada = formatarDataHora(agendamento.data_horario);
  
  const mensagem = `🔔 *Lembrete de Agendamento* 🔔

Olá, *${agendamento.cliente_nome}*! 

Este é um lembrete do seu agendamento na *${agendamento.nome_empresa}*:

📅 *Data/Hora:* ${dataFormatada}
✂️ *Serviço:* ${agendamento.nome_servico}
👤 *Profissional:* ${agendamento.nome_profissional}

Nos vemos em breve! 😊

_Caso precise cancelar ou reagendar, entre em contato conosco._`;

  return mensagem;
}

/**
 * Delay assíncrono
 * @param {number} ms - Milissegundos
 * @returns {Promise}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Valida se um número de telefone é válido
 * @param {string} telefone 
 * @returns {boolean}
 */
export function validarTelefone(telefone) {
  const numeroLimpo = telefone.replace(/\D/g, '');
  
  // Valida se tem entre 10 e 13 dígitos (com ou sem DDI)
  if (numeroLimpo.length < 10 || numeroLimpo.length > 13) {
    return false;
  }
  
  return true;
}
/**
 * Gera mensagem de lembrete de 1 hora
 */
export function gerarMensagem1Hora(agendamento) {
  const dataFormatada = formatarDataHora(agendamento.data_horario);
  
  const mensagem = `⏰ *Lembrete - Falta 1 hora!* ⏰

Olá, *${agendamento.cliente_nome}*! 

Seu agendamento na *${agendamento.nome_empresa}* está próximo:

📅 *Data/Hora:* ${dataFormatada}
✂️ *Serviço:* ${agendamento.nome_servico}
👤 *Profissional:* ${agendamento.nome_profissional}

⏱️ *Falta apenas 1 hora!*

Já estamos te esperando! 😊`;

  return mensagem;
}

/**
 * Gera mensagem de lembrete de 30 minutos
 */
export function gerarMensagem30Min(agendamento) {
  const dataFormatada = formatarDataHora(agendamento.data_horario);
  
  const mensagem = `🔔 *ATENÇÃO - Falta 30 minutos!* 🔔

Olá, *${agendamento.cliente_nome}*! 

Seu horário está chegando:

📅 *Data/Hora:* ${dataFormatada}
✂️ *Serviço:* ${agendamento.nome_servico}
👤 *Profissional:* ${agendamento.nome_profissional}

⚡ *Faltam apenas 30 minutos!*

Estamos te aguardando! 🏃‍♂️💨`;

  return mensagem;
}
