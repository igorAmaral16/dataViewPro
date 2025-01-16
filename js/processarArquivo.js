let dadosProcessados = [];
let filtroAtivo = '';
let paginaAtual = 1; // Página inicial
let dadosPorPagina = 250; // Dados por página ajustado para 250
let ultimoScroll = window.scrollY;

window.addEventListener('scroll', () => {
    const rodape = document.getElementById('rodape');
    let atualScroll = window.scrollY;

    if (atualScroll > ultimoScroll) {
        // Rolando para baixo - exibe o rodapé
        rodape.style.bottom = '0';
    } else {
        // Rolando para cima - esconde o rodapé
        rodape.style.bottom = '-60px';
    }

    ultimoScroll = atualScroll;
});

// Lista de provedores de email gratuitos mais utilizados
const provedoresGratuitos = [
    'gmail', 'hotmail', 'yahoo', 'outlook', 'aol', 'icloud', 'live', 'mail.com', 'zoho', 'protonmail'
];

// Função para exibir mensagens de erro
function exibirMensagemErro(mensagem) {
    const barraProgresso = document.getElementById('barraProgresso');
    const descricaoProgresso = document.getElementById('descricaoProgresso');
    barraProgresso.style.display = 'block';
    descricaoProgresso.textContent = mensagem;
    setTimeout(() => barraProgresso.style.display = 'none', 3000); // Exibe por 3 segundos
}

// Função para processar o arquivo
function processarArquivo() {
  const arquivoInput = document.getElementById('arquivoInput');
  const barraProgresso = document.getElementById('barraProgresso');
  const progresso = document.getElementById('progresso');
  const descricaoProgresso = document.getElementById('descricaoProgresso');

  if (!arquivoInput.files[0]) {
      return; // Não faz nada se nenhum arquivo for selecionado
  }

  barraProgresso.style.display = 'block';
  progresso.value = 0;
  descricaoProgresso.textContent = 'Processando arquivo...';

  const reader = new FileReader();

  reader.onload = function (e) {
      const conteudo = e.target.result;

      // Verifica se o arquivo é um .docx
      if (arquivoInput.files[0].type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Usando uma biblioteca como mammoth.js para extrair o conteúdo de arquivos .docx
          const docxContent = e.target.result;

          mammoth.extractRawText({ arrayBuffer: docxContent })
              .then(function (result) {
                  const textoExtraido = result.value; // Aqui é onde pegamos o texto
                  processarTexto(textoExtraido); // Processa o texto extraído
              });
      } else {
          // Para arquivos .txt, processamos o texto diretamente
          processarTexto(conteudo); // Passa o conteúdo para processarTexto
      }
  };

  reader.onerror = function () {
      barraProgresso.style.display = 'none'; // Caso haja erro, esconde a barra de progresso
  };

  try {
      reader.readAsText(arquivoInput.files[0], 'utf-8'); // Lê o arquivo como texto (para arquivos .txt)
  } catch (e) {
      barraProgresso.style.display = 'none'; // Caso ocorra um erro na leitura, esconde a barra
  }
}

