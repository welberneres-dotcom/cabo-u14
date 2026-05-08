// Configuração
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

let dadosCompeticao = null;

// Escuta o banco de dados
db.ref('campeonato_u14').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.equipes) {
        dadosCompeticao = data;
        render();
    } else {
        // Se o banco estiver vazio ou corrompido, inicializa com o padrão
        resetarBancoAForca();
    }
}, (erro) => {
    console.error("Erro no Firebase:", erro);
});

function resetarBancoAForca() {
    const inicial = {
        equipes: JSON.parse(JSON.stringify(equipesOriginal)),
        log: [],
        faseGruposFinalizada: false,
        vencedoresMataMata: {}
    };
    db.ref('campeonato_u14').set(inicial).then(() => {
        window.location.reload();
    });
}

// ATENÇÃO: Esta função agora é global para você chamar no console se o botão falhar
window.confirmarReset = function() {
    if (confirm("Isso vai apagar TUDO. Confirmar?")) {
        resetarBancoAForca();
    }
};

function registrar() {
    if (!dadosCompeticao) return;
    const n = document.getElementById('selectEquipe').value;
    const r = document.getElementById('selectResultado').value;
    const e = dadosCompeticao.equipes.find(x => x.nome === n);
    if(e) {
        if(r === 'V') { e.pts += 3; e.v += 1; }
        else if(r === 'E') { e.pts += 1; e.e += 1; }
        else { e.d += 1; }
        if(!dadosCompeticao.log) dadosCompeticao.log = [];
        dadosCompeticao.log.unshift({id: Date.now(), n, r});
        db.ref('campeonato_u14').set(dadosCompeticao);
    }
}

function render() {
    try {
        const bodyA = document.querySelector("#tabelaA tbody");
        if(!bodyA || !dadosCompeticao) return;

        const sort = (g) => [...dadosCompeticao.equipes].filter(x => x.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
        const A = sort("A"), B = sort("B"), C = sort("C");

        const trs = (lista) => lista.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
        
        bodyA.innerHTML = trs(A);
        document.querySelector("#tabelaB tbody").innerHTML = trs(B);
        document.querySelector("#tabelaC tbody").innerHTML = trs(C);

        const hist = document.getElementById('historico');
        if(hist) {
            hist.innerHTML = (dadosCompeticao.log || []).map(l => `
                <div class="history-item"><span>${l.n} (${l.r})</span><button onclick="anular(${l.id})">X</button></div>
            `).join('');
        }

        if(dadosCompeticao.faseGruposFinalizada) configurarMataMata(A, B, C);
    } catch(err) {
        console.warn("Erro ao renderizar, dados incompletos.");
    }
}

function configurarMataMata(A, B, C) {
    const get = (l, p) => (l && l[p] ? l[p].nome : "...");
    const v = dadosCompeticao.vencedoresMataMata || {};
    const base = {
        'q1_1': get(A,0), 'q1_2': get(C,1), 'q2_1': get(B,0), 'q2_2': get(A,2),
        'q3_1': get(C,0), 'q3_2': get(B,2), 'q4_1': get(A,1), 'q4_2': get(B,1)
    };
    Object.keys(base).forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = v[id] || base[id];
    });
}
