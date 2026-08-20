// ============================================
// CONFIGURATION DES UTILISATEURS (simulation)
// Modifiez ou ajoutez des comptes selon vos besoins
// ============================================
const users = [
    { username: "manager1", password: "pass1", name: "Manager 1" },
    { username: "manager2", password: "pass2", name: "Manager 2" },
    { username: "admin", password: "admin", name: "Administrateur" }
];

// Données des cours (exemples avec niveaux et autoInscription)
// Données des cours (exemples avec thèmes, niveaux, syllabus)
let courses = [
    {
        id: 1,
        title: "Les fondamentaux du management",
        description: "Comprendre les bases du rôle de manager, la posture et les missions clés.",
        theme: "Management",
        niveau: 1,
        duree: "3h",
        autoInscription: true,
        assigned: true,
        progress: 100,
        color: "#00afa9",
        type: "obligatoire",   // ⬅️ Ajouter ceci
        syllabus: [
            "Rôle et missions du manager",
            "Les styles de management",
            "Fixer des objectifs SMART"
        ]
    },
    {
        id: 2,
        title: "Donner du feedback constructif",
        description: "Techniques pour formuler des retours efficaces et bienveillants.",
        theme: "Communication",
        niveau: 1,
        duree: "2h",
        autoInscription: true,
        assigned: true,
        progress: 0,
        color: "#096475",
        type: "obligatoire",   // ⬅️ Ajouter ceci
        syllabus: [
            "Les principes du feedback",
            "La méthode DESC",
            "Mises en situation"
        ]
    },
    {
        id: 3,
        title: "Techniques de vente avancées",
        description: "Maîtriser les étapes clés pour convaincre et fidéliser.",
        theme: "Commerciale",
        niveau: 2,
        duree: "4h",
        autoInscription: false,
        assigned: false,
        progress: 0,
        color: "#ffa900",
        type: "obligatoire",   // ⬅️ Ajouter ceci
        syllabus: [
            "Découverte des besoins",
            "Argumentation et traitement des objections",
            "Clôture de la vente"
        ]
    },
    {
        id: 4,
        title: "L'excellence du service client",
        description: "Créer une expérience client mémorable et durable.",
        theme: "Relation client",
        niveau: 1,
        duree: "2h30",
        autoInscription: true,
        assigned: false,
        progress: 0,
        color: "#7200a9",
        type: "obligatoire",   // ⬅️ Ajouter ceci
        syllabus: [
            "Les attentes du client moderne",
            "Gestion des réclamations",
            "Fidélisation et recommandation"
        ]
    },
    {
        id: 5,
        title: "Gestion du temps et priorités",
        description: "Organiser sa journée et se concentrer sur l'essentiel.",
        theme: "Soft skills",
        niveau: 2,
        duree: "1h30",
        autoInscription: true,
        assigned: true,
        progress: 0,
        color: "#00afa9",
        type: "obligatoire",   // ⬅️ Ajouter ceci
        syllabus: [
            "Matrice d'Eisenhower",
            "Planification efficace",
            "Délégation"
        ]
    },
    {
        id: 6,
        title: "Leadership et vision",
        description: "Développer une vision stratégique et fédérer les équipes.",
        theme: "Management",
        niveau: 4,
        duree: "4h",
        autoInscription: false,
        assigned: false,
        progress: 0,
        color: "#096475",
        type: "obligatoire",   // ⬅️ Ajouter ceci
        syllabus: [
            "Construire une vision",
            "Communiquer la vision",
            "Incarner le changement"
        ]
    },
    // Ajoutez d'autres cours selon vos besoins...
];

// État du filtre actuel pour le catalogue
let currentNiveau = 'all';   // 'all' ou '1', '2', '3', '4'
// État du catalogue
let currentTheme = 'Management';   // Thématique sélectionnée par défaut
let selectedCourseId = null;       // ID du cours sélectionné (pour le détail)

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
        loadProgressFromLocalStorage();  //
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
        // Si c'est le catalogue, mettre à jour le contenu
        if (targetSection === 'catalogue') {
            renderCatalogue();
        } else if (targetSection === 'mes-formations') {
            renderMesFormations();
        }
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

