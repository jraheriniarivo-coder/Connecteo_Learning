// ============================================
// CONFIGURATION DES UTILISATEURS (simulation)
// Modifiez ou ajoutez des comptes selon vos besoins
// ============================================
const users = [
    { username: "manager1", password: "pass1", name: "Manager 1" },
    { username: "manager2", password: "pass2", name: "Manager 2" },
    { username: "admin", password: "admin", name: "Administrateur" }
];

// Données simulées des cours (à remplacer plus tard par une vraie base)
const courses = [
   // Données des cours (exemples avec niveaux et autoInscription)
let courses = [
    {
        id: 1,
        title: "Les fondamentaux du management",
        description: "Comprendre les bases du rôle de manager, la posture et les missions clés.",
        category: "Management",
        niveau: 1,
        duree: "3h",
        autoInscription: true,
        assigned: true,
        color: "#00afa9"
    },
    {
        id: 2,
        title: "Donner du feedback constructif",
        description: "Techniques pour formuler des retours efficaces et bienveillants.",
        category: "Communication",
        niveau: 1,
        duree: "2h",
        autoInscription: true,
        assigned: false,
        color: "#096475"
    },
    {
        id: 3,
        title: "Gestion du temps et priorités",
        description: "Outils pour organiser sa journée et se concentrer sur l'essentiel.",
        category: "Efficacité",
        niveau: 2,
        duree: "1h30",
        autoInscription: false,
        assigned: true,
        color: "#ffa900"
    },
    {
        id: 4,
        title: "Animer un brief d'équipe",
        description: "Méthode pour préparer et animer un brief percutant en 10 minutes.",
        category: "Animation",
        niveau: 2,
        duree: "1h",
        autoInscription: true,
        assigned: true,
        color: "#7200a9"
    },
    {
        id: 5,
        title: "Comprendre les KPIs",
        description: "Savoir lire et exploiter les indicateurs de performance pour piloter.",
        category: "Performance",
        niveau: 3,
        duree: "2h",
        autoInscription: false,
        assigned: false,
        color: "#096475"
    },
    {
        id: 6,
        title: "Leadership et vision",
        description: "Développer une vision stratégique et fédérer les équipes.",
        category: "Leadership",
        niveau: 4,
        duree: "4h",
        autoInscription: false,
        assigned: false,
        color: "#7200a9"
    }
    // État du filtre actuel
let currentNiveau = 'all';   // 'all' ou 1,2,3,4
];

// ============================================
// GESTION DE L'AUTHENTIFICATION
// ============================================
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const currentUserSpan = document.getElementById('currentUser');
const logoutBtn = document.getElementById('logoutBtn');

// Vérifier si une session existe
function checkSession() {
    const sessionUser = localStorage.getItem('sessionUser');
    if (sessionUser) {
        showApp(JSON.parse(sessionUser));
    } else {
        showLogin();
    }
}

function showLogin() {
    loginScreen.style.display = 'flex';
    mainApp.style.display = 'none';
}

function showApp(user) {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'flex';
    currentUserSpan.textContent = user.name;
    renderDashboard();
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        localStorage.setItem('sessionUser', JSON.stringify(user));
        showApp(user);
        loginError.textContent = '';
    } else {
        loginError.textContent = 'Identifiant ou mot de passe incorrect.';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('sessionUser');
    showLogin();
});

// ============================================
// NAVIGATION ENTRE SECTIONS
// ============================================
const navLinks = document.querySelectorAll('nav a[data-section]');
const sections = {
    dashboard: document.getElementById('dashboardSection'),
    catalogue: document.getElementById('catalogueSection'),
    'mes-formations': document.getElementById('mesFormationsSection')
};

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = link.dataset.section;
        // Retirer la classe active de tous les liens
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        // Masquer toutes les sections
        Object.values(sections).forEach(s => s.classList.remove('active'));
        // Afficher la section cible
        sections[targetSection].classList.add('active');
        // Si c'est le catalogue ou mes formations, mettre à jour le contenu
        if (targetSection === 'catalogue') {
            renderCatalogue();
        } else if (targetSection === 'mes-formations') {
            renderMesFormations();
        }
    });
});

