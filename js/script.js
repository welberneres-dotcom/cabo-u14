// APAGUE OS "IMPORT" QUE ESTAVAM AQUI EM CIMA. COMECE DIRETO POR AQUI:

const firebaseConfig = {
  apiKey: "AIzaSyDkUlXPmG5_lNrBFmtX8Cbs05RzNmhnPME",
  authDomain: "cabo-u14.firebaseapp.com",
  databaseURL: "https://cabo-u14-default-rtdb.firebaseio.com",
  projectId: "cabo-u14",
  storageBucket: "cabo-u14.firebasestorage.app",
  messagingSenderId: "16025736692",
  appId: "1:16025736692:web:0de82d159a1a55100595a1",
  measurementId: "G-GTE4BHFGHK"
};

// Inicializa o Firebase usando a sintaxe Compat
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ... o restante do código que te mandei antes (equipesOriginal, dadosCompeticao, etc)

const equipesOriginal = [
    { nome: "CAVBOTS", grupo: "A", pts: 0, v: 0, e: 0, d: 0 }, { nome: "MARTEC", grupo: "A", pts: 0, v: 0, e: 0, d: 0 }, { nome: "CAVENGERS", grupo: "A", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "FIPETEC", grupo: "A", pts: 0, v: 0, e: 0, d: 0 }, { nome: "TECHDROID", grupo: "A", pts: 0, v: 0, e: 0, d: 0 }, { nome: "ROBOVERSE", grupo: "A", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "CAVSCRIPT", grupo: "B", pts: 0, v: 0, e: 0, d: 0 }, { nome: "ROBOTEC-VIVER", grupo: "B", pts: 0, v: 0, e: 0, d: 0 }, { nome: "MAVELTEC U-14", grupo: "B", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "INNOVATION", grupo: "B", pts: 0, v: 0, e: 0, d: 0 }, { nome: "CAVZORD", grupo: "B", pts: 0, v: 0, e: 0, d: 0 }, { nome: "NOVA TECH", grupo: "B", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "ASTROCAV", grupo: "C", pts: 0, v: 0, e: 0, d: 0 }, { nome: "FORTEC", grupo: "C", pts: 0, v: 0, e: 0, d: 0 }, { nome: "NOVA BLITZ", grupo: "C", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "STARTEC", grupo: "C", pts: 0, v: 0, e: 0, d: 0 }, { nome: "CAV NEO JAZZ", grupo: "C", pts: 0, v: 0, e: 0, d: 0 }
];

// Estado inicial com equipes para não carregar vazio
let dadosCompeticao = {
    equipes: JSON.parse(JSON.stringify(equipesOriginal)),
    log: [],
    faseGruposFinalizada: false,
    vencedoresMataMata: {}
};

// 1. RODAR RENDER IMEDIATAMENTE (Para mostrar os nomes antes mesmo da internet conectar)
document.addEventListener('DOMContentLoaded', () => {
    render(); 
});

// 2. ESCUTAR MUDANÇAS NA NUVEM
db.ref('campeonato_u14').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.equipes) {
        dadosCompeticao = data;
        render();
    } else {
        // Se o banco estiver vazio, ele cria a estrutura inicial baseada no equipesOriginal
        salvarDados();
    }
}, (error) => {
    console.error("Erro de conexão com Firebase:", error);
});

function salvarDados() {
    db.ref('campeonato_u14').set(dadosCompeticao);
}

function registrar() {
    const n = document.getElementById('selectEquipe').value;
    const r = document.getElementById('selectResultado').value;
    const id = Date.now();
    
    alterarPontos(n, r, 1);
    if(!dadosCompeticao.log) dadosCompeticao.log = [];
    dadosCompeticao.log.unshift({id, n, r});
    
    salvarDados();
}

function anular(id) {
    const i = dadosCompeticao.log.findIndex(x => x.id === id);
    if(i > -1) { 
        alterarPontos(dadosCompeticao.log[i].n, dadosCompeticao.log[i].r, -1); 
        dadosCompeticao.log.splice(i, 1); 
        salvarDados(); 
    }
}

function alterarPontos(n, r, f) {
    const e = dadosCompeticao.equipes.find(x => x.nome === n);
    if(e) {
        if(r === 'V') { e.pts += (3*f); e.v += (1*f); }
        else if(r === 'E') { e.pts += (1*f); e.e += (1*f); }
        else { e.d += (1*f); }
    }
}

