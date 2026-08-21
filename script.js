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
// Groupes de formation (simulation)
let groupes = [
    { id: 1, nom: "Groupe A", coursId: 1, dateDebut: "2026-09-01", dateFin: "2026-09-30", participants: [] },
    { id: 2, nom: "Groupe B", coursId: 2, dateDebut: "2026-10-01", dateFin: "2026-10-31", participants: [] }
];

// Utilisateurs importés (simulation)
let importedUsers = [];
// ============================================
// GESTION DE L'AUTHENTIFICATION
// ============================================
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const currentUserSpan = document.getElementById('currentUser');
const logoutBtn = document.getElementById('logoutBtn');
// Variables admin
const adminNavLink = document.getElementById('adminNavLink');
const adminSection = document.getElementById('adminSection');
const adminCoursesTable = document.getElementById('adminCoursesTable');
const btnAddCourse = document.getElementById('btnAddCourse');
const btnImportUsers = document.getElementById('btnImportUsers');
const importUsersFile = document.getElementById('importUsersFile');
const importedUsersList = document.getElementById('importedUsersList');

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
        // Afficher le lien Admin uniquement si l'utilisateur est admin
    if (user.username === 'admin') {
        adminNavLink.style.display = 'inline';
    } else {
        adminNavLink.style.display = 'none';
    }

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
    'mes-formations': document.getElementById('mesFormationsSection'),
    admin: document.getElementById('adminSection')
};
// Variables pour le modal de cours
const courseModalOverlay = document.getElementById('courseModalOverlay');
const courseModalTitle = document.getElementById('courseModalTitle');
const courseForm = document.getElementById('courseForm');
const courseTitleInput = document.getElementById('courseTitle');
const courseDescriptionInput = document.getElementById('courseDescription');
const courseThemeInput = document.getElementById('courseTheme');
const courseNiveauInput = document.getElementById('courseNiveau');
const courseDureeInput = document.getElementById('courseDuree');
const courseTypeInput = document.getElementById('courseType');
const courseAutoInscriptionInput = document.getElementById('courseAutoInscription');
const courseColorInput = document.getElementById('courseColor');
const courseSyllabusInput = document.getElementById('courseSyllabus');

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

        // Actions spécifiques
        if (targetSection === 'catalogue') {
            renderCatalogue();
        } else if (targetSection === 'mes-formations') {
            renderMesFormations();
        } else if (targetSection === 'admin') {
            renderAdminCourses();
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
function renderAdminCourses() {
    const tbody = adminCoursesTable;
    tbody.innerHTML = '';

    courses.forEach(course => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${course.id}</td>
            <td>${course.title}</td>
            <td>${course.theme}</td>
            <td>${course.niveau}</td>
            <td>${course.duree}</td>
            <td>${course.type === 'obligatoire' ? 'Obligatoire' : 'Information'}</td>
            <td>
                <button class="admin-btn edit" data-id="${course.id}">Modifier</button>
                <button class="admin-btn delete" data-id="${course.id}">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Ajouter des écouteurs sur les boutons (simulation)
    tbody.querySelectorAll('.edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const courseId = parseInt(btn.dataset.id);
            alert(`Modifier le cours ${courseId} (simulation)`);
        });
    });

    tbody.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const courseId = parseInt(btn.dataset.id);
            if (confirm(`Supprimer le cours ${courseId} ?`)) {
                courses = courses.filter(c => c.id !== courseId);
                renderAdminCourses();
                alert('Cours supprimé (simulation)');
            }
        });
    });
}
function setupAdminTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Retirer active des boutons et contenus
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Activer le bouton cliqué
            btn.classList.add('active');
            const target = btn.dataset.tab;
            document.getElementById(`tab-${target}`).classList.add('active');

            // Si on affiche l'onglet cours, remplir le tableau
            if (target === 'cours') {
                renderAdminCourses();
            }
        });
    });
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
// ============================================
// ADMINISTRATION
// ============================================