// ============================================
// RENDU DES COURS (catalogue et mes formations)
// ============================================
function renderCatalogue() {
    const container = document.getElementById('catalogueContainer');
    const titleEl = document.getElementById('catalogueTitle');
    const searchInput = document.getElementById('searchInputCatalogue');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    // Si un cours est sélectionné, on affiche le détail
    if (selectedCourseId !== null) {
        const course = courses.find(c => c.id === selectedCourseId);
        if (course) {
            renderCourseDetail(course, container, titleEl);
            return;
        }
    }

    // Sinon, on affiche les colonnes de niveaux pour la thématique courante
    titleEl.textContent = currentTheme;
    const themeCourses = courses.filter(c => c.theme === currentTheme && 
        (!searchTerm || c.title.toLowerCase().includes(searchTerm) || c.description.toLowerCase().includes(searchTerm)));

    // Regrouper par niveau
    const levels = [1, 2, 3, 4];
    let html = '<div class="levels-grid">';
    levels.forEach(level => {
        const coursesForLevel = themeCourses.filter(c => c.niveau === level);
        html += `
            <div class="level-column">
                <h4>Niveau ${level}</h4>
                ${coursesForLevel.map(course => `
    <div class="course-item" data-course-id="${course.id}">
        ${course.progress === 100 ? '<span class="badge-completed">Terminé ✓</span>' : ''}
        <div class="course-item-title">${course.title}</div>
        <div class="course-item-duree">⏱ ${course.duree}</div>
    </div>
`).join('')}
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;

    // Ajouter les écouteurs sur les cours
    container.querySelectorAll('.course-item').forEach(item => {
        item.addEventListener('click', () => {
            selectedCourseId = parseInt(item.dataset.courseId);
            renderCatalogue();
        });
    });
}

function renderCourseDetail(course, container, titleEl) {
    titleEl.textContent = course.title;
    container.innerHTML = `
        <div class="course-detail">
            <div class="level-column">
                <h4>Niveau ${course.niveau}</h4>
                <div class="course-item" style="cursor: default;">
                    <div class="course-item-title">${course.title}</div>
                    <div class="course-item-duree">⏱ ${course.duree}</div>
                </div>
                <button class="btn" onclick="closeCourseDetail()">← Retour</button>
            </div>
            <div class="course-detail-panel">
                <h3>${course.title}</h3>
                <p><strong>Thématique :</strong> ${course.theme}</p>
                <p><strong>Niveau :</strong> ${course.niveau}</p>
                <p><strong>Durée :</strong> ${course.duree}</p>
                <p>${course.description}</p>
                <h4>Syllabus :</h4>
                <ul class="syllabus-list">
                    ${course.syllabus.map(point => `<li>${point}</li>`).join('')}
                </ul>
                ${course.autoInscription 
                    ? `<a href="cours-${course.id}.html" class="btn">Commencer</a>` 
                    : `<button class="btn btn-disabled" disabled>Inscription sur demande</button>`}
            </div>
        </div>
    `;
}

function closeCourseDetail() {
    selectedCourseId = null;
    renderCatalogue();
}

// ============================================
// TABLEAU DE BORD (dashboard)
// ============================================
let progressChartInstance = null;

function loadProgressFromLocalStorage() {
    courses.forEach(course => {
        const completed = localStorage.getItem(`cours${course.id}_completed`);
        if (completed === 'true') {
            course.progress = 100;
            const score = localStorage.getItem(`cours${course.id}_score`);
            if (score) {
                course.score = parseInt(score);
            }
        }
    });
}

function renderDashboard() {
    const totalCours = courses.filter(c => c.assigned).length;
    const completedCours = courses.filter(c => c.assigned && c.progress === 100).length;
    const progression = totalCours > 0 ? Math.round((completedCours / totalCours) * 100) : 0;

    // Mettre à jour la barre de progression globale
    const fill = document.querySelector('.progress-global .fill');
    const span = document.querySelector('.progress-global span');
    if (fill && span) {
        fill.style.width = progression + '%';
        span.textContent = progression + '%';
    }

    // Mettre à jour les statistiques
    const statValues = document.querySelectorAll('.stat-card .value');
    if (statValues.length >= 3) {
        // Niveau (on garde l'existant ou on calcule)
        // Points (simulé)
        // Formations suivies
        statValues[2].textContent = `${completedCours} / ${totalCours}`;
        // Badges (simulé)
        statValues[3].textContent = completedCours; // par exemple
    }

    // Graphique : nous pouvons maintenant regrouper par thème
    const themes = ['Management', 'Communication', 'Commerciale', 'Relation client', 'Soft skills'];
    const themeProgress = themes.map(theme => {
        const themeCourses = courses.filter(c => c.theme === theme && c.assigned);
        const themeCompleted = themeCourses.filter(c => c.progress === 100);
        return themeCourses.length > 0 ? Math.round((themeCompleted.length / themeCourses.length) * 100) : 0;
    });

    const ctx = document.getElementById('progressChart').getContext('2d');
    if (progressChartInstance) progressChartInstance.destroy();

    progressChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: themes,
            datasets: [{
                label: 'Progression par thématique (%)',
                data: themeProgress,
                backgroundColor: ['#00afa9', '#096475', '#ffa900', '#7200a9', '#cce1e1'],
                borderColor: ['#00afa9', '#096475', '#ffa900', '#7200a9', '#808284'],
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: function(value) { return value + '%'; } }
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

    // Si connecté, afficher le dashboard par défaut
    if (localStorage.getItem('sessionUser')) {
        document.querySelector('nav a[data-section="dashboard"]').classList.add('active');
        sections.dashboard.classList.add('active');
    }

    // Écouteurs pour la recherche
   document.getElementById('searchInputCatalogue').addEventListener('input', () => {
    selectedCourseId = null;   // on réinitialise le détail pour permettre la recherche dans les colonnes
    renderCatalogue();
    });
    document.getElementById('searchInputMesFormations').addEventListener('input', () => {
        renderMesFormations();
    });

    // Écouteurs pour la barre latérale des thématiques
document.querySelectorAll('#themeList li').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('#themeList li').forEach(li => li.classList.remove('active'));
        item.classList.add('active');
        currentTheme = item.dataset.theme;
        selectedCourseId = null;  // on réinitialise le détail
        renderCatalogue();
    });
});

    // Mettre à jour le catalogue au premier affichage si on est sur catalogue
    if (sections.catalogue.classList.contains('active')) {
        renderCatalogue();
    }
    // Gérer le hash pour navigation directe
if (location.hash === '#catalogue') {
    document.querySelector('nav a[data-section="catalogue"]').click();
} else if (location.hash === '#dashboard') {
    document.querySelector('nav a[data-section="dashboard"]').click();
}
});
