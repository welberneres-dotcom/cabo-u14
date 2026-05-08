// Configuração do seu Firebase
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

// Inicializa o Firebase (Sintaxe Compat)
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

// --- ESCUTAR MUDANÇAS NA NUVEM ---
db.ref('campeonato_u14').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        dadosCompeticao = data;
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
    const sort = (g) => dadosCompeticao.equipes.filter(x => x.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
    const A = sort("A"), B = sort("B"), C = sort("C");

    document.querySelector("#tabelaA tbody").innerHTML = A.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
    document.querySelector("#tabelaB tbody").innerHTML = B.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
    document.querySelector("#tabelaC tbody").innerHTML = C.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
    
    document.getElementById('historico').innerHTML = (dadosCompeticao.log || []).map(l => `
        <div class="history-item"><span>${l.n} (${l.r})</span><button class="btn-undo" onclick="anular(${l.id})">X</button></div>
    `).join('');

    if(dadosCompeticao.faseGruposFinalizada) {
        configurarMataMata(A, B, C);
    }
}

function configurarMataMata(A, B, C) {
    const seeds = {
        'q1_1': A[0].nome, 'q1_2': C[1].nome,
        'q2_1': B[0].nome, 'q2_2': A[2].nome,
        'q3_1': C[0].nome, 'q3_2': B[2].nome,
        'q4_1': A[1].nome, 'q4_2': B[1].nome
    };

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
    if (confirm("Finalizar grupos?")) {
        dadosCompeticao.faseGruposFinalizada = true;
        salvarDados();
    }
}

function vencer(fase, btn) {
    if(!dadosCompeticao.faseGruposFinalizada) return;
    
    const nome = btn.innerText;
    if(nome === "..." || nome.includes("Venc.")) return;

    if(!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
    
    if(fase === 'q1') document.getElementById('s1_1').innerText = nome;
    if(fase === 'q4') document.getElementById('s1_2').innerText = nome;
    if(fase === 'q2') document.getElementById('s2_1').innerText = nome;
    if(fase === 'q3') document.getElementById('s2_2').innerText = nome;
    if(fase === 's1') document.getElementById('f1').innerText = nome;
    if(fase === 's2') document.getElementById('f2').innerText = nome;

    if(fase === 'f') {
        document.getElementById('podio').style.display = 'block';
        document.getElementById('campeao_nome').innerText = nome;
    }

    document.querySelectorAll('.equipe-btn').forEach(b => {
        if(b.innerText !== "..." && !b.innerText.includes("Venc.")) {
            dadosCompeticao.vencedoresMataMata[b.id] = b.innerText;
        }
    });

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