// Remplit la table des cours avec les nouvelles colonnes
function renderAdminCourses() {
    const tbody = adminCoursesTable;
    tbody.innerHTML = '';

    courses.forEach(course => {
        const tr = document.createElement('tr');
        // Compter les sessions pour ce cours (simulation : 2 pour id 1, 1 pour id 2, 0 sinon)
        const sessionCount = groupes.filter(g => g.coursId === course.id).length;

        tr.innerHTML = `
            <td>${course.theme}</td>
            <td>${course.title}</td>
            <td>${course.niveau}</td>
            <td>${course.duree}</td>
            <td>${course.type === 'obligatoire' ? 'Obligatoire' : 'Information'}</td>
            <td><span class="session-link" data-course-id="${course.id}">${sessionCount}</span></td>
            <td>
                <button class="admin-btn edit" data-id="${course.id}">Modifier</button>
                <button class="admin-btn affect" data-id="${course.id}">Affecter</button>
                <button class="admin-btn delete" data-id="${course.id}">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Ajouter les écouteurs sur les nombres de session
    tbody.querySelectorAll('.session-link').forEach(link => {
        link.addEventListener('click', () => {
            const courseId = parseInt(link.dataset.courseId);
            openSessionModal(courseId);
        });
    });

    // Écouteurs pour boutons Modifier, Supprimer, Affecter
    tbody.querySelectorAll('.edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const courseId = parseInt(btn.dataset.id);
            openEditCourseModal(courseId);
        });
    });

    tbody.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const courseId = parseInt(btn.dataset.id);
            if (confirm(`Supprimer le cours ${courseId} ?`)) {
                courses = courses.filter(c => c.id !== courseId);
                renderAdminCourses();
                alert('Cours supprimé (simulation)');
            }
        });
    });

    tbody.querySelectorAll('.affect').forEach(btn => {
        btn.addEventListener('click', () => {
            const courseId = parseInt(btn.dataset.id);
            openAffectationModal(courseId);
        });
    });
}

// Ouvre une modal affichant les sessions d'un cours
function openSessionModal(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const sessionsForCourse = groupes.filter(g => g.coursId === courseId);
    let html = `
        <div class="modal-overlay" id="sessionModalOverlay">
            <div class="modal-box">
                <h3>Sessions pour "${course.title}"</h3>
                ${sessionsForCourse.map(g => `
                    <div style="margin-bottom: 10px; padding: 10px; background: var(--gray-light); border-radius: 8px;">
                        <p><strong>Groupe :</strong> <a href="#" class="session-group-link" data-group-id="${g.id}">${g.nom}</a></p>
                        <p><strong>Période :</strong> ${g.dateDebut} → ${g.dateFin}</p>
                        <p><strong>Participants :</strong> ${g.participants.length}</p>
                    </div>
                `).join('') || '<p>Aucune session pour le moment.</p>'}
                <div class="modal-actions">
                    <button class="btn" onclick="closeModal('sessionModalOverlay')">Fermer</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    // Écouteur sur le nom du groupe pour voir les participants
    document.querySelectorAll('.session-group-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const groupId = parseInt(link.dataset.groupId);
            openGroupDetail(groupId);
        });
    });
}

