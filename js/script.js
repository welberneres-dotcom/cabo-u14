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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
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

// Sincronização Realtime
db.ref('campeonato_u14').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Blindagem total contra campos nulos no banco
        dadosCompeticao = {
            equipes: data.equipes || JSON.parse(JSON.stringify(equipesOriginal)),
            log: data.log || [],
            faseGruposFinalizada: data.faseGruposFinalizada || false,
            vencedoresMataMata: data.vencedoresMataMata || {}
        };
        render();
    }
});

function salvarDados() {
    db.ref('campeonato_u14').set(dadosCompeticao);
}

// Funções de Ação
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

function render() {
    try {
        const bodyA = document.querySelector("#tabelaA tbody");
        if(!bodyA) return;

        const sort = (g) => [...dadosCompeticao.equipes].filter(x => x.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
        const A = sort("A"), B = sort("B"), C = sort("C");

        const trs = (lista) => lista.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
        
        bodyA.innerHTML = trs(A);
        document.querySelector("#tabelaB tbody").innerHTML = trs(B);
        document.querySelector("#tabelaC tbody").innerHTML = trs(C);

        document.getElementById('historico').innerHTML = dadosCompeticao.log.map(l => `
            <div class="history-item"><span>${l.n} (${l.r})</span><button onclick="anular(${l.id})">X</button></div>
        `).join('');

        if(dadosCompeticao.faseGruposFinalizada) configurarMataMata(A, B, C);
    } catch(e) { console.log("Renderizando..."); }
}

function configurarMataMata(A, B, C) {
    const get = (l, p) => (l && l[p] ? l[p].nome : "...");
    const v = dadosCompeticao.vencedoresMataMata || {};

    const base = {
        'q1_1': get(A,0), 'q1_2': get(C,1), 'q2_1': get(B,0), 'q2_2': get(A,2),
        'q3_1': get(C,0), 'q3_2': get(B,2), 'q4_1': get(A,1), 'q4_2': get(B,1)
    };

    [...Object.keys(base), 's1_1', 's1_2', 's2_1', 's2_2', 'f1', 'f2'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.innerText = v[id] || base[id] || "...";
            v[id] ? el.classList.add('venceu') : el.classList.remove('venceu');
        }
    });

    if(v.campeao && document.getElementById('podio')) {
        document.getElementById('podio').style.display = 'block';
        document.getElementById('campeao_nome').innerText = v.campeao;
    }
}

function liberarMataMata() {
    if(confirm("Finalizar Grupos?")) {
        dadosCompeticao.faseGruposFinalizada = true;
        salvarDados();
    }
}

function vencer(fase, btn) {
    if(!dadosCompeticao.faseGruposFinalizada) return;
    const n = btn.innerText;
    if(n === "...") return;
    if(!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
    
    dadosCompeticao.vencedoresMataMata[btn.id] = n;
    const p = {'q1_1':'s1_1','q1_2':'s1_1','q4_1':'s1_2','q4_2':'s1_2','q2_1':'s2_1','q2_2':'s2_1','q3_1':'s2_2','q3_2':'s2_2','s1_1':'f1','s1_2':'f1','s2_1':'f2','s2_2':'f2','f1':'campeao','f2':'campeao'};
    if(p[btn.id]) dadosCompeticao.vencedoresMataMata[p[btn.id]] = n;
    salvarDados();
}

// 5. RESET TOTAL (Blindado)
function confirmarReset() {
    if (confirm("ATENÇÃO: Deseja apagar tudo e recomeçar?")) {
        const resetDados = {
            equipes: equipesOriginal,
            log: [],
            faseGruposFinalizada: false,
            vencedoresMataMata: {}
        };
        db.ref('campeonato_u14').set(resetDados).then(() => {
            alert("Dados resetados com sucesso!");
            location.reload();
        }).catch(err => {
            alert("Erro ao resetar. Tente forçar pelo console.");
        });
    }
}
