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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

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

// Sincronização
db.ref('campeonato_u14').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        dadosCompeticao = data;
        // Garante que as sub-propriedades existam
        if (!dadosCompeticao.log) dadosCompeticao.log = [];
        if (!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
        if (!dadosCompeticao.equipes) dadosCompeticao.equipes = JSON.parse(JSON.stringify(equipesOriginal));
        render();
    } else {
        salvarDados();
    }
});

function salvarDados() {
    db.ref('campeonato_u14').set(dadosCompeticao);
}

function registrar() {
    const n = document.getElementById('selectEquipe').value;
    const r = document.getElementById('selectResultado').value;
    alterarPontos(n, r, 1);
    dadosCompeticao.log.unshift({id: Date.now(), n, r});
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
    const tbA = document.querySelector("#tabelaA tbody");
    const tbB = document.querySelector("#tabelaB tbody");
    const tbC = document.querySelector("#tabelaC tbody");
    if(!tbA) return;

    const sort = (g) => [...dadosCompeticao.equipes].filter(x => x.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
    const A = sort("A"), B = sort("B"), C = sort("C");

    const gerarLinhas = (lista) => lista.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
    
    tbA.innerHTML = gerarLinhas(A);
    tbB.innerHTML = gerarLinhas(B);
    tbC.innerHTML = gerarLinhas(C);
    
    const histDiv = document.getElementById('historico');
    if(histDiv) {
        histDiv.innerHTML = dadosCompeticao.log.map(l => `
            <div class="history-item"><span>${l.n} (${l.r})</span><button class="btn-undo" onclick="anular(${l.id})">X</button></div>
        `).join('');
    }

    if(dadosCompeticao.faseGruposFinalizada) {
        configurarMataMata(A, B, C);
    }
}

function configurarMataMata(A, B, C) {
    // PROTEÇÃO TOTAL: Verifica se cada posição da tabela existe antes de ler o .nome
    const getNome = (lista, pos) => (lista[pos] ? lista[pos].nome : "...");

    const chavesIniciais = {
        'q1_1': getNome(A, 0),
        'q1_2': getNome(C, 1),
        'q2_1': getNome(B, 0),
        'q2_2': getNome(A, 2),
        'q3_1': getNome(C, 0),
        'q3_2': getNome(B, 2),
        'q4_1': getNome(A, 1),
        'q4_2': getNome(B, 1)
    };

    const v = dadosCompeticao.vencedoresMataMata || {};
    const todosIDs = [...Object.keys(chavesIniciais), 's1_1', 's1_2', 's2_1', 's2_2', 'f1', 'f2'];
    
    todosIDs.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.innerText = v[id] || chavesIniciais[id] || "...";
            v[id] ? btn.classList.add('venceu') : btn.classList.remove('venceu');
        }
    });

    if (v['campeao']) {
        const podio = document.getElementById('podio');
        if(podio) podio.style.display = 'block';
        const nomeCamp = document.getElementById('campeao_nome');
        if(nomeCamp) nomeCamp.innerText = v['campeao'];
    }
}

function liberarMataMata() {
    if (confirm("Finalizar grupos e gerar Quartas?")) {
        dadosCompeticao.faseGruposFinalizada = true;
        if(!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
        salvarDados();
    }
}

function vencer(fase, btn) {
    if (!dadosCompeticao.faseGruposFinalizada) return;
    const nome = btn.innerText;
    if (nome === "..." || nome.includes("Venc.")) return;

    if(!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
    const v = dadosCompeticao.vencedoresMataMata;
    v[btn.id] = nome;

    // Fluxo do Torneio
    const prox = {
        'q1_1':'s1_1', 'q1_2':'s1_1',
        'q4_1':'s1_2', 'q4_2':'s1_2',
        'q2_1':'s2_1', 'q2_2':'s2_1',
        'q3_1':'s2_2', 'q3_2':'s2_2',
        's1_1':'f1', 's1_2':'f1',
        's2_1':'f2', 's2_2':'f2',
        'f1':'campeao', 'f2':'campeao'
    };

    if(prox[btn.id]) v[prox[btn.id]] = nome;
    salvarDados();
}

function confirmarReset() {
    if (confirm("ATENÇÃO: Isso apagará tudo!")) {
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
