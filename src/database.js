import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexões para melhor performance
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});


/**
 * Busca agendamentos que precisam de lembrete de 1 hora
 * @returns {Promise<Array>}
 */
export async function buscarAgendamentos1Hora() {
  try {
    const query = `
      SELECT 
        a.id,
        a.id_empresa,
        a.cliente_nome,
        a.telefone,
        a.data_horario,
        s.nome_servico,
        p.nome_profissional,
        e.nome_empresa
      FROM agendamentos a
      INNER JOIN servicos s ON a.id_servico = s.id
      INNER JOIN profissionais p ON a.id_profissional = p.id
      INNER JOIN empresas e ON a.id_empresa = e.id
      WHERE 
        a.status = 'agendado'
        AND a.msg_1h = 0
        AND a.data_horario > NOW()
        AND a.data_horario <= DATE_ADD(NOW(), INTERVAL 60 MINUTE)
      ORDER BY a.data_horario ASC
      LIMIT ?
    `;
    
    const maxMensagens = parseInt(process.env.MAX_MENSAGENS_POR_CICLO) || 10;
    const [rows] = await pool.execute(query, [maxMensagens]);
    
    return rows;
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos 1h:', error);
    return [];
  }
}

/**
 * Busca agendamentos que precisam de lembrete de 30 minutos
 * @returns {Promise<Array>}
 */
export async function buscarAgendamentos30Min() {
  try {
    const query = `
      SELECT 
        a.id,
        a.id_empresa,
        a.cliente_nome,
        a.telefone,
        a.data_horario,
        s.nome_servico,
        p.nome_profissional,
        e.nome_empresa
      FROM agendamentos a
      INNER JOIN servicos s ON a.id_servico = s.id
      INNER JOIN profissionais p ON a.id_profissional = p.id
      INNER JOIN empresas e ON a.id_empresa = e.id
      WHERE 
        a.status = 'agendado'
        AND a.msg_30min = 0
        AND a.data_horario > NOW()
        AND a.data_horario <= DATE_ADD(NOW(), INTERVAL 30 MINUTE)
      ORDER BY a.data_horario ASC
      LIMIT ?
    `;
    
    const maxMensagens = parseInt(process.env.MAX_MENSAGENS_POR_CICLO) || 10;
    const [rows] = await pool.execute(query, [maxMensagens]);
    
    return rows;
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos 30min:', error);
    return [];
  }
}

/**
 * Marca mensagem de 1 hora como enviada
 */
export async function marcarMensagem1hEnviada(agendamentoId) {
  try {
    const query = `UPDATE agendamentos SET msg_1h = 1 WHERE id = ?`;
    await pool.execute(query, [agendamentoId]);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao marcar msg_1h ${agendamentoId}:`, error);
    return false;
  }
}

/**
 * Marca mensagem de 30 minutos como enviada
 */
export async function marcarMensagem30minEnviada(agendamentoId) {
  try {
    const query = `UPDATE agendamentos SET msg_30min = 1 WHERE id = ?`;
    await pool.execute(query, [agendamentoId]);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao marcar msg_30min ${agendamentoId}:`, error);
    return false;
  }
}
/**
 * Busca agendamentos que precisam de lembrete
 * @returns {Promise<Array>} Lista de agendamentos
 */
export async function buscarAgendamentosPendentes() {
  try {
    const query = `
      SELECT 
        a.id,
        a.id_empresa,
        a.cliente_nome,
        a.telefone,
        a.data_horario,
        s.nome_servico,
        p.nome_profissional,
        e.nome_empresa
      FROM agendamentos a
      INNER JOIN servicos s ON a.id_servico = s.id
      INNER JOIN profissionais p ON a.id_profissional = p.id
      INNER JOIN empresas e ON a.id_empresa = e.id
      WHERE 
        a.status = 'agendado'
        AND a.msg_confirmacao = 0
        AND a.data_horario > NOW()
      ORDER BY a.data_horario ASC
      LIMIT ?
    `;
    
    const maxMensagens = parseInt(process.env.MAX_MENSAGENS_POR_CICLO) || 10;
    const [rows] = await pool.execute(query, [maxMensagens]);
    
    return rows;
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    return [];
  }
}

/**
 * Marca notificação como enviada
 * @param {number} agendamentoId 
 * @returns {Promise<boolean>}
 */
export async function marcarNotificacaoEnviada(agendamentoId) {
  try {
    const query = `UPDATE agendamentos SET msg_confirmacao = 1 WHERE id = ?`;
    await pool.execute(query, [agendamentoId]);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao marcar confirmação ${agendamentoId}:`, error);
    return false;
  }
}

/**
 * Registra log de erro no envio
 * @param {number} agendamentoId 
 * @param {string} erro 
 */
export async function registrarErroEnvio(agendamentoId, erro) {
  try {
    // Você pode criar uma tabela de logs se quiser
    console.error(`❌ Erro no agendamento ${agendamentoId}:`, erro);
  } catch (error) {
    console.error('❌ Erro ao registrar log:', error);
  }
}

/**
 * Testa a conexão com o banco
 * @returns {Promise<boolean>}
 */
export async function testarConexao() {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('✅ Conexão com banco de dados OK');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar no banco:', error);
    return false;
  }
}

export default pool;
