/* ==========================================================
   ARQUIVO: js/app.js  |  Funcionalidades do site
   Não edite produtos aqui: produtos ficam no index.html.
   ========================================================== */
(function () {
  "use strict";
  var C = window.CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var brl = function (n) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  var esc = function (t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML.replace(/"/g, "&quot;"); };
  var lista = function (t) { return (t || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); };
  // Tamanhos: aceita "G, GG", "G; GG", "G | GG" e também "G E GG". Cores: use vírgula (ex.: Rosa, Preto).
  var splitTam = function (t) { return (t || "").split(/\s*[,;|]\s*|\s+e\s+/i).map(function (x) { return x.trim(); }).filter(Boolean); };
  var splitCor = function (t) { return (t || "").split(/\s*[,;|]\s*/).map(function (x) { return x.trim(); }).filter(Boolean); };
  var preco = function (t) { var n = parseFloat(String(t || "").replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; };

  // INÍCIO: CARRINHO SALVO NO NAVEGADOR (não se perde ao atualizar a página)
  var CHAVE = "regiana_carrinho", cart = [];
  try { cart = JSON.parse(localStorage.getItem(CHAVE)) || []; } catch (e) { cart = []; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(cart)); } catch (e) {} }

  // INÍCIO: WHATSAPP
  function abrirZap(texto) {
    if (!/^\d{12,13}$/.test(C.whatsapp || "")) { alert("O WhatsApp da loja ainda não foi configurado."); return false; }
    var url = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(texto);
    var w = window.open(url, "_blank", "noopener");
    if (!w) { window.location.href = url; }
    return true;
  }

  // INÍCIO: PREPARAR CARDS A PARTIR DO HTML
  var produtos = $$(".produto");
  var modoEditar = /editar/.test(location.search);
  produtos.forEach(function (card) {
    var d = card.dataset, nome = (d.nome || "").trim(), p0 = preco(d.preco), pr = preco(d.promo), p = (pr && pr < p0) ? pr : p0;
    var setor = card.closest(".setor").dataset.setor;
    if (!nome || !p) { // espaço ainda não preenchido: some para o público
      card.classList.add("vazio"); card.hidden = !modoEditar;
      card.innerHTML = '<div class="info"><p class="p-meta">Espaço livre (' + esc(d.id) + '). Preencha nome e preço no index.html.</p></div>';
      return;
    }
    var tams = splitTam(d.tamanhos), cores = splitCor(d.cores), disp = d.disponivel !== "nao";
    var fotos = lista(d.foto);
    card.innerHTML =
      '<div class="foto" data-zoom="' + esc(fotos[0] || "") + '">' + (fotos[0] ? '<img loading="lazy" src="' + esc(fotos[0]) + '" alt="' + esc(nome) + '">' : "Foto em breve") + "</div>" +
      '<div class="info"><span class="selo' + (disp ? "" : " indisp") + '">' + (disp ? "Consulte disponibilidade" : "Indisponível") + "</span>" +
      '<h3 class="p-nome">' + esc(nome) + "</h3>" +
      (d.desc ? '<p class="p-desc">' + esc(d.desc) + "</p>" : "") +
      '<p class="p-preco">' + (p < p0 ? "<s>" + brl(p0) + "</s> " : "") + brl(p) + "</p>" +
      '<div class="opcoes">' +
      (tams.length ? '<div><label>Tamanho<select class="o-tam">' + tams.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("") + "</select></label></div>" : "") +
      (cores.length ? '<div><label>Cor<select class="o-cor">' + cores.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("") + "</select></label></div>" : "") +
      '<div><label>Quantidade<input class="o-qtd" type="number" min="1" max="20" value="1"></label></div>' +
      '<div class="largo"><label>Observações<input class="o-obs" maxlength="120" placeholder="Opcional"></label></div></div>' +
      '<button type="button" class="btn btn-bloco b-add"' + (disp ? "" : " disabled") + ">Adicionar ao carrinho</button>" +
      '<button type="button" class="btn btn-claro btn-bloco b-det">Ver detalhes</button><a href="#" class="link-zap b-zap">Consultar esta peça pelo WhatsApp</a></div>';

    $(".b-add", card).addEventListener("click", function () {
      var q = Math.max(1, Math.min(20, parseInt($(".o-qtd", card).value, 10) || 1));
      var it = { id: d.id, nome: nome, setor: setor, preco: p, tam: $(".o-tam", card) ? $(".o-tam", card).value : "", cor: $(".o-cor", card) ? $(".o-cor", card).value : "", qtd: q, obs: $(".o-obs", card).value.trim(), foto: fotos[0] || "", tams: tams, cores: cores };
      var ja = cart.filter(function (x) { return x.id === it.id && x.tam === it.tam && x.cor === it.cor && x.obs === it.obs; })[0];
      if (ja) { ja.qtd = Math.min(20, ja.qtd + q); } else { cart.push(it); }
      salvar(); desenhar(); abrir();
    });
    $(".b-det", card).addEventListener("click", function () { detalhes(card); });
    $(".b-zap", card).addEventListener("click", function (e) {
      e.preventDefault();
      abrirZap("Olá! Gostaria de saber mais sobre o vestido " + nome + " anunciado no catálogo (setor " + setor + ").");
    });
  });

  // INÍCIO: PREÇO EFETIVO E DETALHES DO PRODUTO (janela)
  function efetivo(d) { var a = preco(d.preco), b = preco(d.promo); return b && b < a ? b : a; }
  function detalhes(card) {
    var d = card.dataset, fotos = lista(d.foto), z = document.createElement("div"), disp = d.disponivel !== "nao";
    var ef = efetivo(d), orig = preco(d.preco);
    z.className = "zoom";
    z.innerHTML = '<div class="detalhe" role="dialog" aria-modal="true" aria-label="Detalhes do produto">' +
      '<button type="button" class="fechar-det" aria-label="Fechar">×</button>' +
      "<div>" + (fotos.length ? '<img class="det-principal" src="' + esc(fotos[0]) + '" alt="' + esc(d.nome) + '">' : '<div class="foto">Foto em breve</div>') +
      (fotos.length > 1 ? '<div class="miniaturas">' + fotos.map(function (f) { return '<img src="' + esc(f) + '" alt="Outra foto de ' + esc(d.nome) + '">'; }).join("") + "</div>" : "") + "</div>" +
      "<div><h3>" + esc(d.nome) + '</h3><p class="p-preco">' + (ef < orig ? "<s>" + brl(orig) + "</s> " : "") + brl(ef) + "</p>" +
      (d.desc ? "<p>" + esc(d.desc) + "</p>" : "") + (d.detalhes ? '<p class="p-meta">' + esc(d.detalhes) + "</p>" : "") +
      '<p class="p-meta">Tamanhos: ' + (esc(splitTam(d.tamanhos).join(", ")) || "consulte") + " · Cores: " + (esc(splitCor(d.cores).join(", ")) || "consulte") + "</p>" +
      '<p class="p-meta">' + (disp ? "A disponibilidade é confirmada pela Regina." : "Indisponível no momento.") + "</p>" +
      '<button type="button" class="btn btn-bloco ir-opcoes">Escolher opções e adicionar</button></div></div>';
    z.addEventListener("click", function (e) {
      var t = e.target;
      if (t === z || t.classList.contains("fechar-det")) { z.remove(); }
      else if (t.closest(".miniaturas") && t.tagName === "IMG") { $(".det-principal", z).src = t.src; }
      else if (t.classList.contains("ir-opcoes")) { z.remove(); card.scrollIntoView({ block: "center" }); var s = $(".o-tam", card) || $(".o-qtd", card); if (s) s.focus(); }
    });
    document.body.appendChild(z);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var m = $(".zoom"); if (m) m.remove(); } });

  // INÍCIO: AMPLIAR FOTO
  document.addEventListener("click", function (e) {
    var f = e.target.closest && e.target.closest("[data-zoom]");
    if (!f || !f.dataset.zoom) return;
    var z = document.createElement("div"); z.className = "zoom"; z.innerHTML = '<img alt="Foto ampliada" src="' + esc(f.dataset.zoom) + '">';
    z.addEventListener("click", function () { z.remove(); }); document.body.appendChild(z);
  });

  // INÍCIO: CARRINHO (desenho e controles)
  var painel = $("#carrinho"), fundo = $("#fundo"), corpo = $("#carrinho-itens"), form = $("#form-pedido");
  function abrir() { painel.classList.add("aberto"); fundo.hidden = false; painel.setAttribute("aria-hidden", "false"); }
  function fechar() { painel.classList.remove("aberto"); fundo.hidden = true; painel.setAttribute("aria-hidden", "true"); }
  function total() { return cart.reduce(function (s, i) { return s + i.preco * i.qtd; }, 0); }
  function desenhar() {
    var qt = cart.reduce(function (s, i) { return s + i.qtd; }, 0);
    $("#contador").textContent = qt; $("#pill-total").textContent = brl(total());
    $("#total").textContent = brl(total());
    $("#btn-continuar").disabled = cart.length === 0;
    if (!cart.length) { corpo.innerHTML = '<p class="sem-resultado">Seu carrinho está vazio. Escolha um vestido no catálogo.</p>'; return; }
    corpo.innerHTML = cart.map(function (i, n) {
      return '<div class="item" data-n="' + n + '">' + (i.foto ? '<img src="' + esc(i.foto) + '" alt="' + esc(i.nome) + '">' : '<div class="mini"></div>') +
        "<div><h4>" + esc(i.nome) + '</h4><p class="p-meta">' + esc(i.setor) + " · " + brl(i.preco) + "</p>" +
        '<div class="controles">' +
        (i.tams.length ? '<select data-campo="tam" aria-label="Tamanho">' + i.tams.map(function (t) { return "<option" + (t === i.tam ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select>" : "") +
        (i.cores.length ? '<select data-campo="cor" aria-label="Cor">' + i.cores.map(function (t) { return "<option" + (t === i.cor ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select>" : "") +
        '<span class="qtd"><button type="button" data-acao="menos" aria-label="Diminuir">−</button> <b>' + i.qtd + '</b> <button type="button" data-acao="mais" aria-label="Aumentar">+</button></span>' +
        '<button type="button" class="remover" data-acao="rem">Remover</button></div>' +
        (i.obs ? '<p class="p-meta">Obs.: ' + esc(i.obs) + "</p>" : "") + "<p><b>" + brl(i.preco * i.qtd) + "</b></p></div></div>";
    }).join("");
  }
  corpo.addEventListener("click", function (e) {
    var b = e.target.closest("[data-acao]"); if (!b) return;
    var n = +b.closest(".item").dataset.n, a = b.dataset.acao;
    if (a === "mais") cart[n].qtd = Math.min(20, cart[n].qtd + 1);
    if (a === "menos") cart[n].qtd = Math.max(1, cart[n].qtd - 1);
    if (a === "rem") cart.splice(n, 1);
    salvar(); desenhar();
  });
  corpo.addEventListener("change", function (e) {
    var s = e.target.closest("[data-campo]"); if (!s) return;
    cart[+s.closest(".item").dataset.n][s.dataset.campo] = s.value; salvar(); desenhar();
  });
  $("#btn-sacola").addEventListener("click", abrir);
  $("#fechar-carrinho").addEventListener("click", fechar);
  fundo.addEventListener("click", fechar);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fechar(); });

  // INÍCIO: MINI CADASTRO + MONTAGEM DA MENSAGEM
  var abertoEm = 0;
  $("#btn-continuar").addEventListener("click", function () {
    if (!cart.length) return;
    $("#etapa-itens").hidden = true; form.hidden = false; $("#btn-continuar").hidden = true; abertoEm = Date.now();
  });
  $("#btn-voltar").addEventListener("click", function () { form.hidden = true; $("#etapa-itens").hidden = false; $("#btn-continuar").hidden = false; });

  function montarMensagem(d) {
    var L = [C.abertura, "", "*MEU PEDIDO*"];
    cart.forEach(function (i, n) {
      L.push("Peça " + (n + 1) + ": " + i.nome);
      L.push(C.fraseSetor.replace("{setor}", i.setor));
      if (i.tam) L.push("Tamanho: " + i.tam);
      if (i.cor) L.push("Cor: " + i.cor);
      L.push("Quantidade: " + i.qtd);
      L.push("Preço unitário: " + brl(i.preco));
      if (i.obs) L.push("Observação: " + i.obs);
      L.push("");
    });
    L.push("Subtotal estimado: " + brl(total()), "", "*MEUS DADOS*", "Nome: " + d.nome, "Celular: " + d.cel,
      "Endereço: " + d.rua + ", " + d.num + " - " + d.bairro + ", " + d.cidade + " - CEP " + d.cep);
    if (d.comp) L.push("Complemento/referência: " + d.comp);
    if (d.msg) L.push("", "*MENSAGEM*", d.msg);
    L.push("", C.fechamento);
    return L.join("\n");
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(form), g = function (k) { return String(f.get(k) || "").trim(); }, erro = $("#erro-form");
    var d = { nome: g("nome"), cel: g("cel"), rua: g("rua"), num: g("num"), bairro: g("bairro"), cidade: g("cidade"), cep: g("cep"), comp: g("comp"), msg: g("msg") };
    var cel = d.cel.replace(/\D/g, ""), cep = d.cep.replace(/\D/g, "");
    if (g("site")) return;                                   // anti-spam: campo isca
    if (Date.now() - abertoEm < 3000) { erro.textContent = "Aguarde alguns segundos e envie novamente."; return; }
    var ult = 0; try { ult = +localStorage.getItem("regiana_ult") || 0; } catch (x) {}
    if (Date.now() - ult < 10000) { erro.textContent = "Aguarde 10 segundos para enviar de novo."; return; }
    if (!cart.length) { erro.textContent = "Seu carrinho está vazio."; return; }
    if (d.nome.length < 5 || d.nome.indexOf(" ") < 0) { erro.textContent = "Informe seu nome completo."; return; }
    if (!/^\d{10,11}$/.test(cel)) { erro.textContent = "Informe o celular com DDD."; return; }
    if (cep.length !== 8) { erro.textContent = "O CEP deve ter 8 números."; return; }
    if (!d.rua || !d.num || !d.bairro || !d.cidade) { erro.textContent = "Preencha rua, número, bairro e cidade."; return; }
    if (!f.get("lgpd")) { erro.textContent = "Marque o aviso de privacidade para continuar."; return; }
    erro.textContent = "";
    d.cel = cel.length === 11 ? "(" + cel.slice(0, 2) + ") " + cel.slice(2, 7) + "-" + cel.slice(7) : "(" + cel.slice(0, 2) + ") " + cel.slice(2, 6) + "-" + cel.slice(6);
    d.cep = cep.slice(0, 5) + "-" + cep.slice(5);
    if (abrirZap(montarMensagem(d))) { try { localStorage.setItem("regiana_ult", Date.now()); } catch (x) {} }
  });

  // INÍCIO: BUSCA E FILTROS
  var chipAtivo = "";
  function filtrar() {
    var q = $("#f-busca").value.toLowerCase().trim(), cat = $("#f-cat").value, tam = $("#f-tam").value, cor = $("#f-cor").value, ordem = $("#f-ordem").value, max = preco($("#f-preco").value), so = $("#f-disp").checked, achou = 0;
    $$(".grade").forEach(function (g) {
      $$(".produto", g).sort(function (a, b) {
        if (ordem === "menor") return efetivo(a.dataset) - efetivo(b.dataset);
        if (ordem === "maior") return efetivo(b.dataset) - efetivo(a.dataset);
        return a.dataset.id < b.dataset.id ? -1 : 1;
      }).forEach(function (c) { g.appendChild(c); });
    });
    produtos.forEach(function (c) {
      if (c.classList.contains("vazio")) return;
      var d = c.dataset, ok = (!q || (d.nome + " " + d.desc + " " + d.cores + " " + d.detalhes).toLowerCase().indexOf(q) >= 0) && (!cat || d.categoria === cat) &&
        (!tam || splitTam(d.tamanhos).indexOf(tam) >= 0) && (!cor || splitCor(d.cores).indexOf(cor) >= 0) && (!max || efetivo(d) <= max) && (!so || d.disponivel !== "nao") &&
        (!chipAtivo || (chipAtivo === "promo" ? (preco(d.promo) > 0 && preco(d.promo) < preco(d.preco)) : d[chipAtivo] === "sim"));
      c.hidden = !ok; if (ok) achou++;
    });
    $$(".setor").forEach(function (s) { s.hidden = !modoEditar && !$$(".produto:not([hidden])", s).length; });
    $("#sem-resultado").hidden = achou > 0 || modoEditar;
  }
  var coresTodas = {}, nomesVistos = {}, sug = $("#sugestoes");
  produtos.forEach(function (c) {
    if (c.classList.contains("vazio")) return;
    splitCor(c.dataset.cores).forEach(function (t) { coresTodas[t] = 1; });
    var nomeSug = (c.dataset.nome || "").trim();
    if (!nomesVistos[nomeSug.toLowerCase()]) { nomesVistos[nomeSug.toLowerCase()] = 1; sug.insertAdjacentHTML("beforeend", '<option value="' + esc(nomeSug) + '">'); }
  });
  Object.keys(coresTodas).forEach(function (t) { $("#f-cor").insertAdjacentHTML("beforeend", "<option>" + esc(t) + "</option>"); });
  var tamanhos = {};
  produtos.forEach(function (c) { splitTam(c.dataset.tamanhos).forEach(function (t) { tamanhos[t] = 1; }); });
  Object.keys(tamanhos).forEach(function (t) { $("#f-tam").insertAdjacentHTML("beforeend", "<option>" + esc(t) + "</option>"); });
  $$("section.setor").forEach(function (s) { $("#f-cat").insertAdjacentHTML("beforeend", '<option value="' + esc(s.dataset.cat) + '">' + esc(s.dataset.setor) + "</option>"); });
  ["f-busca", "f-cat", "f-tam", "f-cor", "f-ordem", "f-preco", "f-disp"].forEach(function (id) { $("#" + id).addEventListener("input", filtrar); });
  filtrar();

  // INÍCIO: MENU, CABEÇALHO E INDICADOR DE SEÇÃO
  $("#btn-menu").addEventListener("click", function () { var a = $("#menu").classList.toggle("aberto"); this.setAttribute("aria-expanded", a); });
  $$("#menu a").forEach(function (a) { a.addEventListener("click", function () { $("#menu").classList.remove("aberto"); }); });
  window.addEventListener("scroll", function () { $(".cabecalho").classList.toggle("rolou", window.scrollY > 10); }, { passive: true });
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { $$("#menu a").forEach(function (a) { a.classList.toggle("ativo", a.getAttribute("href") === "#" + en.target.id); }); } });
    }, { rootMargin: "-40% 0px -55% 0px" });
    $$("main section[id]").forEach(function (s) { obs.observe(s); });
  }

  // INÍCIO: TEXTOS DA LOJA VINDOS DO CONFIG
  $$("[data-cfg]").forEach(function (el) { el.textContent = C[el.dataset.cfg] || ""; });
  $$("[data-zap]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); abrirZap("Olá! Gostaria de atendimento na " + C.nomeLoja + "."); }); });
  // INÍCIO: PADRÃO DA LOJA — FAIXA, MENU DE SETORES, CÍRCULOS, FILTROS RÁPIDOS, BUSCA E BANNERS
  var faixa = $("#faixa");
  if (faixa) { var tx = "<span>" + esc(C.aviso) + "</span>"; faixa.innerHTML = tx + tx + tx + tx + tx + tx; }

  // Filtros rápidos (só aparecem se existir algum produto marcado)
  $$("#chips button").forEach(function (b) {
    var k = b.dataset.chip;
    var tem = produtos.some(function (c) {
      if (c.classList.contains("vazio")) return false;
      return k === "promo" ? (preco(c.dataset.promo) > 0 && preco(c.dataset.promo) < preco(c.dataset.preco)) : c.dataset[k] === "sim";
    });
    if (k && !tem) b.hidden = true;
    b.addEventListener("click", function () {
      chipAtivo = k;
      $$("#chips button").forEach(function (x) { x.classList.toggle("on", x === b); });
      filtrar();
    });
  });

  // Busca do cabeçalho conectada ao filtro do catálogo
  $("#busca-topo").addEventListener("input", function () { $("#f-busca").value = this.value; filtrar(); });
  $("#busca-topo").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("#catalogo").scrollIntoView(); } });

  // Banners: só aparecem os que tiverem data-img preenchido no HTML
  var slides = $$("#car .slide").filter(function (s) { return s.dataset.img; });
  $$("#car .slide").forEach(function (s) { if (!s.dataset.img) s.remove(); });
  if (slides.length) {
    slides.forEach(function (s) {
      var t = s.dataset.titulo;
      s.innerHTML = "<picture>" + (s.dataset.imgMobile ? '<source media="(max-width:700px)" srcset="' + esc(s.dataset.imgMobile) + '">' : "") +
        '<img src="' + esc(s.dataset.img) + '" alt="' + esc(t || "Destaque da loja") + '"></picture>' +
        (t ? '<span class="slide-txt">' + esc(t) + (s.dataset.subtitulo ? "<small>" + esc(s.dataset.subtitulo) + "</small>" : "") + "</span>" : "");
      if (s.dataset.link) s.href = s.dataset.link;
    });
    $("#banners").hidden = false;
    var trilho = $("#car-trilho"), pos = 0;
    var mover = function (d) { pos = (pos + d + slides.length) % slides.length; trilho.scrollTo({ left: pos * trilho.clientWidth, behavior: "smooth" }); };
    if (slides.length > 1) {
      $("#car-ant").addEventListener("click", function () { mover(-1); });
      $("#car-prox").addEventListener("click", function () { mover(1); });
      trilho.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") mover(-1); if (e.key === "ArrowRight") mover(1); });
      var pausado = false;
      trilho.addEventListener("mouseenter", function () { pausado = true; });
      trilho.addEventListener("mouseleave", function () { pausado = false; });
      if (!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) { setInterval(function () { if (!pausado) mover(1); }, 5000); }
    } else { $("#car-ant").hidden = true; $("#car-prox").hidden = true; }
  }

  // INÍCIO: FOTO DE DESTAQUE ROTATIVA (passa os vestidos publicados, um por vez, a cada 10 segundos)
  var heroEl = $("#hero-foto");
  var heroItens = produtos.filter(function (c) { return !c.classList.contains("vazio") && lista(c.dataset.foto)[0]; });
  if (heroEl && heroItens.length) {
    heroEl.innerHTML = '<img class="hero-img" alt=""><img class="hero-img" alt=""><div class="hero-legenda"></div>';
    heroEl.setAttribute("role", "button"); heroEl.setAttribute("tabindex", "0"); heroEl.setAttribute("aria-label", "Ver detalhes do vestido em destaque");
    var heroImgs = $$(".hero-img", heroEl), heroLegenda = $(".hero-legenda", heroEl), heroPos = 0, heroTopo = 0;
    var mostrarHero = function (n) {
      var d = heroItens[n].dataset, prox = heroImgs[1 - heroTopo];
      prox.src = lista(d.foto)[0]; prox.alt = d.nome;
      prox.classList.add("on"); heroImgs[heroTopo].classList.remove("on"); heroTopo = 1 - heroTopo;
      heroLegenda.innerHTML = esc(d.nome) + "<small>" + brl(efetivo(d)) + "</small>";
    };
    mostrarHero(0);
    if (heroItens.length > 1) {
      setInterval(function () { heroPos = (heroPos + 1) % heroItens.length; mostrarHero(heroPos); }, 10000);
    }
    heroEl.addEventListener("click", function () { detalhes(heroItens[heroPos]); });
    heroEl.addEventListener("keydown", function (e) { if (e.key === "Enter") detalhes(heroItens[heroPos]); });
  }

  // INÍCIO: GUIA DE TAMANHOS (a foto vem de data-img no index.html; sem foto mostra um aviso)
  $$(".guia").forEach(function (g) {
    var src = (g.dataset.img || "").trim(), foto = $(".guia-foto", g), img = $("img", g);
    if (!foto || !img) return;
    var aviso = function (t) { foto.removeAttribute("data-zoom"); foto.style.cursor = "default"; foto.innerHTML = '<p style="margin:0;padding:1rem;color:#777078">' + t + "</p>"; };
    if (!src) { aviso("A foto do guia de tamanhos será colocada aqui. Em breve!"); return; }
    img.onerror = function () { aviso("Não foi possível carregar a foto do guia. Confira o nome do arquivo em data-img."); };
    img.src = src; foto.dataset.zoom = src;
  });

  // INÍCIO: ÍCONE DA ABA DO NAVEGADOR (favicon) — entra sozinho, sem precisar editar o index.html
  // Arquivos usados: favicon.ico (na pasta do site) e img/favicon.svg, img/favicon-32.png, img/apple-touch-icon.png
  $$('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach(function (l) { l.parentNode.removeChild(l); });
  [
    { rel: "icon", type: "image/svg+xml", href: "img/favicon.svg" },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "img/favicon-32.png" },
    { rel: "shortcut icon", href: "favicon.ico" },
    { rel: "apple-touch-icon", href: "img/apple-touch-icon.png" }
  ].forEach(function (a) {
    var l = document.createElement("link");
    Object.keys(a).forEach(function (k) { l.setAttribute(k, a[k]); });
    document.head.appendChild(l);
  });
  if (!$('meta[name="theme-color"]')) {
    var m = document.createElement("meta"); m.setAttribute("name", "theme-color"); m.setAttribute("content", "#F02D83"); document.head.appendChild(m);
  }

  desenhar();
})();/* ==========================================================
   ARQUIVO: js/app.js  |  Funcionalidades do site
   Não edite produtos aqui: produtos ficam no index.html.
   ========================================================== */
