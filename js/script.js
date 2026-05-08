// 1. Configuração do Firebase
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

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. Dados Originais
const equipesOriginal = [
    { nome: "CAVBOTS", grupo: "A", pts: 0, v: 0, e: 0, d: 0 }, { nome: "MARTEC", grupo: "A", pts: 0, v: 0, e: 0, d: 0 }, { nome: "CAVENGERS", grupo: "A", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "FIPETEC", grupo: "A", pts: 0, v: 0, e: 0, d: 0 }, { nome: "TECHDROID", grupo: "A", pts: 0, v: 0, e: 0, d: 0 }, { nome: "ROBOVERSE", grupo: "A", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "CAVSCRIPT", grupo: "B", pts: 0, v: 0, e: 0, d: 0 }, { nome: "ROBOTEC-VIVER", grupo: "B", pts: 0, v: 0, e: 0, d: 0 }, { nome: "MAVELTEC U-14", grupo: "B", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "INNOVATION", grupo: "B", pts: 0, v: 0, e: 0, d: 0 }, { nome: "CAVZORD", grupo: "B", pts: 0, v: 0, e: 0, d: 0 }, { nome: "NOVA TECH", grupo: "B", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "ASTROCAV", grupo: "C", pts: 0, v: 0, e: 0, d: 0 }, { nome: "FORTEC", grupo: "C", pts: 0, v: 0, e: 0, d: 0 }, { nome: "NOVA BLITZ", grupo: "C", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "STARTEC", grupo: "C", pts: 0, v: 0, e: 0, d: 0 }, { nome: "CAV NEO JAZZ", grupo: "C", pts: 0, v: 0, e: 0, d: 0 }
];

let dadosCompeticao = {
    equipes: JSON.parse(JSON.stringify(equipesOriginal)),
    log: [],
    faseGruposFinalizada: false,
    vencedoresMataMata: {}
};

// 3. Sincronização com Realtime Database
db.ref('campeonato_u14').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // BLINDAGEM: Garante que mesmo que falte algo no banco, o código não quebre
        dadosCompeticao = {
            equipes: data.equipes || JSON.parse(JSON.stringify(equipesOriginal)),
            log: data.log || [],
            faseGruposFinalizada: data.faseGruposFinalizada || false,
            vencedoresMataMata: data.vencedoresMataMata || {}
        };
        render();
    } else {
        salvarDados();
    }
}, (error) => {
    console.error("Erro de conexão:", error);
});

function salvarDados() {
    db.ref('campeonato_u14').set(dadosCompeticao);
}

// 4. Lógica de Pontuação
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

// 5. Interface (Renderização)
function render() {
    const tbA = document.querySelector("#tabelaA tbody");
    const tbB = document.querySelector("#tabelaB tbody");
    const tbC = document.querySelector("#tabelaC tbody");

    if(!tbA || !tbB || !tbC) return;

    const sort = (g) => [...dadosCompeticao.equipes].filter(x => x.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
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

// 6. Mata-Mata
function configurarMataMata(A, B, C) {
    // Garante que o objeto exista internamente
    if (!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
    const v = dadosCompeticao.vencedoresMataMata;

    // Chaves automáticas baseadas na tabela
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

    const todosIDs = [...Object.keys(chavesIniciais), 's1_1', 's1_2', 's2_1', 's2_2', 'f1', 'f2'];
    
    todosIDs.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            // Ordem de prioridade: 1. Nome salvo no banco | 2. Nome calculado da tabela | 3. Pontinhos
            btn.innerText = v[id] || chavesIniciais[id] || "...";
            
            if (v[id]) {
                btn.classList.add('venceu');
            } else {
                btn.classList.remove('venceu');
            }
        }
    });

    // Pódio
    const campNome = v['campeao'];
    const podioDiv = document.getElementById('podio');
    if (campNome && podioDiv) {
        podioDiv.style.display = 'block';
        document.getElementById('campeao_nome').innerText = campNome;
    }
}

function liberarMataMata() {
    if (confirm("Finalizar grupos e gerar Quartas?")) {
        if (!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
        dadosCompeticao.faseGruposFinalizada = true;
        salvarDados();
        alert("Fase de grupos finalizada!");
    }
}

function vencer(fase, btn) {
    if (!dadosCompeticao.faseGruposFinalizada) return;
    
    const nome = btn.innerText;
    if (nome === "..." || nome.includes("Venc.")) return;

    if (!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
    const v = dadosCompeticao.vencedoresMataMata;
    
    v[btn.id] = nome;

    // Lógica de avanço
    if (btn.id === 'q1_1' || btn.id === 'q1_2') v['s1_1'] = nome;
    if (btn.id === 'q4_1' || btn.id === 'q4_2') v['s1_2'] = nome;
    if (btn.id === 'q2_1' || btn.id === 'q2_2') v['s2_1'] = nome;
    if (btn.id === 'q3_1' || btn.id === 'q3_2') v['s2_2'] = nome;
    if (btn.id === 's1_1' || btn.id === 's1_2') v['f1'] = nome;
    if (btn.id === 's2_1' || btn.id === 's2_2') v['f2'] = nome;
    if (btn.id === 'f1' || btn.id === 'f2') v['campeao'] = nome;

    salvarDados();
}

function confirmarReset() {
    if (confirm("ATENÇÃO: Isso apagará todos os dados online. Confirmar?")) {
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
