// CONFIGURAÇÃO FIREBASE
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

let dados = { equipes: JSON.parse(JSON.stringify(equipesOriginal)), log: [], faseGruposFinalizada: false, vencedoresMataMata: {} };

// Sincronização em tempo real
db.ref('campeonato_u14').on('value', (snap) => {
    const d = snap.val();
    if (d && d.equipes) {
        dados = d;
        render();
    } else {
        db.ref('campeonato_u14').set(dados);
    }
});

// Funções de Administração
function registrar() {
    const n = document.getElementById('selectEquipe').value;
    const r = document.getElementById('selectResultado').value;
    const e = dados.equipes.find(x => x.nome === n);
    if (e) {
        if (r === 'V') { e.pts += 3; e.v += 1; }
        else if (r === 'E') { e.pts += 1; e.e += 1; }
        else { e.d += 1; }
        if (!dados.log) dados.log = [];
        dados.log.unshift({ id: Date.now(), n, r });
        db.ref('campeonato_u14').set(dados);
    }
}

function vencer(partida, el) {
    // Só funciona se estiver na página admin.html
    if (!window.location.pathname.includes('admin.html')) return;

    const nomeVencedor = el.innerText;
    if (nomeVencedor === "..." || nomeVencedor.includes("Venc.")) return;

    if (!dados.vencedoresMataMata) dados.vencedoresMataMata = {};
    
    // Lógica de avanço das chaves
    const chaves = {
        'q1': 's1_1', 'q4': 's1_2',
        'q2': 's2_1', 'q3': 's2_2',
        's1': 'f1',   's2': 'f2',
        'f': 'campeao'
    };

    if (chaves[partida]) {
        dados.vencedoresMataMata[chaves[partida]] = nomeVencedor;
        
        // Marca visualmente quem ganhou esta partida específica
        dados.vencedoresMataMata[el.id + "_win"] = true;
        const adversarioId = el.id.endsWith('1') ? el.id.replace('1', '2') : el.id.replace('2', '1');
        dados.vencedoresMataMata[adversarioId + "_win"] = false;

        db.ref('campeonato_u14').set(dados);
    }
}

function liberarMataMata() {
    if (confirm("Finalizar grupos e gerar Quartas (3A + 3B + 2C)?")) {
        const obter = (g) => [...dados.equipes].filter(e => e.grupo === g).sort((a, b) => b.pts - a.pts || b.v - a.v);
        const rA = obter("A"), rB = obter("B"), rC = obter("C");

        dados.vencedoresMataMata = {
            'q1_1': rA[0]?.nome || "1º A", 'q1_2': rC[1]?.nome || "2º C",
            'q2_1': rB[0]?.nome || "1º B", 'q2_2': rA[2]?.nome || "3º A",
            'q3_1': rC[0]?.nome || "1º C", 'q3_2': rB[2]?.nome || "3º B",
            'q4_1': rA[1]?.nome || "2º A", 'q4_2': rB[1]?.nome || "2º B"
        };
        dados.faseGruposFinalizada = true;
        db.ref('campeonato_u14').set(dados);
    }
}

function render() {
    try {
        const trs = (g) => [...dados.equipes].filter(x => x.grupo === g)
            .sort((a, b) => b.pts - a.pts || b.v - a.v)
            .map((e, i) => `<tr><td>${i + 1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');

        ["A", "B", "C"].forEach(g => {
            const t = document.querySelector(`#tabela${g} tbody`);
            if (t) t.innerHTML = trs(g);
        });

        const hist = document.getElementById('historico');
        if (hist) hist.innerHTML = (dados.log || []).map(l => `<div class="history-item">${l.n} (${l.r})</div>`).join('');

        const v = dados.vencedoresMataMata || {};
        const ids = ['q1_1', 'q1_2', 'q2_1', 'q2_2', 'q3_1', 'q3_2', 'q4_1', 'q4_2', 's1_1', 's1_2', 's2_1', 's2_2', 'f1', 'f2'];
        
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (v[id]) el.innerText = v[id];
                if (v[id + "_win"]) el.classList.add('venceu');
                else el.classList.remove('venceu');
            }
        });

        const podio = document.getElementById('podio');
        if (podio) {
            if (v.campeao) {
                podio.style.display = 'block';
                document.getElementById('campeao_nome').innerText = v.campeao;
            } else {
                podio.style.display = 'none';
            }
        }
    } catch (err) { console.log("Renderizando..."); }
}

window.confirmarReset = function() {
    if (confirm("ATENÇÃO: Deseja ZERAR toda a competição?")) {
        db.ref('campeonato_u14').set({ equipes: equipesOriginal, log: [], faseGruposFinalizada: false, vencedoresMataMata: {} })
        .then(() => location.reload());
    }
}