// Affiche les détails d'un groupe (participants, statuts)
function openGroupDetail(groupId) {
    const group = groupes.find(g => g.id === groupId);
    if (!group) return;

    let html = `
        <div class="modal-overlay" id="groupDetailOverlay">
            <div class="modal-box">
                <h3>Groupe : ${group.nom}</h3>
                <p><strong>Cours :</strong> ${courses.find(c => c.id === group.coursId).title}</p>
                <p><strong>Période :</strong> ${group.dateDebut} → ${group.dateFin}</p>
                <h4>Participants (${group.participants.length})</h4>
                <ul>
                    ${group.participants.map(p => `<li>${p.nom} - ${p.fonction} - ${p.bu}</li>`).join('') || '<li>Aucun participant</li>'}
                </ul>
                <div class="modal-actions">
                    <button class="btn" onclick="closeModal('groupDetailOverlay')">Fermer</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

// Ouvre le modal d'affectation (Liste / Fichier)
function openAffectationModal(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    let html = `
        <div class="modal-overlay" id="affectationModalOverlay">
            <div class="modal-box">
                <h3>Affecter des participants à "${course.title}"</h3>
                <p>Choisissez la méthode :</p>
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button class="btn" id="btnChoiceList">📋 Liste</button>
                    <button class="btn" id="btnChoiceFile">📁 Fichier</button>
                </div>
                <div id="affectationContent">
                    <!-- Zone dynamique -->
                </div>
                <div class="modal-actions">
                    <button class="btn" onclick="closeModal('affectationModalOverlay')">Fermer</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('btnChoiceList').addEventListener('click', () => {
        showAffectationList(courseId);
    });
    document.getElementById('btnChoiceFile').addEventListener('click', () => {
        showAffectationFile(courseId);
    });
}

// Affiche la liste des collaborateurs (simulée) pour sélection
function showAffectationList(courseId) {
    const container = document.getElementById('affectationContent');
    // Simulons une liste de collaborateurs
    const collaborateurs = [
        { nom: "Rabe", fonction: "Manager", matricule: "M001", bu: "Comete" },
        { nom: "Rakoto", fonction: "CSA", matricule: "C002", bu: "YAS" },
        { nom: "Razafy", fonction: "Manager", matricule: "M003", bu: "Mvola" },
        { nom: "Andry", fonction: "CEO", matricule: "CEO001", bu: "Support" },
        { nom: "Lala", fonction: "Manager", matricule: "M004", bu: "Openfield" }
    ];

    let html = `<p>Filtrer par BU : 
        <select id="buFilter">
            <option value="">Toutes les BU</option>
            <option>Comete</option><option>YAS</option><option>Mvola</option><option>Support</option><option>Openfield</option>
        </select>
    </p>`;
    html += '<table class="admin-table"><thead><tr><th>Sélection</th><th>Fonction</th><th>Matricule</th><th>BU</th><th>Nom Prénom</th></tr></thead><tbody id="collabTableBody">';
    collaborateurs.forEach((c, index) => {
        html += `<tr data-bu="${c.bu}"><td><input type="checkbox" class="collabCheck" data-index="${index}"></td><td>${c.fonction}</td><td>${c.matricule}</td><td>${c.bu}</td><td>${c.nom}</td></tr>`;
    });
    html += '</tbody></table>';
    html += `<input type="text" id="groupName" placeholder="Nom du groupe (obligatoire)" style="width:100%; padding:10px; margin-top:10px;">`;
    html += `<button class="btn" id="btnValiderGroupe">Valider le groupe</button>`;
    container.innerHTML = html;

    document.getElementById('buFilter').addEventListener('change', (e) => {
        const val = e.target.value;
        document.querySelectorAll('#collabTableBody tr').forEach(tr => {
            if (!val || tr.dataset.bu === val) {
                tr.style.display = '';
            } else {
                tr.style.display = 'none';
            }
        });
    });

    document.getElementById('btnValiderGroupe').addEventListener('click', () => {
        const nomGroupe = document.getElementById('groupName').value.trim();
        if (!nomGroupe) {
            alert('Le nom du groupe est obligatoire');
            return;
        }
        const selected = [];
        document.querySelectorAll('.collabCheck:checked').forEach(cb => {
            const idx = parseInt(cb.dataset.index);
            selected.push(collaborateurs[idx]);
        });
        if (selected.length === 0) {
            alert('Sélectionnez au moins un participant');
            return;
        }
        const newGroup = {
            id: groupes.length + 1,
            nom: nomGroupe,
            coursId: courseId,
            dateDebut: "2026-09-01",  // à remplacer par calendrier plus tard
            dateFin: "2026-09-30",
            participants: selected
        };
        groupes.push(newGroup);
        closeModal('affectationModalOverlay');
        renderAdminCourses(); // met à jour la colonne session
    });
}

