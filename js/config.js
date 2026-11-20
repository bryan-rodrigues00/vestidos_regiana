/* ==========================================================
   ARQUIVO: js/config.js
   Dados comerciais da loja. Edite SOMENTE este arquivo para mudar
   telefone, nome, endereço e a frase automática do WhatsApp.
   ========================================================== */
window.CONFIG = {
  // INÍCIO: CONFIGURAÇÃO DO WHATSAPP (formato: 55 + DDD + número, só dígitos)
  whatsapp: "5562986549612",

  // INÍCIO: DADOS DA LOJA
  nomeLoja: "Atual Fashion Regiana",
  endereco: "Av. Goiás, S/N - Setor Norte Ferroviário, Goiânia - GO, 74063-225",
  horario: "Fecha às 18:30 (informe aqui os demais horários e dias)",

  // Texto da faixa rolante no topo do site
  aviso: "Atual Fashion Regiana · Escolha suas peças e finalize o pedido pelo WhatsApp",

  // INÍCIO: FRASES DO WHATSAPP
  // Frase do setor: aparece junto de CADA peça escolhida na mensagem.
  // {setor} é trocado automaticamente pelo nome do setor da peça.
  fraseSetor: "Escolhi esta peça no setor {setor} do catálogo.",
  abertura: "Olá! Gostaria de fazer um pedido na Atual Fashion Regiana.",
  fechamento: "Gostaria de confirmar a disponibilidade e combinar a entrega e a forma de pagamento."
};
