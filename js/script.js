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

// Sincronização robusta
db.ref('campeonato_u14').on('value', (snap) => {
    const d = snap.val();
    if (d && d.equipes) {
        dados = {
            equipes: d.equipes,
            log: d.log || [],
            faseGruposFinalizada: d.faseGruposFinalizada || false,
            vencedoresMataMata: d.vencedoresMataMata || {}
        };
        render();
    } else {
        // Se o banco estiver vazio ou estranho, força a estrutura inicial
        db.ref('campeonato_u14').set(dados);
    }
});

function registrar() {
    const n = document.getElementById('selectEquipe').value;
    const r = document.getElementById('selectResultado').value;
    const e = dados.equipes.find(x => x.nome === n);
    if(e) {
        if(r === 'V') { e.pts += 3; e.v += 1; }
        else if(r === 'E') { e.pts += 1; e.e += 1; }
        else { e.d += 1; }
        dados.log.unshift({id: Date.now(), n, r});
        db.ref('campeonato_u14').set(dados);
    }
}

function render() {
    try {
        const trs = (g) => [...dados.equipes].filter(x => x.grupo === g)
            .sort((a,b) => b.pts - a.pts || b.v - a.v)
            .map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');

        const tA = document.querySelector("#tabelaA tbody");
        if(tA) {
            tA.innerHTML = trs("A");
            document.querySelector("#tabelaB tbody").innerHTML = trs("B");
            document.querySelector("#tabelaC tbody").innerHTML = trs("C");
        }

        const hist = document.getElementById('historico');
        if(hist) hist.innerHTML = dados.log.map(l => `<div class="history-item">${l.n} (${l.r}) <button onclick="anular(${l.id})">X</button></div>`).join('');

        if(dados.faseGruposFinalizada) {
            const v = dados.vencedoresMataMata;
            // IDs do HTML para o mata-mata (ajuste se os seus forem diferentes)
            const ids = ['q1_1','q1_2','q2_1','q2_2','q3_1','q3_2','q4_1','q4_2','s1_1','s1_2','s2_1','s2_2','f1','f2'];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if(el) el.innerText = v[id] || "...";
            });
        }
    } catch(err) { console.error("Erro ao desenhar tela:", err); }
}

// FUNÇÃO DE RESET QUE FUNCIONA MESMO COM ERRO
window.confirmarReset = function() {
    if(confirm("Deseja ZERAR tudo agora?")) {
        const limpo = { equipes: equipesOriginal, log: [], faseGruposFinalizada: false, vencedoresMataMata: {} };
        db.ref('campeonato_u14').set(limpo).then(() => location.reload());
    }
}