// Affiche un champ d'import de fichier (simulation)
function showAffectationFile(courseId) {
    const container = document.getElementById('affectationContent');
    container.innerHTML = `
        <p>Importez un fichier CSV (simulation).</p>
        <input type="file" id="fakeFileInput" accept=".csv">
        <button class="btn" id="btnImportFake">Importer</button>
        <p>Le groupe sera créé avec les participants du fichier.</p>
    `;
    document.getElementById('btnImportFake').addEventListener('click', () => {
        const nomGroupe = prompt("Nom du groupe (obligatoire) :");
        if (!nomGroupe) return;
        const newGroup = {
            id: groupes.length + 1,
            nom: nomGroupe,
            coursId: courseId,
            dateDebut: "2026-09-01",
            dateFin: "2026-09-30",
            participants: [{ nom: "Importé", fonction: "Inconnu", matricule: "IMP001", bu: "N/A" }]
        };
        groupes.push(newGroup);
        closeModal('affectationModalOverlay');
        renderAdminCourses();
    });
}

// Ferme une modal
function closeModal(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.remove();
}

// Gestion des onglets admin
function setupAdminTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.dataset.tab;
            document.getElementById(`tab-${target}`).classList.add('active');

            if (target === 'cours') {
                renderAdminCourses();
            } else if (target === 'global') {
                renderGlobalDashboard();
            }
        });
    });
}

// Bouton Ajouter un cours (simulation)
btnAddCourse.addEventListener('click', openAddCourseModal);

// Import d'utilisateurs (CSV simple)
btnImportUsers.addEventListener('click', () => {
    importUsersFile.click();
});

importUsersFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const csv = event.target.result;
        const lines = csv.split('\n');
        // Premier ligne = en-têtes
        const headers = lines[0].split(',').map(h => h.trim());
        importedUsers = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim());
            const user = {};
            headers.forEach((h, idx) => {
                user[h.toLowerCase()] = values[idx] || '';
            });
            importedUsers.push(user);
        }
        renderImportedUsers();
        alert(`${importedUsers.length} utilisateurs importés (simulation)`);
    };
    reader.readAsText(file);
});

function renderImportedUsers() {
    importedUsersList.innerHTML = '';
    importedUsers.forEach(user => {
        const li = document.createElement('li');
        li.textContent = `${user.nom || ''} ${user.prenom || ''} - ${user.fonction || ''} - ${user.bu || ''}`;
        importedUsersList.appendChild(li);
    });
}

// Dashboard global (Chart.js)
let globalPieChartInstance = null;
let globalBarChartInstance = null;

function renderGlobalDashboard() {
    document.getElementById('globalTotalCours').textContent = courses.length;
    document.getElementById('globalTotalGroupes').textContent = groupes.length;
    const avg = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0;
    document.getElementById('globalCompletion').textContent = avg + '%';

    // Données pour les graphiques
    const themeData = themes.map(theme => {
        const count = courses.filter(c => c.theme === theme).length;
        return count;
    });

    if (globalPieChartInstance) globalPieChartInstance.destroy();
    const pieCtx = document.getElementById('globalPieChart').getContext('2d');
    globalPieChartInstance = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: themes,
            datasets: [{
                data: themeData,
                backgroundColor: ['#00afa9', '#096475', '#ffa900', '#7200a9', '#cce1e1']
            }]
        }
    });

    if (globalBarChartInstance) globalBarChartInstance.destroy();
    const barCtx = document.getElementById('globalBarChart').getContext('2d');
    globalBarChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: courses.map(c => c.title),
            datasets: [{
                label: 'Progression (%)',
                data: courses.map(c => c.progress),
                backgroundColor: '#00afa9'
            }]
        }
    });
}
// ============================================
// GESTION DES COURS (AJOUT / MODIFICATION)
// ============================================

