// app.js - Lógica Interactiva, Exportaciones y Modales
import { supabase, loginWithGoogle, logout, onAuthStateChange } from './supabaseClient.js';
import { StatsEngine } from './statsEngine.js';
import { AIChat } from './aiChat.js';

class StatCalcApp {
  constructor() {
    this.currentUser = null;
    this.currentResults = null;
    this.aiChat = new AIChat(this);
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupAuthListener();
  }

  bindEvents() {
    // Auth Events
    document.getElementById('btnLoginGoogle').addEventListener('click', () => loginWithGoogle());
    document.getElementById('userProfileBtn').addEventListener('click', () => this.openProfileModal());
    document.getElementById('btnCloseModal').addEventListener('click', () => this.closeProfileModal());
    document.getElementById('btnLogout').addEventListener('click', () => logout());

    // Calculate Event
    document.getElementById('btnCalculate').addEventListener('click', () => this.runCalculation());

    // AI Chat Events
    document.getElementById('btnSendChat').addEventListener('click', () => this.handleChat());
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleChat();
    });

    // Export Events
    document.getElementById('btnExportCSV').addEventListener('click', () => this.exportCSV());
    document.getElementById('btnExportExcel').addEventListener('click', () => this.exportExcel());
    document.getElementById('btnExportPDF').addEventListener('click', () => this.exportPDF());
  }

  setupAuthListener() {
    onAuthStateChange((user) => {
      this.currentUser = user;
      const btnLogin = document.getElementById('btnLoginGoogle');
      const profileBtn = document.getElementById('userProfileBtn');
      const avatar = document.getElementById('userAvatar');

      if (user) {
        btnLogin.style.display = 'none';
        profileBtn.style.display = 'block';
        avatar.src = user.user_metadata?.avatar_url || 'https://via.placeholder.com/40';
      } else {
        btnLogin.style.display = 'block';
        profileBtn.style.display = 'none';
      }
    });
  }

  openProfileModal() {
    if (!this.currentUser) return;
    document.getElementById('modalUserName').innerText = this.currentUser.user_metadata?.full_name || 'Usuario';
    document.getElementById('modalUserEmail').innerText = this.currentUser.email || '';
    document.getElementById('modalUserAvatar').src = this.currentUser.user_metadata?.avatar_url || '';
    document.getElementById('profileModal').style.display = 'flex';
  }

  closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
  }

  setDataInput(text) {
    document.getElementById('rawDataInput').value = text;
  }

  resetAll() {
    document.getElementById('rawDataInput').value = '';
    document.getElementById('stepByStepOutput').innerHTML = '<p style="color: var(--text-muted);">Campos reseteados.</p>';
  }

  runCalculation() {
    const rawInput = document.getElementById('rawDataInput').value;
    const isSample = document.getElementById('sampleType').value === 'sample';
    
    const parsedData = rawInput.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

    if (parsedData.length === 0) {
      alert("Por favor ingresa una serie válida de números separados por coma.");
      return;
    }

    const res = StatsEngine.calculateUngrouped(parsedData, isSample);
    this.currentResults = res;

    // Mostrar pasos en la UI
    const outputDiv = document.getElementById('stepByStepOutput');
    outputDiv.innerHTML = res.steps.map(step => `<div class="step-card">${step}</div>`).join('');

    // Renderizar Gráfico 3D
    this.render3DChart(parsedData);
  }

  render3DChart(data) {
    // Generar Superficie 3D representativa de la distribución
    const x = data;
    const y = data.map((v, i) => i);
    const z = data.map(v => Math.sin(v));

    const trace = {
      x: x, y: y, z: z,
      mode: 'markers',
      marker: {
        size: 8,
        color: x,
        colorscale: 'Viridis',
        opacity: 0.8
      },
      type: 'scatter3d'
    };

    const layout = {
      margin: { l: 0, r: 0, b: 0, t: 0 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      scene: {
        xaxis: { title: 'Valores' },
        yaxis: { title: 'Índice' },
        zaxis: { title: 'Densidad' }
      }
    };

    Plotly.newPlot('chartContainer', [trace], layout, { responsive: true, displayModeBar: false });
  }

  async handleChat() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    this.appendChatMessage(text, 'user');
    input.value = '';

    const response = await this.aiChat.processMessage(text);
    this.appendChatMessage(response, 'ai');
  }

  appendChatMessage(msg, type) {
    const box = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerText = msg;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  exportCSV() {
    if (!this.currentResults) return alert("Primero realiza un cálculo.");
    let csvContent = "data:text/csv;charset=utf-8,Metrica,Valor\n";
    for (let [k, v] of Object.entries(this.currentResults.results)) {
      csvContent += `${k},${v}\n`;
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Resultados_Estadisticos.csv");
    document.body.appendChild(link);
    link.click();
  }

  exportExcel() {
    if (!this.currentResults) return alert("Primero realiza un cálculo.");
    const ws = XLSX.utils.json_to_sheet([this.currentResults.results]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "Reporte_Estadistico.xlsx");
  }

  exportPDF() {
    if (!this.currentResults) return alert("Primero realiza un cálculo.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Reporte Estadístico - StatCalc Pro", 10, 10);
    let y = 20;
    for (let [k, v] of Object.entries(this.currentResults.results)) {
      doc.text(`${k}: ${v}`, 10, y);
      y += 10;
    }
    doc.save("Reporte_Estadistico.pdf");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new StatCalcApp();
});