import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { getDatabase, ref, set, push, get, update } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBCH1OrwCzQ2WB__2xrMGq00l2AdzUzrkU",
  authDomain: "ancorar-93131.firebaseapp.com",
  databaseURL: "https://ancorar-93131-default-rtdb.firebaseio.com",
  projectId: "ancorar-93131",
  storageBucket: "ancorar-93131.appspot.com",
  messagingSenderId: "951288286740",
  appId: "1:951288286740:web:b8aabee53283bcae2ba101"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();

// Elementos
const bemVindo = document.getElementById("bem-vindo");
const dashboardSection = document.getElementById("dashboard-section");
const dashboardTitle = document.getElementById("dashboard-title");
const envioCurriculo = document.getElementById("envio-curriculo");
const tabelaBody = document.querySelector("#tabela-dashboard tbody");
const msgSucesso = document.getElementById("mensagem-sucesso");

// Cadastro
document.getElementById("form-cadastro").addEventListener("submit", e=>{
  e.preventDefault();
  const nome = document.getElementById("cad-nome").value;
  const email = document.getElementById("cad-email").value;
  const senha = document.getElementById("cad-senha").value;
  const tipo = document.getElementById("cad-tipo").value;

  createUserWithEmailAndPassword(auth,email,senha)
    .then(userCred=>{
      const user = userCred.user;
      updateProfile(user,{displayName:nome});
      set(ref(db,"usuarios/"+user.uid),{nome,email,tipo});
      alert("Cadastro realizado!");
    })
    .catch(err=>alert(err.message));

  e.target.reset();
});

// Login
document.getElementById("form-login").addEventListener("submit", e=>{
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;

  signInWithEmailAndPassword(auth,email,senha)
    .catch(err=>alert(err.message));
});

// Logout
document.getElementById("btn-logout").addEventListener("click", ()=> signOut(auth));

// Envio Currículo
document.getElementById("form-curriculo").addEventListener("submit", e=>{
  e.preventDefault();
  const arquivo = document.getElementById("cv-arquivo").files[0];
  const nome = document.getElementById("cv-nome").value;
  const email = document.getElementById("cv-email").value;

  const reader = new FileReader();
  reader.onload = async function(evt){
    const dataBase64 = evt.target.result;
    const user = auth.currentUser;
    await set(push(ref(db,"curriculos")),{
      nome,email,arquivoBase64:dataBase64,ownerId:user.uid,visualizacoes:0
    });
    msgSucesso.textContent = "Currículo enviado!";
    msgSucesso.style.display="block";
    setTimeout(()=>msgSucesso.style.display="none",3000);
    carregarDashboard();
  };
  reader.readAsDataURL(arquivo);

  e.target.reset();
});

// Monitorar Auth
onAuthStateChanged(auth, async user => {
  if(user){
    const userRef = await get(ref(db,"usuarios/"+user.uid));
    const usuario = userRef.val();

    bemVindo.textContent = `Bem-vindo, ${user.displayName || usuario.nome}`;
    bemVindo.style.display = "inline";

    // Mostra dashboard
    dashboardSection.style.display = "block";

    // Marinheiro envia currículos
    envioCurriculo.style.display = usuario.tipo === "marinheiro" ? "block" : "none";

    // Muda título
    dashboardTitle.textContent = usuario.tipo === "contratante" ? "Currículos Recebidos" : "Meus Currículos Enviados";

    // Carrega currículos
    carregarDashboard(usuario);

    document.getElementById("cadastro-login").style.display = "none";
  } else {
    dashboardSection.style.display = "none";
    document.getElementById("cadastro-login").style.display = "block";
    bemVindo.textContent = "";
  }
});

async function carregarDashboard(usuario){
  tabelaBody.innerHTML = "";
  const snapshot = await get(ref(db,"curriculos"));
  if(snapshot.exists()){
    snapshot.forEach(snap=>{
      const data = snap.val();
      let mostrar = false;

      if(usuario.tipo==="marinheiro" && data.ownerId===usuario.uid) mostrar = true;
      if(usuario.tipo==="contratante") mostrar = true;

      if(mostrar){
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${data.nome}</td>
          <td>${data.email}</td>
          <td><a href="${data.arquivoBase64}" target="_blank">Ver PDF</a></td>
          <td>${data.visualizacoes || 0}</td>
        `;
        tabelaBody.appendChild(tr);

        if(usuario.tipo==="contratante"){
          update(ref(db,"curriculos/"+snap.key), { visualizacoes:(data.visualizacoes||0)+1 });
        }
      }
    });
  }
}


// Carregar Dashboard
async function carregarDashboard(usuario){
  tabelaBody.innerHTML="";
  const snapshot = await get(ref(db,"curriculos"));
  if(snapshot.exists()){
    snapshot.forEach(snap=>{
      const data = snap.val();
      let mostrar = false;
      if(usuario.tipo==="marinheiro" && data.ownerId===usuario.uid) mostrar=true;
      if(usuario.tipo==="contratante") mostrar=true;

      if(mostrar){
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${data.nome}</td><td>${data.email}</td><td><a href="${data.arquivoBase64}" target="_blank">Ver PDF</a></td><td>${data.visualizacoes||0}</td>`;
        tabelaBody.appendChild(tr);

        if(usuario.tipo==="contratante"){
          update(ref(db,"curriculos/"+snap.key),{visualizacoes:(data.visualizacoes||0)+1});
        }
      }
    });
  }
}
