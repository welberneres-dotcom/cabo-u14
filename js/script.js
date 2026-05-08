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

// Inicialização segura
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 2. Dados Iniciais
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

// 3. Ouvinte do Firebase com Blindagem
db.ref('campeonato_u14').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Garantimos que nenhuma propriedade seja undefined antes de salvar no estado local
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
}, (error) => console.error("Erro Firebase:", error));

function salvarDados() {
    db.ref('campeonato_u14').set(dadosCompeticao);
}

// 4. Funções Principais
function registrar() {
    const equipeNome = document.getElementById('selectEquipe').value;
    const resultado = document.getElementById('selectResultado').value;
    
    // Procura a equipe com segurança
    const equipe = (dadosCompeticao.equipes || []).find(e => e.nome === equipeNome);
    
    if (equipe) {
        if (resultado === 'V') { equipe.pts += 3; equipe.v += 1; }
        else if (resultado === 'E') { equipe.pts += 1; equipe.e += 1; }
        else { equipe.d += 1; }

        if (!dadosCompeticao.log) dadosCompeticao.log = [];
        dadosCompeticao.log.unshift({ id: Date.now(), n: equipeNome, r: resultado });
        salvarDados();
    }
}

function render() {
    try {
        const bodyA = document.querySelector("#tabelaA tbody");
        const bodyB = document.querySelector("#tabelaB tbody");
        const bodyC = document.querySelector("#tabelaC tbody");
        if (!bodyA) return;

        // Ordenação segura
        const sortEquipes = (grupo) => {
            return [...(dadosCompeticao.equipes || [])]
                .filter(e => e.grupo === grupo)
                .sort((a, b) => b.pts - a.pts || b.v - a.v);
        };

        const A = sortEquipes("A"), B = sortEquipes("B"), C = sortEquipes("C");

        const htmlTabela = (lista) => lista.map((e, i) => 
            `<tr><td>${i + 1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`
        ).join('');

        bodyA.innerHTML = htmlTabela(A);
        bodyB.innerHTML = htmlTabela(B);
        bodyC.innerHTML = htmlTabela(C);

        // Histórico
        const histDiv = document.getElementById('historico');
        if (histDiv) {
            histDiv.innerHTML = (dadosCompeticao.log || []).map(l => `
                <div class="history-item">
                    <span>${l.n} (${l.r})</span>
                    <button class="btn-undo" onclick="anular(${l.id})">X</button>
                </div>
            `).join('');
        }

        // Mata-Mata
        if (dadosCompeticao.faseGruposFinalizada) {
            configurarMataMata(A, B, C);
        }
    } catch (e) {
        console.warn("Aguardando sincronização de dados...");
    }
}

function configurarMataMata(A, B, C) {
    // Helper para evitar erro de ler nome de equipe inexistente
    const safeName = (arr, i) => (arr && arr[i] ? arr[i].nome : "...");
    const vencedores = dadosCompeticao.vencedoresMataMata || {};

    const dePara = {
        'q1_1': safeName(A, 0), 'q1_2': safeName(C, 1),
        'q2_1': safeName(B, 0), 'q2_2': safeName(A, 2),
        'q3_1': safeName(C, 0), 'q3_2': safeName(B, 2),
        'q4_1': safeName(A, 1), 'q4_2': safeName(B, 1)
    };

    const todosIds = [...Object.keys(dePara), 's1_1', 's1_2', 's2_1', 's2_2', 'f1', 'f2'];

    todosIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.innerText = vencedores[id] || dePara[id] || "...";
            vencedores[id] ? btn.classList.add('venceu') : btn.classList.remove('venceu');
        }
    });

    if (vencedores['campeao']) {
        const p = document.getElementById('podio');
        if (p) p.style.display = 'block';
        const n = document.getElementById('campeao_nome');
        if (n) n.innerText = vencedores['campeao'];
    }
}

function vencer(fase, btn) {
    if (!dadosCompeticao.faseGruposFinalizada) return;
    const nome = btn.innerText;
    if (nome === "..." || nome === "") return;

    if (!dadosCompeticao.vencedoresMataMata) dadosCompeticao.vencedoresMataMata = {};
    dadosCompeticao.vencedoresMataMata[btn.id] = nome;

    // Fluxograma de avanço
    const prox = {
        'q1_1':'s1_1','q1_2':'s1_1','q4_1':'s1_2','q4_2':'s1_2',
        'q2_1':'s2_1','q2_2':'s2_1','q3_1':'s2_2','q3_2':'s2_2',
        's1_1':'f1', 's1_2':'f1', 's2_1':'f2', 's2_2':'f2',
        'f1':'campeao', 'f2':'campeao'
    };

    if (prox[btn.id]) {
        dadosCompeticao.vencedoresMataMata[prox[btn.id]] = nome;
    }
    salvarDados();
}

function liberarMataMata() {
    if (confirm("Finalizar fase de grupos e gerar chaves?")) {
        dadosCompeticao.faseGruposFinalizada = true;
        salvarDados();
    }
}

function confirmarReset() {
    if (confirm("Deseja realmente apagar TODOS os dados do torneio?")) {
        db.ref('campeonato_u14').remove().then(() => {
            location.reload();
        });
    }
}