// ============================================
// RENDU DES COURS
// ============================================
function renderCatalogue() {
    const container = document.getElementById('catalogueContainer');
    const searchInput = document.getElementById('searchInputCatalogue');

    // Filtrer par niveau puis par recherche
    const filteredCourses = courses.filter(course => {
        const niveauOk = (currentNiveau === 'all' || course.niveau === parseInt(currentNiveau));
        const term = searchInput.value.trim().toLowerCase();
        const searchOk = !term || course.title.toLowerCase().includes(term) || course.description.toLowerCase().includes(term);
        return niveauOk && searchOk;
    });

    container.innerHTML = '';
    if (filteredCourses.length === 0) {
        container.innerHTML = '<p>Aucune formation ne correspond à votre sélection.</p>';
        return;
    }

    filteredCourses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';

        // Bouton selon autoInscription et progression
        let boutonHtml;
        if (course.autoInscription) {
            boutonHtml = `<a href="cours-${course.id}.html" class="btn">${course.progress > 0 ? 'Continuer' : 'Commencer'}</a>`;
        } else {
            boutonHtml = `<button class="btn btn-disabled" disabled>Inscription sur demande</button>`;
        }

        card.innerHTML = `
            <div class="course-header" style="background: linear-gradient(135deg, ${course.color}33, ${course.color});">
                ${course.category}
            </div>
            <div class="course-body">
                <div class="course-title">${course.title}</div>
                <p class="course-desc">${course.description}</p>
                <div class="course-meta">
                    <span>⏱ ${course.duree}</span>
                    <span>Niveau ${course.niveau}</span>
                </div>
                ${boutonHtml}
            </div>
        `;

        container.appendChild(card);
    });
}
}

// ============================================
// TABLEAU DE BORD (dashboard)
// ============================================
let progressChartInstance = null;

function renderDashboard() {
    // Met à jour les stats si nécessaire (données simulées)
    // Création du graphique Chart.js
    const ctx = document.getElementById('progressChart').getContext('2d');

    // Détruire l'ancien graphique s'il existe
    if (progressChartInstance) {
        progressChartInstance.destroy();
    }

    progressChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Management', 'Communication', 'Efficacité', 'Animation', 'Performance'],
            datasets: [{
                label: 'Progression par catégorie (%)',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#00afa9',
                    '#096475',
                    '#ffa900',
                    '#7200a9',
                    '#cce1e1'
                ],
                borderColor: [
                    '#00afa9',
                    '#096475',
                    '#ffa900',
                    '#7200a9',
                    '#808284'
                ],
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) { return value + '%'; }
                    }
                }
            }
        }
    });
}

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkSession();

    // Par défaut, afficher le dashboard si connecté
    if (localStorage.getItem('sessionUser')) {
        document.querySelector('nav a[data-section="dashboard"]').classList.add('active');
        sections.dashboard.classList.add('active');
    }

    // Écouteurs pour la recherche en temps réel
    document.getElementById('searchInputCatalogue').addEventListener('input', () => {
        renderCatalogue();
    });

    document.getElementById('searchInputMesFormations').addEventListener('input', () => {
        renderMesFormations();
    });
    // Gestion des clics sur les niveaux dans la barre latérale
document.querySelectorAll('#niveauList li').forEach(item => {
    item.addEventListener('click', () => {
        // Mettre à jour la classe active
        document.querySelectorAll('#niveauList li').forEach(li => li.classList.remove('active'));
        item.classList.add('active');

        // Mettre à jour le filtre niveau
        currentNiveau = item.dataset.niveau; // 'all' ou '1', '2', etc.
        renderCatalogue();
    });
});
// ============================================
// MENU UTILISATEUR DÉROULANT
// ============================================
const userMenu = document.querySelector('.user-menu');
const userMenuButton = document.getElementById('userMenuButton');
const userDropdown = document.getElementById('userDropdown');

userMenuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu.classList.toggle('open');
    userDropdown.classList.toggle('open');
});

// Fermer le menu si on clique ailleurs
document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
        userMenu.classList.remove('open');
        userDropdown.classList.remove('open');
    }
});
