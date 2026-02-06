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
      LEFT JOIN whatsapp_notificacoes wn ON a.id = wn.agendamento_id
      WHERE 
        a.status = 'agendado'
        AND a.data_horario > NOW()
        AND (wn.enviado IS NULL OR wn.enviado = 0)
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
    const query = `
      INSERT INTO whatsapp_notificacoes (agendamento_id, enviado, enviado_em)
      VALUES (?, 1, NOW())
      ON DUPLICATE KEY UPDATE 
        enviado = 1,
        enviado_em = NOW()
    `;
    
    await pool.execute(query, [agendamentoId]);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao marcar notificação ${agendamentoId}:`, error);
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