function render() {
    // Verifica se o elemento existe na página antes de tentar escrever nele
    const tbA = document.querySelector("#tabelaA tbody");
    const tbB = document.querySelector("#tabelaB tbody");
    const tbC = document.querySelector("#tabelaC tbody");

    if(!tbA || !tbB || !tbC) return;

    const sort = (g) => dadosCompeticao.equipes.filter(x => x.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
    
    const A = sort("A"), B = sort("B"), C = sort("C");

    tbA.innerHTML = A.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
    tbB.innerHTML = B.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
    tbC.innerHTML = C.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
    
    const histDiv = document.getElementById('historico');
    if(histDiv) {
        histDiv.innerHTML = (dadosCompeticao.log || []).map(l => `
            <div class="history-item"><span>${l.n} (${l.r})</span><button class="btn-undo" onclick="anular(${l.id})">X</button></div>
        `).join('');
    }

    if(dadosCompeticao.faseGruposFinalizada) {
        configurarMataMata(A, B, C);
    }
}

function configurarMataMata(A, B, C) {
    // 1. Mapeia quem deve estar em cada vaga das Quartas
    const chavesIniciais = {
        'q1_1': A[0] ? A[0].nome : "...",
        'q1_2': C[1] ? C[1].nome : "...",
        'q2_1': B[0] ? B[0].nome : "...",
        'q2_2': A[2] ? A[2].nome : "...",
        'q3_1': C[0] ? C[0].nome : "...",
        'q3_2': B[2] ? B[2].nome : "...",
        'q4_1': A[1] ? A[1].nome : "...",
        'q4_2': B[1] ? B[1].nome : "..."
    };

    // 2. Aplica os nomes nos botões das Quartas
    for (let id in chavesIniciais) {
        const btn = document.getElementById(id);
        if (btn) {
            // Se já houver um vencedor marcado na nuvem, usamos ele, senão usamos a chave inicial
            btn.innerText = dadosCompeticao.vencedoresMataMata[id] || chavesIniciais[id];
        }
    }

    // 3. Aplica os vencedores das Semis e Final que estão salvos na nuvem
    const outrosIDs = ['s1_1', 's1_2', 's2_1', 's2_2', 'f1', 'f2'];
    outrosIDs.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && dadosCompeticao.vencedoresMataMata[id]) {
            btn.innerText = dadosCompeticao.vencedoresMataMata[id];
        }
    });

    // 4. Mostra o pódio se houver campeão
    if (dadosCompeticao.vencedoresMataMata['campeao']) {
        const podio = document.getElementById('podio');
        const campNome = document.getElementById('campeao_nome');
        if (podio) podio.style.display = 'block';
        if (campNome) campNome.innerText = dadosCompeticao.vencedoresMataMata['campeao'];
    }
}

    for(let id in seeds) {
        const btn = document.getElementById(id);
        if(btn && !dadosCompeticao.vencedoresMataMata[id]) {
            btn.innerText = seeds[id];
        }
    }

    for(let id in dadosCompeticao.vencedoresMataMata) {
        const btn = document.getElementById(id);
        if(btn) {
            btn.innerText = dadosCompeticao.vencedoresMataMata[id];
            btn.classList.add('venceu');
        }
    }
}

function liberarMataMata() {
    if (confirm("Finalizar grupos do U14? (3A + 3B + 2C serão classificados)")) {
        dadosCompeticao.faseGruposFinalizada = true;
        
        // Forçamos o cálculo inicial do mata-mata antes de salvar
        const sort = (g) => dadosCompeticao.equipes.filter(x => x.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
        const A = sort("A"), B = sort("B"), C = sort("C");
        
        // Define as chaves iniciais das quartas
        dadosCompeticao.vencedoresMataMata['q1_1'] = A[0].nome;
        dadosCompeticao.vencedoresMataMata['q1_2'] = C[1].nome;
        dadosCompeticao.vencedoresMataMata['q2_1'] = B[0].nome;
        dadosCompeticao.vencedoresMataMata['q2_2'] = A[2].nome;
        dadosCompeticao.vencedoresMataMata['q3_1'] = C[0].nome;
        dadosCompeticao.vencedoresMataMata['q3_2'] = B[2].nome;
        dadosCompeticao.vencedoresMataMata['q4_1'] = A[1].nome;
        dadosCompeticao.vencedoresMataMata['q4_2'] = B[1].nome;

        salvarDados();
        alert("Fase de grupos finalizada! O Mata-Mata foi gerado.");
    }
}
function vencer(fase, btn) {
    if (!dadosCompeticao.faseGruposFinalizada) {
        alert("Finalize a fase de grupos primeiro!");
        return;
    }
    
    const nome = btn.innerText;
    if (nome === "..." || nome.includes("Venc.")) return;

    if (!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
    
    // Marca visualmente o vencedor no banco
    dadosCompeticao.vencedoresMataMata[btn.id] = nome;

    // Lógica de destino: Quem ganha J1 vai para S1_1, etc.
    if (btn.id === 'q1_1' || btn.id === 'q1_2') dadosCompeticao.vencedoresMataMata['s1_1'] = nome;
    if (btn.id === 'q4_1' || btn.id === 'q4_2') dadosCompeticao.vencedoresMataMata['s1_2'] = nome;
    if (btn.id === 'q2_1' || btn.id === 'q2_2') dadosCompeticao.vencedoresMataMata['s2_1'] = nome;
    if (btn.id === 'q3_1' || btn.id === 'q3_2') dadosCompeticao.vencedoresMataMata['s2_2'] = nome;
    
    if (btn.id === 's1_1' || btn.id === 's1_2') dadosCompeticao.vencedoresMataMata['f1'] = nome;
    if (btn.id === 's2_1' || btn.id === 's2_2') dadosCompeticao.vencedoresMataMata['f2'] = nome;

    if (btn.id === 'f1' || btn.id === 'f2') {
        dadosCompeticao.vencedoresMataMata['campeao'] = nome;
    }

    salvarDados();
}

function confirmarReset() {
    if (confirm("Zerar TODO o placar online?")) {
        dadosCompeticao = {
            equipes: JSON.parse(JSON.stringify(equipesOriginal)),
            log: [],
            faseGruposFinalizada: false,
            vencedoresMataMata: {}
        };
        salvarDados();
        location.reload();
    }
}
