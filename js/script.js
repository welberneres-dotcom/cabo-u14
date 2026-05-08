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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 2. Estrutura Padrão
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

// 3. Sincronização com Auto-Reparo
db.ref('campeonato_u14').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Se alguma parte crucial estiver faltando no banco, o JS completa com o padrão
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
});

function salvarDados() {
    db.ref('campeonato_u14').set(dadosCompeticao).catch(e => console.error("Erro ao salvar:", e));
}

// 4. Lógica de Pontuação
function registrar() {
    const n = document.getElementById('selectEquipe').value;
    const r = document.getElementById('selectResultado').value;
    const e = dadosCompeticao.equipes.find(x => x.nome === n);
    
    if(e) {
        if(r === 'V') { e.pts += 3; e.v += 1; }
        else if(r === 'E') { e.pts += 1; e.e += 1; }
        else { e.d += 1; }
        
        dadosCompeticao.log.unshift({id: Date.now(), n, r});
        salvarDados();
    }
}

function anular(id) {
    const i = dadosCompeticao.log.findIndex(x => x.id === id);
    if(i > -1) {
        const item = dadosCompeticao.log[i];
        const e = dadosCompeticao.equipes.find(x => x.nome === item.n);
        if(e) {
            if(item.r === 'V') { e.pts -= 3; e.v -= 1; }
            else if(item.r === 'E') { e.pts -= 1; e.e -= 1; }
            else { e.d -= 1; }
        }
        dadosCompeticao.log.splice(i, 1);
        salvarDados();
    }
}

// 5. Renderização
function render() {
    try {
        const sort = (g) => [...dadosCompeticao.equipes].filter(x => x.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
        const A = sort("A"), B = sort("B"), C = sort("C");

        const atualizarTabela = (id, lista) => {
            const body = document.querySelector(`#${id} tbody`);
            if(body) body.innerHTML = lista.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
        };

        atualizarTabela("tabelaA", A);
        atualizarTabela("tabelaB", B);
        atualizarTabela("tabelaC", C);
        
        const histDiv = document.getElementById('historico');
        if(histDiv) {
            histDiv.innerHTML = dadosCompeticao.log.map(l => `
                <div class="history-item"><span>${l.n} (${l.r})</span><button class="btn-undo" onclick="anular(${l.id})">X</button></div>
            `).join('');
        }

        if(dadosCompeticao.faseGruposFinalizada) {
            configurarMataMata(A, B, C);
        }
    } catch (err) {
        console.error("Erro na renderização. Tentando reparar banco...", err);
    }
}

// 6. Mata-Mata Protegido
function configurarMataMata(A, B, C) {
    const getNome = (lista, pos) => (lista && lista[pos] ? lista[pos].nome : "...");
    const v = dadosCompeticao.vencedoresMataMata || {};

    const chaves = {
        'q1_1': getNome(A, 0), 'q1_2': getNome(C, 1),
        'q2_1': getNome(B, 0), 'q2_2': getNome(A, 2),
        'q3_1': getNome(C, 0), 'q3_2': getNome(B, 2),
        'q4_1': getNome(A, 1), 'q4_2': getNome(B, 1)
    };

    const ids = [...Object.keys(chaves), 's1_1', 's1_2', 's2_1', 's2_2', 'f1', 'f2'];
    
    ids.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.innerText = v[id] || chaves[id] || "...";
            v[id] ? btn.classList.add('venceu') : btn.classList.remove('venceu');
        }
    });

    if (v['campeao']) {
        const p = document.getElementById('podio');
        if(p) p.style.display = 'block';
        const n = document.getElementById('campeao_nome');
        if(n) n.innerText = v['campeao'];
    }
}

function liberarMataMata() {
    if (confirm("Gerar chaves do Mata-Mata?")) {
        dadosCompeticao.faseGruposFinalizada = true;
        if(!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
        salvarDados();
    }
}

function vencer(fase, btn) {
    if (!dadosCompeticao.faseGruposFinalizada) return;
    const nome = btn.innerText;
    if (nome === "...") return;

    if(!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
    dadosCompeticao.vencedoresMataMata[btn.id] = nome;

    const prox = {
        'q1_1':'s1_1','q1_2':'s1_1','q4_1':'s1_2','q4_2':'s1_2',
        'q2_1':'s2_1','q2_2':'s2_1','q3_1':'s2_2','q3_2':'s2_2',
        's1_1':'f1','s1_2':'f1','s2_1':'f2','s2_2':'f2',
        'f1':'campeao','f2':'campeao'
    };

    if(prox[btn.id]) dadosCompeticao.vencedoresMataMata[prox[btn.id]] = nome;
    salvarDados();
}

function confirmarReset() {
    if (confirm("Resetar tudo?")) {
        db.ref('campeonato_u14').remove().then(() => location.reload());
    }
}
