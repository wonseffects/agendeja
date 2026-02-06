import dotenv from 'dotenv';
import WhatsAppBot from './whatsapp.js';
import { formatarTelefoneWhatsApp } from './utils.js';
import { delay } from './utils.js';

dotenv.config();

/**
 * Script para testar se um número específico está no WhatsApp
 */
async function testarNumero() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 TESTE DE NÚMERO WHATSAPP');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // COLOQUE SEU NÚMERO AQUI PARA TESTAR
    const numerosParaTestar = [
      '(44) 99819-3466',  // Formato do banco
      '44998193466',       // Sem formatação
      '5544998193466',     // Com DDI
    ];

    console.log('📋 Números que serão testados:');
    numerosParaTestar.forEach((num, index) => {
      const formatado = formatarTelefoneWhatsApp(num);
      console.log(`   ${index + 1}. ${num} → ${formatado}`);
    });

    console.log('\n🔌 Conectando WhatsApp...');
    const bot = new WhatsAppBot();
    await bot.iniciar();

    console.log('⏳ Aguardando conexão...');
    let tentativas = 0;
    while (!bot.estaConectado() && tentativas < 60) {
      await delay(1000);
      tentativas++;
      if (tentativas % 10 === 0) {
        console.log(`   ${tentativas}s aguardando...`);
      }
    }

    if (!bot.estaConectado()) {
      throw new Error('Timeout: WhatsApp não conectou em 60s');
    }

    console.log('✅ WhatsApp conectado!\n');

    // Testa cada número
    for (const numero of numerosParaTestar) {
      console.log('\n─────────────────────────────────────────────────');
      console.log(`🔍 Testando: ${numero}`);
      console.log('─────────────────────────────────────────────────');
      
      const numeroFormatado = formatarTelefoneWhatsApp(numero);
      console.log(`📱 Formato WhatsApp: ${numeroFormatado}`);

      try {
        const checkResult = await bot.sock.onWhatsApp(numeroFormatado);
        
        console.log('\n📊 Resultado da verificação:');
        console.log(JSON.stringify(checkResult, null, 2));

        if (!checkResult || checkResult.length === 0) {
          console.log('\n❌ Número NÃO encontrado no WhatsApp');
          console.log('💡 Possíveis motivos:');
          console.log('   - Número não tem WhatsApp');
          console.log('   - Formato incorreto');
          console.log('   - Problema de conexão');
        } else {
          const [result] = checkResult;
          if (result?.exists) {
            console.log(`\n✅ NÚMERO EXISTE NO WHATSAPP!`);
            console.log(`   JID: ${result.jid}`);
            
            // Pergunta se quer enviar mensagem de teste
            console.log('\n📤 Enviando mensagem de teste em 3 segundos...');
            console.log('   (Ctrl+C para cancelar)');
            await delay(3000);
            
            const mensagem = `🧪 *Teste de Bot WhatsApp*\n\nOlá! Esta é uma mensagem de teste.\n\nSe você recebeu isso, significa que o bot está funcionando! ✅\n\n_Horário: ${new Date().toLocaleString('pt-BR')}_`;
            
            await bot.sock.sendMessage(result.jid, { text: mensagem });
            console.log('\n✅ Mensagem de teste ENVIADA!');
            console.log('📱 Verifique seu WhatsApp agora!');
          } else {
            console.log('\n❌ Número NÃO tem WhatsApp cadastrado');
          }
        }
      } catch (error) {
        console.log('\n❌ Erro ao verificar número:', error.message);
      }

      await delay(2000);
    }

    console.log('\n\n╔═══════════════════════════════════════════════════╗');
    console.log('║  🏁 TESTE CONCLUÍDO                               ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log('💡 DICAS:');
    console.log('1. Se nenhum número foi encontrado, teste com seu próprio número');
    console.log('2. Certifique-se que o WhatsApp está ativo no número');
    console.log('3. Formato correto: DDI (55) + DDD + Número (9 dígitos)');
    console.log('4. Exemplo: 5544998193466');

    await bot.desconectar();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  }
}

// Executa teste
testarNumero();