// Função para processar o texto extraído
function processarArquivo() {
  const arquivoInput = document.getElementById('arquivoInput');
  const barraProgresso = document.getElementById('barraProgresso');
  const progresso = document.getElementById('progresso');
  const descricaoProgresso = document.getElementById('descricaoProgresso');

  if (!arquivoInput.files[0]) {
      exibirMensagemErro('Erro: Nenhum arquivo selecionado!');
      return;
  }

  barraProgresso.style.display = 'block';
  progresso.value = 0;
  descricaoProgresso.textContent = 'Processando arquivo...';

  const reader = new FileReader();
  const arquivo = arquivoInput.files[0];

  // Verifica se o arquivo é .docx ou .txt
  const extensao = arquivo.name.split('.').pop().toLowerCase();

  reader.onload = function (e) {
      const resultado = e.target.result;

      if (extensao === 'docx') {
          // Processar o arquivo .docx com o Mammoth
          mammoth.extractRawText({ arrayBuffer: resultado })
              .then(function (result) {
                  const textoProcessado = result.value;

                  if (!textoProcessado) {
                      exibirMensagemErro('Erro: O arquivo .docx não contém conteúdo de texto válido.');
                      return;
                  }

                  processarTexto(textoProcessado);
              })
              .catch(function (error) {
                  exibirMensagemErro('Erro ao processar o arquivo .docx.');
              });
      } else if (extensao === 'txt') {
          // Processar o arquivo .txt diretamente como texto
          const textoProcessado = resultado;

          if (!textoProcessado) {
              exibirMensagemErro('Erro: O arquivo .txt está vazio.');
              return;
          }

          processarTexto(textoProcessado);
      } else {
          exibirMensagemErro('Erro: Formato de arquivo não suportado. Por favor, selecione um arquivo .docx ou .txt.');
      }
  };

  reader.onerror = function () {
      exibirMensagemErro('Erro: Não foi possível ler o arquivo.');
  };

  try {
      if (extensao === 'txt') {
          // Para arquivos .txt, use readAsText
          reader.readAsText(arquivo);
      } else {
          // Para arquivos .docx, use readAsArrayBuffer
          reader.readAsArrayBuffer(arquivo);
      }
  } catch (e) {
      exibirMensagemErro('Erro: Falha no processamento do arquivo.');
  }

  function processarTexto(texto) {
      // Verifica se o conteúdo é uma string e a divide
      if (typeof texto !== 'string') {
          exibirMensagemErro('Erro: O conteúdo do arquivo não é uma string válida.');
          return;
      }

      const linhas = texto.split('\n');
      let dados = [];

      for (let i = 0; i < linhas.length; i++) {
          const partes = linhas[i].split('|');
          const email = partes[0]?.trim() || "NULL";
          const senha = partes[1]?.trim() || "NULL";

          let provedor = "NULL";
          if (email !== "NULL" && email.includes('@')) {
              const dominio = email.split('@')[1];
              provedor = dominio ? dominio.split('.')[0] : "NULL";
          }

          if (email !== "NULL" && senha !== "NULL" && provedor !== "NULL") {
              dados.push({ email, senha, provedor });
          }

          progresso.value = ((i + 1) / linhas.length) * 100;
          descricaoProgresso.textContent = `Processando linha ${i + 1} de ${linhas.length}`;
      }

      dadosProcessados = dados;
      atualizarTabela();

      descricaoProgresso.textContent = 'Processamento concluído';
      setTimeout(() => barraProgresso.style.display = 'none', 500);
  }
}