// Ouvre le modal pour ajouter un cours
function openAddCourseModal() {
    courseModalTitle.textContent = 'Ajouter un cours';
    courseForm.reset();
    courseColorInput.value = '#00afa9';
    courseAutoInscriptionInput.checked = true;
    courseForm.dataset.editId = '';  // pas d'ID en mode ajout
    courseModalOverlay.style.display = 'flex';
}

// Ouvre le modal pour modifier un cours existant
function openEditCourseModal(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    courseModalTitle.textContent = `Modifier le cours : ${course.title}`;
    courseTitleInput.value = course.title;
    courseDescriptionInput.value = course.description;
    courseThemeInput.value = course.theme;
    courseNiveauInput.value = course.niveau;
    courseDureeInput.value = course.duree;
    courseTypeInput.value = course.type;
    courseAutoInscriptionInput.checked = course.autoInscription;
    courseColorInput.value = course.color;
    courseSyllabusInput.value = course.syllabus.join('\n');

    courseForm.dataset.editId = courseId;
    courseModalOverlay.style.display = 'flex';
}

// Ferme le modal
function closeCourseModal() {
    courseModalOverlay.style.display = 'none';
}

// Enregistre le cours (ajout ou modification)
function saveCourse(event) {
    event.preventDefault();

    const title = courseTitleInput.value.trim();
    const description = courseDescriptionInput.value.trim();
    const theme = courseThemeInput.value;
    const niveau = parseInt(courseNiveauInput.value);
    const duree = courseDureeInput.value.trim();
    const type = courseTypeInput.value;
    const autoInscription = courseAutoInscriptionInput.checked;
    const color = courseColorInput.value;
    const syllabus = courseSyllabusInput.value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');

    if (!title || !description || !duree || syllabus.length === 0) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }

    const editId = courseForm.dataset.editId;

    if (editId) {
        // Mode modification
        const courseId = parseInt(editId);
        const index = courses.findIndex(c => c.id === courseId);
        if (index !== -1) {
            courses[index] = {
                ...courses[index],
                title,
                description,
                theme,
                niveau,
                duree,
                type,
                autoInscription,
                color,
                syllabus,
            };
        }
    } else {
        // Mode ajout
        const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
        const newCourse = {
            id: newId,
            title,
            description,
            theme,
            niveau,
            duree,
            type,
            autoInscription,
            assigned: false,
            progress: 0,
            color,
            syllabus,
        };
        courses.push(newCourse);
    }

    // Sauvegarder dans localStorage
    saveCoursesToLocalStorage();

    // Fermer le modal et rafraîchir
    closeCourseModal();
    renderAdminCourses();
    renderCatalogue();  // Met à jour le catalogue si visible
}

// Sauvegarde les cours dans localStorage
function saveCoursesToLocalStorage() {
    localStorage.setItem('coursesData', JSON.stringify(courses));
}

// Charge les cours depuis localStorage (au démarrage)
function loadCoursesFromLocalStorage() {
    const stored = localStorage.getItem('coursesData');
    if (stored) {
        try {
            courses = JSON.parse(stored);
        } catch (e) {
            console.warn('Erreur de parsing des cours sauvegardés', e);
        }
    }
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
  loadCoursesFromLocalStorage();   // Charger les cours sauvegardés
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
    setupAdminTabs();
// Remplir le tableau admin si l'utilisateur est admin et que la section admin est active
if (localStorage.getItem('sessionUser')) {
    const user = JSON.parse(localStorage.getItem('sessionUser'));
    if (user.username === 'admin') {
        renderAdminCourses();
    }
}
    // Écouteur pour le formulaire de cours
    courseForm.addEventListener('submit', saveCourse);
});
