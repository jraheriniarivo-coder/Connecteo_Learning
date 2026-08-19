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
    {
        id: 1,
        title: "Les fondamentaux du management",
        description: "Comprendre les bases du rôle de manager, la posture et les missions clés.",
        category: "Management",
        duration: "3h",
        progress: 100,
        assigned: true,   // true = visible dans "Mes formations"
        color: "#00afa9"
    },
    {
        id: 2,
        title: "Donner du feedback constructif",
        description: "Techniques pour formuler des retours efficaces et bienveillants.",
        category: "Communication",
        duration: "2h",
        progress: 60,
        assigned: true,
        color: "#096475"
    },
    {
        id: 3,
        title: "Gestion du temps et priorités",
        description: "Outils pour organiser sa journée et se concentrer sur l'essentiel.",
        category: "Efficacité",
        duration: "1h30",
        progress: 30,
        assigned: true,
        color: "#ffa900"
    },
    {
        id: 4,
        title: "Animer un brief d'équipe",
        description: "Méthode pour préparer et animer un brief percutant en 10 minutes.",
        category: "Animation",
        duration: "1h",
        progress: 0,
        assigned: true,
        color: "#7200a9"
    },
    {
        id: 5,
        title: "Comprendre les KPIs",
        description: "Savoir lire et exploiter les indicateurs de performance pour piloter.",
        category: "Performance",
        duration: "2h",
        progress: 0,
        assigned: false,  // non assigné, apparaît seulement dans Catalogue
        color: "#096475"
    },
    {
        id: 6,
        title: "La pyramide de Maslow",
        description: "Comprendre la motivation et les besoins de vos collaborateurs.",
        category: "Motivation",
        duration: "1h",
        progress: 0,
        assigned: false,
        color: "#7200a9"
    }
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
    renderCoursesToContainer(container, courses, searchInput.value);
}

function renderMesFormations() {
    const container = document.getElementById('mesFormationsContainer');
    const searchInput = document.getElementById('searchInputMesFormations');
    const assignedCourses = courses.filter(c => c.assigned);
    renderCoursesToContainer(container, assignedCourses, searchInput.value);
}

function renderCoursesToContainer(container, courseList, searchTerm = '') {
    const filteredCourses = courseList.filter(course => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        return (
            course.title.toLowerCase().includes(term) ||
            course.category.toLowerCase().includes(term) ||
            course.description.toLowerCase().includes(term)
        );
    });

    container.innerHTML = '';
    if (filteredCourses.length === 0) {
        container.innerHTML = '<p>Aucune formation ne correspond à votre recherche.</p>';
        return;
    }

    filteredCourses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-header" style="background: linear-gradient(135deg, ${course.color}33, ${course.color});">
                ${course.category}
            </div>
            <div class="course-body">
                <div class="course-title">${course.title}</div>
                <p class="course-desc">${course.description}</p>
                <div class="course-meta">
                    <span>⏱ ${course.duration}</span>
                    <span>${course.progress}% terminé</span>
                </div>
                <div class="course-progress">
                    <div class="fill" style="width: ${course.progress}%;"></div>
                </div>
                <a href="cours-${course.id}.html" class="btn">${course.progress > 0 ? 'Continuer' : 'Commencer'}</a>
            </div>
        `;
        container.appendChild(card);
    });
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
                data: [100, 60, 30, 0, 0],
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