let dadosProcessados = [];
let filtroAtivo = '';
let processoCancelado = false; // Variável para controle do cancelamento
let paginaAtual = 1; // Página inicial
let dadosPorPagina = 500; // Dados por página

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
      exibirMensagemErro('Erro: Nenhum arquivo selecionado!');
      return;
  }

  barraProgresso.style.display = 'block';
  progresso.value = 0;
  descricaoProgresso.textContent = 'Processando arquivo...';

  const reader = new FileReader();

  reader.onload = function (e) {
      if (processoCancelado) return; // Se o processo foi cancelado, não continuar

      const linhas = e.target.result.split('\n');
      let dados = [];

      for (let i = 0; i < linhas.length; i++) {
          const partes = linhas[i].split('|');
          
          // Verificando se a linha está vazia ou faltando dados e substituindo por "NULL"
          const email = partes[0]?.trim() || "NULL";
          const senha = partes[1]?.trim() || "NULL";
          
          // Corrigindo a extração do provedor
          let provedor = "NULL";
          if (email !== "NULL" && email.includes('@')) {
              const dominio = email.split('@')[1];
              provedor = dominio ? dominio.split('.')[0] : "NULL"; // Pega a parte antes do primeiro ponto
          }

          // Se algum dado estiver faltando, não adiciona à tabela
          if (email !== "NULL" && senha !== "NULL" && provedor !== "NULL") {
              dados.push({ email, senha, provedor });
          }

          progresso.value = ((i + 1) / linhas.length) * 100;
          descricaoProgresso.textContent = `Processando linha ${i + 1} de ${linhas.length}`;
      }

      dadosProcessados = dados;
      atualizarTabela();  // Chama para atualizar a tabela com dados paginados

      descricaoProgresso.textContent = 'Processamento concluído';
      setTimeout(() => barraProgresso.style.display = 'none', 500);
  };

  reader.onerror = function () {
      exibirMensagemErro('Erro: Não foi possível ler o arquivo.');
      processoCancelado = true; // Marca o processo como cancelado
  };

  try {
      reader.readAsText(arquivoInput.files[0]);
  } catch (e) {
      exibirMensagemErro('Erro: Falha no processamento do arquivo.');
      processoCancelado = true;
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
function configurarPaginas(totalDados) {
  const totalPaginas = Math.ceil(totalDados / dadosPorPagina);
  const paginacaoContainer = document.querySelector('.paginacao');
  paginacaoContainer.innerHTML = ''; // Limpa os botões de paginação

  // Criar botão "<<"
  const btnPrimeiraPagina = document.createElement('button');
  btnPrimeiraPagina.innerText = '<<';
  btnPrimeiraPagina.disabled = paginaAtual === 1;
  btnPrimeiraPagina.onclick = () => mudarPagina(1);
  paginacaoContainer.appendChild(btnPrimeiraPagina);

  // Criar botão "<"
  const btnAnterior = document.createElement('button');
  btnAnterior.innerText = '<';
  btnAnterior.disabled = paginaAtual === 1;
  btnAnterior.onclick = () => mudarPagina(paginaAtual - 1);
  paginacaoContainer.appendChild(btnAnterior);

  // Exibir numeração das páginas (com 10 páginas ao redor da página atual)
  const numPaginasVisiveis = 10;
  let inicioPagina = Math.max(1, paginaAtual - Math.floor(numPaginasVisiveis / 2));
  let fimPagina = Math.min(totalPaginas, inicioPagina + numPaginasVisiveis - 1);

  for (let i = inicioPagina; i <= fimPagina; i++) {
      const btnPagina = document.createElement('button');
      btnPagina.innerText = i;
      btnPagina.classList.add(i === paginaAtual ? 'pagina-ativa' : '');
      btnPagina.onclick = () => mudarPagina(i);
      paginacaoContainer.appendChild(btnPagina);
  }

  // Criar botão ">"
  const btnProxima = document.createElement('button');
  btnProxima.innerText = '>';
  btnProxima.disabled = paginaAtual === totalPaginas;
  btnProxima.onclick = () => mudarPagina(paginaAtual + 1);
  paginacaoContainer.appendChild(btnProxima);

  // Criar botão ">>"
  const btnUltimaPagina = document.createElement('button');
  btnUltimaPagina.innerText = '>>';
  btnUltimaPagina.disabled = paginaAtual === totalPaginas;
  btnUltimaPagina.onclick = () => mudarPagina(totalPaginas);
  paginacaoContainer.appendChild(btnUltimaPagina);
}

// Função para mudar a página
function mudarPagina(pagina) {
  if (pagina < 1 || pagina > Math.ceil(dadosProcessados.length / dadosPorPagina)) return;
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