// Função para atualizar a tabela após o processamento, considerando a paginação
function atualizarTabela() {
    const tabela = document.getElementById('tabela-resultados');
    const tbody = tabela.querySelector('tbody');
    tbody.innerHTML = '';

    let dadosFiltrados = dadosProcessados;

    if (filtroAtivo && filtroAtivo !== 'all') {
        dadosFiltrados = dadosProcessados.filter(dado => dado.provedor === filtroAtivo);
    }

    // Calcular o intervalo de dados a ser exibido para a página atual
    const inicio = (paginaAtual - 1) * dadosPorPagina;
    const fim = paginaAtual * dadosPorPagina;
    const dadosParaExibir = dadosFiltrados.slice(inicio, fim);

    dadosParaExibir.forEach(dado => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${dado.email}</td><td>${dado.senha}</td><td>${dado.provedor}</td>`;
        tbody.appendChild(tr);
    });

    tabela.style.display = 'block';
    configurarPaginas(dadosFiltrados.length); // Atualiza os controles de paginação
}

// Função para configurar os controles de navegação da página
// Função para configurar os controles de navegação da página
// Função para configurar os controles de navegação da página
function configurarPaginas(totalDados) {
  const totalPaginas = Math.ceil(totalDados / dadosPorPagina);
  const paginacaoContainer = document.querySelector('.paginacao');
  paginacaoContainer.innerHTML = ''; // Limpa os botões de paginação

  // Botões de navegação: Primeira e Anterior
  const btnPrimeiraPagina = criarBotao('<<', 1, paginaAtual === 1);
  const btnAnterior = criarBotao('<', paginaAtual - 1, paginaAtual === 1);
  paginacaoContainer.appendChild(btnPrimeiraPagina);
  paginacaoContainer.appendChild(btnAnterior);

  // Exibir numeração das páginas (10 páginas ao redor da página atual)
  const numPaginasVisiveis = 10;
  let inicioPagina = Math.max(1, paginaAtual - Math.floor(numPaginasVisiveis / 2));
  let fimPagina = Math.min(totalPaginas, inicioPagina + numPaginasVisiveis - 1);

  // Ajustar para garantir que sempre exibiremos 10 páginas
  if (paginaAtual === totalPaginas) {
      inicioPagina = Math.max(1, totalPaginas - numPaginasVisiveis + 1);
      fimPagina = totalPaginas;
  }

  for (let i = inicioPagina; i <= fimPagina; i++) {
      const btnPagina = criarBotao(i, i, i === paginaAtual);
      paginacaoContainer.appendChild(btnPagina);
  }

  // Botões de navegação: Próxima e Última
  const btnProxima = criarBotao('>', paginaAtual + 1, paginaAtual === totalPaginas);
  const btnUltimaPagina = criarBotao('>>', totalPaginas, paginaAtual === totalPaginas);
  paginacaoContainer.appendChild(btnProxima);
  paginacaoContainer.appendChild(btnUltimaPagina);
}

// Função auxiliar para criar os botões
function criarBotao(texto, pagina, desabilitado) {
  const botao = document.createElement('button');
  botao.innerText = texto;
  botao.disabled = desabilitado;
  botao.onclick = () => mudarPagina(pagina);
  return botao;
}


// Função para mudar a página
function mudarPagina(pagina) {
  const totalPaginas = Math.ceil(dadosProcessados.length / dadosPorPagina);
  if (pagina < 1 || pagina > totalPaginas) return;
  paginaAtual = pagina;
  atualizarTabela();
}

// Função para aplicar o filtro
function aplicarFiltro() {
    const filtroSelect = document.getElementById('filtroProvedor');
    filtroAtivo = filtroSelect.value;
    paginaAtual = 1;  // Resetar para a primeira página ao aplicar filtro
    atualizarTabela();
}

// Função para baixar os dados
function baixarTabela() {
    let dadosParaDownload = dadosProcessados;

    if (filtroAtivo && filtroAtivo !== 'all') {
        dadosParaDownload = dadosProcessados.filter(dado => dado.provedor === filtroAtivo);
    }

    const csvContent = "Email,S senha,Provedor\n" +
        dadosParaDownload.map(dado => `${dado.email},${dado.senha},${dado.provedor}`).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "dados.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Função para popular o filtro de provedores
function popularFiltro() {
    const filtroSelect = document.getElementById('filtroProvedor');
    filtroSelect.innerHTML = '<option value="all">Todos</option>'; // Adiciona a opção de todos

    // Adiciona os provedores gratuitos ao filtro
    provedoresGratuitos.forEach(provedor => {
        const option = document.createElement('option');
        option.value = provedor;
        option.textContent = provedor.charAt(0).toUpperCase() + provedor.slice(1);
        filtroSelect.appendChild(option);
    });
}

// Chama a função para popular o filtro quando a página for carregada
document.addEventListener('DOMContentLoaded', popularFiltro);

// Adicionando event listener ao filtro
document.getElementById('filtroProvedor').addEventListener('change', aplicarFiltro);