(function () {
  "use strict";
  var C = window.CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var brl = function (n) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  var esc = function (t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML.replace(/"/g, "&quot;"); };
  var lista = function (t) { return (t || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); };
  // Tamanhos: aceita "G, GG", "G; GG", "G | GG" e também "G E GG". Cores: use vírgula (ex.: Rosa, Preto).
  var splitTam = function (t) { return (t || "").split(/\s*[,;|]\s*|\s+e\s+/i).map(function (x) { return x.trim(); }).filter(Boolean); };
  var splitCor = function (t) { return (t || "").split(/\s*[,;|]\s*/).map(function (x) { return x.trim(); }).filter(Boolean); };
  var preco = function (t) { var n = parseFloat(String(t || "").replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; };

  // INÍCIO: CARRINHO SALVO NO NAVEGADOR (não se perde ao atualizar a página)
  var CHAVE = "regiana_carrinho", cart = [];
  try { cart = JSON.parse(localStorage.getItem(CHAVE)) || []; } catch (e) { cart = []; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(cart)); } catch (e) {} }

  // INÍCIO: WHATSAPP
  function abrirZap(texto) {
    if (!/^\d{12,13}$/.test(C.whatsapp || "")) { alert("O WhatsApp da loja ainda não foi configurado."); return false; }
    var url = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(texto);
    var w = window.open(url, "_blank", "noopener");
    if (!w) { window.location.href = url; }
    return true;
  }

  // INÍCIO: PREPARAR CARDS A PARTIR DO HTML
  var produtos = $$(".produto");
  var modoEditar = /editar/.test(location.search);
  produtos.forEach(function (card) {
    var d = card.dataset, nome = (d.nome || "").trim(), p0 = preco(d.preco), pr = preco(d.promo), p = (pr && pr < p0) ? pr : p0;
    var setor = card.closest(".setor").dataset.setor;
    if (!nome || !p) { // espaço ainda não preenchido: some para o público
      card.classList.add("vazio"); card.hidden = !modoEditar;
      card.innerHTML = '<div class="info"><p class="p-meta">Espaço livre (' + esc(d.id) + '). Preencha nome e preço no index.html.</p></div>';
      return;
    }
    var tams = splitTam(d.tamanhos), cores = splitCor(d.cores), disp = d.disponivel !== "nao";
    var fotos = lista(d.foto);
    card.innerHTML =
      '<div class="foto" data-zoom="' + esc(fotos[0] || "") + '">' + (fotos[0] ? '<img loading="lazy" src="' + esc(fotos[0]) + '" alt="' + esc(nome) + '">' : "Foto em breve") + "</div>" +
      '<div class="info"><span class="selo' + (disp ? "" : " indisp") + '">' + (disp ? "Consulte disponibilidade" : "Indisponível") + "</span>" +
      '<h3 class="p-nome">' + esc(nome) + "</h3>" +
      (d.desc ? '<p class="p-desc">' + esc(d.desc) + "</p>" : "") +
      '<p class="p-preco">' + (p < p0 ? "<s>" + brl(p0) + "</s> " : "") + brl(p) + "</p>" +
      '<div class="opcoes">' +
      (tams.length ? '<div><label>Tamanho<select class="o-tam">' + tams.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("") + "</select></label></div>" : "") +
      (cores.length ? '<div><label>Cor<select class="o-cor">' + cores.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("") + "</select></label></div>" : "") +
      '<div><label>Quantidade<input class="o-qtd" type="number" min="1" max="20" value="1"></label></div>' +
      '<div class="largo"><label>Observações<input class="o-obs" maxlength="120" placeholder="Opcional"></label></div></div>' +
      '<button type="button" class="btn btn-bloco b-add"' + (disp ? "" : " disabled") + ">Adicionar ao carrinho</button>" +
      '<button type="button" class="btn btn-claro btn-bloco b-det">Ver detalhes</button><a href="#" class="link-zap b-zap">Consultar esta peça pelo WhatsApp</a></div>';

    $(".b-add", card).addEventListener("click", function () {
      var q = Math.max(1, Math.min(20, parseInt($(".o-qtd", card).value, 10) || 1));
      var it = { id: d.id, nome: nome, setor: setor, preco: p, tam: $(".o-tam", card) ? $(".o-tam", card).value : "", cor: $(".o-cor", card) ? $(".o-cor", card).value : "", qtd: q, obs: $(".o-obs", card).value.trim(), foto: fotos[0] || "", tams: tams, cores: cores };
      var ja = cart.filter(function (x) { return x.id === it.id && x.tam === it.tam && x.cor === it.cor && x.obs === it.obs; })[0];
      if (ja) { ja.qtd = Math.min(20, ja.qtd + q); } else { cart.push(it); }
      salvar(); desenhar(); abrir();
    });
    $(".b-det", card).addEventListener("click", function () { detalhes(card); });
    $(".b-zap", card).addEventListener("click", function (e) {
      e.preventDefault();
      abrirZap("Olá! Gostaria de saber mais sobre o vestido " + nome + " anunciado no catálogo (setor " + setor + ").");
    });
  });

  // INÍCIO: PREÇO EFETIVO E DETALHES DO PRODUTO (janela)
  function efetivo(d) { var a = preco(d.preco), b = preco(d.promo); return b && b < a ? b : a; }
  function detalhes(card) {
    var d = card.dataset, fotos = lista(d.foto), z = document.createElement("div"), disp = d.disponivel !== "nao";
    var ef = efetivo(d), orig = preco(d.preco);
    z.className = "zoom";
    z.innerHTML = '<div class="detalhe" role="dialog" aria-modal="true" aria-label="Detalhes do produto">' +
      '<button type="button" class="fechar-det" aria-label="Fechar">×</button>' +
      "<div>" + (fotos.length ? '<img class="det-principal" src="' + esc(fotos[0]) + '" alt="' + esc(d.nome) + '">' : '<div class="foto">Foto em breve</div>') +
      (fotos.length > 1 ? '<div class="miniaturas">' + fotos.map(function (f) { return '<img src="' + esc(f) + '" alt="Outra foto de ' + esc(d.nome) + '">'; }).join("") + "</div>" : "") + "</div>" +
      "<div><h3>" + esc(d.nome) + '</h3><p class="p-preco">' + (ef < orig ? "<s>" + brl(orig) + "</s> " : "") + brl(ef) + "</p>" +
      (d.desc ? "<p>" + esc(d.desc) + "</p>" : "") + (d.detalhes ? '<p class="p-meta">' + esc(d.detalhes) + "</p>" : "") +
      '<p class="p-meta">Tamanhos: ' + (esc(splitTam(d.tamanhos).join(", ")) || "consulte") + " · Cores: " + (esc(splitCor(d.cores).join(", ")) || "consulte") + "</p>" +
      '<p class="p-meta">' + (disp ? "A disponibilidade é confirmada pela Regina." : "Indisponível no momento.") + "</p>" +
      '<button type="button" class="btn btn-bloco ir-opcoes">Escolher opções e adicionar</button></div></div>';
    z.addEventListener("click", function (e) {
      var t = e.target;
      if (t === z || t.classList.contains("fechar-det")) { z.remove(); }
      else if (t.closest(".miniaturas") && t.tagName === "IMG") { $(".det-principal", z).src = t.src; }
      else if (t.classList.contains("ir-opcoes")) { z.remove(); card.scrollIntoView({ block: "center" }); var s = $(".o-tam", card) || $(".o-qtd", card); if (s) s.focus(); }
    });
    document.body.appendChild(z);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var m = $(".zoom"); if (m) m.remove(); } });

  // INÍCIO: AMPLIAR FOTO
  document.addEventListener("click", function (e) {
    var f = e.target.closest && e.target.closest("[data-zoom]");
    if (!f || !f.dataset.zoom) return;
    var z = document.createElement("div"); z.className = "zoom"; z.innerHTML = '<img alt="Foto ampliada" src="' + esc(f.dataset.zoom) + '">';
    z.addEventListener("click", function () { z.remove(); }); document.body.appendChild(z);
  });

  // INÍCIO: CARRINHO (desenho e controles)
  var painel = $("#carrinho"), fundo = $("#fundo"), corpo = $("#carrinho-itens"), form = $("#form-pedido");
  function abrir() { painel.classList.add("aberto"); fundo.hidden = false; painel.setAttribute("aria-hidden", "false"); }
  function fechar() { painel.classList.remove("aberto"); fundo.hidden = true; painel.setAttribute("aria-hidden", "true"); }
  function total() { return cart.reduce(function (s, i) { return s + i.preco * i.qtd; }, 0); }
  function desenhar() {
    var qt = cart.reduce(function (s, i) { return s + i.qtd; }, 0);
    $("#contador").textContent = qt; $("#pill-total").textContent = brl(total());
    $("#total").textContent = brl(total());
    $("#btn-continuar").disabled = cart.length === 0;
    if (!cart.length) { corpo.innerHTML = '<p class="sem-resultado">Seu carrinho está vazio. Escolha um vestido no catálogo.</p>'; return; }
    corpo.innerHTML = cart.map(function (i, n) {
      return '<div class="item" data-n="' + n + '">' + (i.foto ? '<img src="' + esc(i.foto) + '" alt="' + esc(i.nome) + '">' : '<div class="mini"></div>') +
        "<div><h4>" + esc(i.nome) + '</h4><p class="p-meta">' + esc(i.setor) + " · " + brl(i.preco) + "</p>" +
        '<div class="controles">' +
        (i.tams.length ? '<select data-campo="tam" aria-label="Tamanho">' + i.tams.map(function (t) { return "<option" + (t === i.tam ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select>" : "") +
        (i.cores.length ? '<select data-campo="cor" aria-label="Cor">' + i.cores.map(function (t) { return "<option" + (t === i.cor ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select>" : "") +
        '<span class="qtd"><button type="button" data-acao="menos" aria-label="Diminuir">−</button> <b>' + i.qtd + '</b> <button type="button" data-acao="mais" aria-label="Aumentar">+</button></span>' +
        '<button type="button" class="remover" data-acao="rem">Remover</button></div>' +
        (i.obs ? '<p class="p-meta">Obs.: ' + esc(i.obs) + "</p>" : "") + "<p><b>" + brl(i.preco * i.qtd) + "</b></p></div></div>";
    }).join("");
  }
  corpo.addEventListener("click", function (e) {
    var b = e.target.closest("[data-acao]"); if (!b) return;
    var n = +b.closest(".item").dataset.n, a = b.dataset.acao;
    if (a === "mais") cart[n].qtd = Math.min(20, cart[n].qtd + 1);
    if (a === "menos") cart[n].qtd = Math.max(1, cart[n].qtd - 1);
    if (a === "rem") cart.splice(n, 1);
    salvar(); desenhar();
  });
  corpo.addEventListener("change", function (e) {
    var s = e.target.closest("[data-campo]"); if (!s) return;
    cart[+s.closest(".item").dataset.n][s.dataset.campo] = s.value; salvar(); desenhar();
  });
  $("#btn-sacola").addEventListener("click", abrir);
  $("#fechar-carrinho").addEventListener("click", fechar);
  fundo.addEventListener("click", fechar);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fechar(); });

  // INÍCIO: MINI CADASTRO + MONTAGEM DA MENSAGEM
  var abertoEm = 0;
  $("#btn-continuar").addEventListener("click", function () {
    if (!cart.length) return;
    $("#etapa-itens").hidden = true; form.hidden = false; $("#btn-continuar").hidden = true; abertoEm = Date.now();
  });
  $("#btn-voltar").addEventListener("click", function () { form.hidden = true; $("#etapa-itens").hidden = false; $("#btn-continuar").hidden = false; });

  function montarMensagem(d) {
    var L = [C.abertura, "", "*MEU PEDIDO*"];
    cart.forEach(function (i, n) {
      L.push("Peça " + (n + 1) + ": " + i.nome);
      L.push(C.fraseSetor.replace("{setor}", i.setor));
      if (i.tam) L.push("Tamanho: " + i.tam);
      if (i.cor) L.push("Cor: " + i.cor);
      L.push("Quantidade: " + i.qtd);
      L.push("Preço unitário: " + brl(i.preco));
      if (i.obs) L.push("Observação: " + i.obs);
      L.push("");
    });
    L.push("Subtotal estimado: " + brl(total()), "", "*MEUS DADOS*", "Nome: " + d.nome, "Celular: " + d.cel,
      "Endereço: " + d.rua + ", " + d.num + " - " + d.bairro + ", " + d.cidade + " - CEP " + d.cep);
    if (d.comp) L.push("Complemento/referência: " + d.comp);
    if (d.msg) L.push("", "*MENSAGEM*", d.msg);
    L.push("", C.fechamento);
    return L.join("\n");
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(form), g = function (k) { return String(f.get(k) || "").trim(); }, erro = $("#erro-form");
    var d = { nome: g("nome"), cel: g("cel"), rua: g("rua"), num: g("num"), bairro: g("bairro"), cidade: g("cidade"), cep: g("cep"), comp: g("comp"), msg: g("msg") };
    var cel = d.cel.replace(/\D/g, ""), cep = d.cep.replace(/\D/g, "");
    if (g("site")) return;                                   // anti-spam: campo isca
    if (Date.now() - abertoEm < 3000) { erro.textContent = "Aguarde alguns segundos e envie novamente."; return; }
    var ult = 0; try { ult = +localStorage.getItem("regiana_ult") || 0; } catch (x) {}
    if (Date.now() - ult < 10000) { erro.textContent = "Aguarde 10 segundos para enviar de novo."; return; }
    if (!cart.length) { erro.textContent = "Seu carrinho está vazio."; return; }
    if (d.nome.length < 5 || d.nome.indexOf(" ") < 0) { erro.textContent = "Informe seu nome completo."; return; }
    if (!/^\d{10,11}$/.test(cel)) { erro.textContent = "Informe o celular com DDD."; return; }
    if (cep.length !== 8) { erro.textContent = "O CEP deve ter 8 números."; return; }
    if (!d.rua || !d.num || !d.bairro || !d.cidade) { erro.textContent = "Preencha rua, número, bairro e cidade."; return; }
    if (!f.get("lgpd")) { erro.textContent = "Marque o aviso de privacidade para continuar."; return; }
    erro.textContent = "";
    d.cel = cel.length === 11 ? "(" + cel.slice(0, 2) + ") " + cel.slice(2, 7) + "-" + cel.slice(7) : "(" + cel.slice(0, 2) + ") " + cel.slice(2, 6) + "-" + cel.slice(6);
    d.cep = cep.slice(0, 5) + "-" + cep.slice(5);
    if (abrirZap(montarMensagem(d))) { try { localStorage.setItem("regiana_ult", Date.now()); } catch (x) {} }
  });

  // INÍCIO: BUSCA E FILTROS
  var chipAtivo = "";
  function filtrar() {
    var q = $("#f-busca").value.toLowerCase().trim(), cat = $("#f-cat").value, tam = $("#f-tam").value, cor = $("#f-cor").value, ordem = $("#f-ordem").value, max = preco($("#f-preco").value), so = $("#f-disp").checked, achou = 0;
    $$(".grade").forEach(function (g) {
      $$(".produto", g).sort(function (a, b) {
        if (ordem === "menor") return efetivo(a.dataset) - efetivo(b.dataset);
        if (ordem === "maior") return efetivo(b.dataset) - efetivo(a.dataset);
        return a.dataset.id < b.dataset.id ? -1 : 1;
      }).forEach(function (c) { g.appendChild(c); });
    });
    produtos.forEach(function (c) {
      if (c.classList.contains("vazio")) return;
      var d = c.dataset, ok = (!q || (d.nome + " " + d.desc + " " + d.cores + " " + d.detalhes).toLowerCase().indexOf(q) >= 0) && (!cat || d.categoria === cat) &&
        (!tam || splitTam(d.tamanhos).indexOf(tam) >= 0) && (!cor || splitCor(d.cores).indexOf(cor) >= 0) && (!max || efetivo(d) <= max) && (!so || d.disponivel !== "nao") &&
        (!chipAtivo || (chipAtivo === "promo" ? (preco(d.promo) > 0 && preco(d.promo) < preco(d.preco)) : d[chipAtivo] === "sim"));
      c.hidden = !ok; if (ok) achou++;
    });
    $$(".setor").forEach(function (s) { s.hidden = !modoEditar && !$$(".produto:not([hidden])", s).length; });
    $("#sem-resultado").hidden = achou > 0 || modoEditar;
  }
  var coresTodas = {}, nomesVistos = {}, sug = $("#sugestoes");
  produtos.forEach(function (c) {
    if (c.classList.contains("vazio")) return;
    splitCor(c.dataset.cores).forEach(function (t) { coresTodas[t] = 1; });
    var nomeSug = (c.dataset.nome || "").trim();
    if (!nomesVistos[nomeSug.toLowerCase()]) { nomesVistos[nomeSug.toLowerCase()] = 1; sug.insertAdjacentHTML("beforeend", '<option value="' + esc(nomeSug) + '">'); }
  });
  Object.keys(coresTodas).forEach(function (t) { $("#f-cor").insertAdjacentHTML("beforeend", "<option>" + esc(t) + "</option>"); });
  var tamanhos = {};
  produtos.forEach(function (c) { splitTam(c.dataset.tamanhos).forEach(function (t) { tamanhos[t] = 1; }); });
  Object.keys(tamanhos).forEach(function (t) { $("#f-tam").insertAdjacentHTML("beforeend", "<option>" + esc(t) + "</option>"); });
  $$("section.setor").forEach(function (s) { $("#f-cat").insertAdjacentHTML("beforeend", '<option value="' + esc(s.dataset.cat) + '">' + esc(s.dataset.setor) + "</option>"); });
  ["f-busca", "f-cat", "f-tam", "f-cor", "f-ordem", "f-preco", "f-disp"].forEach(function (id) { $("#" + id).addEventListener("input", filtrar); });
  filtrar();

  // INÍCIO: MENU, CABEÇALHO E INDICADOR DE SEÇÃO
  $("#btn-menu").addEventListener("click", function () { var a = $("#menu").classList.toggle("aberto"); this.setAttribute("aria-expanded", a); });
  $$("#menu a").forEach(function (a) { a.addEventListener("click", function () { $("#menu").classList.remove("aberto"); }); });
  window.addEventListener("scroll", function () { $(".cabecalho").classList.toggle("rolou", window.scrollY > 10); }, { passive: true });
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { $$("#menu a").forEach(function (a) { a.classList.toggle("ativo", a.getAttribute("href") === "#" + en.target.id); }); } });
    }, { rootMargin: "-40% 0px -55% 0px" });
    $$("main section[id]").forEach(function (s) { obs.observe(s); });
  }

  // INÍCIO: TEXTOS DA LOJA VINDOS DO CONFIG
  $$("[data-cfg]").forEach(function (el) { el.textContent = C[el.dataset.cfg] || ""; });
  $$("[data-zap]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); abrirZap("Olá! Gostaria de atendimento na " + C.nomeLoja + "."); }); });
  // INÍCIO: PADRÃO DA LOJA — FAIXA, MENU DE SETORES, CÍRCULOS, FILTROS RÁPIDOS, BUSCA E BANNERS
  var faixa = $("#faixa");
  if (faixa) { var tx = "<span>" + esc(C.aviso) + "</span>"; faixa.innerHTML = tx + tx + tx + tx + tx + tx; }

  // Filtros rápidos (só aparecem se existir algum produto marcado)
  $$("#chips button").forEach(function (b) {
    var k = b.dataset.chip;
    var tem = produtos.some(function (c) {
      if (c.classList.contains("vazio")) return false;
      return k === "promo" ? (preco(c.dataset.promo) > 0 && preco(c.dataset.promo) < preco(c.dataset.preco)) : c.dataset[k] === "sim";
    });
    if (k && !tem) b.hidden = true;
    b.addEventListener("click", function () {
      chipAtivo = k;
      $$("#chips button").forEach(function (x) { x.classList.toggle("on", x === b); });
      filtrar();
    });
  });

  // Busca do cabeçalho conectada ao filtro do catálogo
  $("#busca-topo").addEventListener("input", function () { $("#f-busca").value = this.value; filtrar(); });
  $("#busca-topo").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("#catalogo").scrollIntoView(); } });

  // Banners: só aparecem os que tiverem data-img preenchido no HTML
  var slides = $$("#car .slide").filter(function (s) { return s.dataset.img; });
  $$("#car .slide").forEach(function (s) { if (!s.dataset.img) s.remove(); });
  if (slides.length) {
    slides.forEach(function (s) {
      var t = s.dataset.titulo;
      s.innerHTML = "<picture>" + (s.dataset.imgMobile ? '<source media="(max-width:700px)" srcset="' + esc(s.dataset.imgMobile) + '">' : "") +
        '<img src="' + esc(s.dataset.img) + '" alt="' + esc(t || "Destaque da loja") + '"></picture>' +
        (t ? '<span class="slide-txt">' + esc(t) + (s.dataset.subtitulo ? "<small>" + esc(s.dataset.subtitulo) + "</small>" : "") + "</span>" : "");
      if (s.dataset.link) s.href = s.dataset.link;
    });
    $("#banners").hidden = false;
    var trilho = $("#car-trilho"), pos = 0;
    var mover = function (d) { pos = (pos + d + slides.length) % slides.length; trilho.scrollTo({ left: pos * trilho.clientWidth, behavior: "smooth" }); };
    if (slides.length > 1) {
      $("#car-ant").addEventListener("click", function () { mover(-1); });
      $("#car-prox").addEventListener("click", function () { mover(1); });
      trilho.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") mover(-1); if (e.key === "ArrowRight") mover(1); });
      var pausado = false;
      trilho.addEventListener("mouseenter", function () { pausado = true; });
      trilho.addEventListener("mouseleave", function () { pausado = false; });
      if (!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) { setInterval(function () { if (!pausado) mover(1); }, 5000); }
    } else { $("#car-ant").hidden = true; $("#car-prox").hidden = true; }
  }

  // INÍCIO: FOTO DE DESTAQUE ROTATIVA (passa os vestidos publicados, um por vez, a cada 10 segundos)
  var heroEl = $("#hero-foto");
  var heroItens = produtos.filter(function (c) { return !c.classList.contains("vazio") && lista(c.dataset.foto)[0]; });
  if (heroEl && heroItens.length) {
    heroEl.innerHTML = '<img class="hero-img" alt=""><img class="hero-img" alt=""><div class="hero-legenda"></div>';
    heroEl.setAttribute("role", "button"); heroEl.setAttribute("tabindex", "0"); heroEl.setAttribute("aria-label", "Ver detalhes do vestido em destaque");
    var heroImgs = $$(".hero-img", heroEl), heroLegenda = $(".hero-legenda", heroEl), heroPos = 0, heroTopo = 0;
    var mostrarHero = function (n) {
      var d = heroItens[n].dataset, prox = heroImgs[1 - heroTopo];
      prox.src = lista(d.foto)[0]; prox.alt = d.nome;
      prox.classList.add("on"); heroImgs[heroTopo].classList.remove("on"); heroTopo = 1 - heroTopo;
      heroLegenda.innerHTML = esc(d.nome) + "<small>" + brl(efetivo(d)) + "</small>";
    };
    mostrarHero(0);
    if (heroItens.length > 1) {
      setInterval(function () { heroPos = (heroPos + 1) % heroItens.length; mostrarHero(heroPos); }, 10000);
    }
    heroEl.addEventListener("click", function () { detalhes(heroItens[heroPos]); });
    heroEl.addEventListener("keydown", function (e) { if (e.key === "Enter") detalhes(heroItens[heroPos]); });
  }

  // INÍCIO: GUIA DE TAMANHOS (a foto vem de data-img no index.html; sem foto mostra um aviso)
  $$(".guia").forEach(function (g) {
    var src = (g.dataset.img || "").trim(), foto = $(".guia-foto", g), img = $("img", g);
    if (!foto || !img) return;
    var aviso = function (t) { foto.removeAttribute("data-zoom"); foto.style.cursor = "default"; foto.innerHTML = '<p style="margin:0;padding:1rem;color:#777078">' + t + "</p>"; };
    if (!src) { aviso("A foto do guia de tamanhos será colocada aqui. Em breve!"); return; }
    img.onerror = function () { aviso("Não foi possível carregar a foto do guia. Confira o nome do arquivo em data-img."); };
    img.src = src; foto.dataset.zoom = src;
  });

  // INÍCIO: ÍCONE DA ABA DO NAVEGADOR (favicon) — entra sozinho, sem precisar editar o index.html
  // Arquivos usados: favicon.ico (na pasta do site) e img/favicon.svg, img/favicon-32.png, img/apple-touch-icon.png
  $$('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach(function (l) { l.parentNode.removeChild(l); });
  [
    { rel: "icon", type: "image/svg+xml", href: "img/favicon.svg" },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "img/favicon-32.png" },
    { rel: "shortcut icon", href: "favicon.ico" },
    { rel: "apple-touch-icon", href: "img/apple-touch-icon.png" }
  ].forEach(function (a) {
    var l = document.createElement("link");
    Object.keys(a).forEach(function (k) { l.setAttribute(k, a[k]); });
    document.head.appendChild(l);
  });
  if (!$('meta[name="theme-color"]')) {
    var m = document.createElement("meta"); m.setAttribute("name", "theme-color"); m.setAttribute("content", "#F02D83"); document.head.appendChild(m);
  }

  desenhar();
})();
