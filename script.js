// ============================================
// CONFIGURATION SUPABASE
// ============================================
const SUPABASE_URL = "https://txdvluhigwkyrduqxmyr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZHZsdWhpZ3dreXJkdXF4bXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTYzMzEsImV4cCI6MjEwMjg5MjMzMX0.waXh6ptcSMocNPJMbF36IPGIH4E-EGdTvj9NwGoiSV0";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// CONFIGURATION UTILISATEURS (Démo)
// ============================================
const users = [
    { username: "test1", password: "pass1", name: "Test 1", role: "apprenant" },
    { username: "test2", password: "pass2", name: "Test 2", role: "apprenant" },
    { username: "admin", password: "admin", name: "Admin Connecteo", role: "admin" }
];
let realNotifications = [];

// ============================================
// DONNÉES
// ============================================
let courses = [];
let groupes = [];
let importedUsers = [];

// ============================================
// DÉTECTION PAGE
// ============================================
const isAdminPage = !!document.getElementById('adminSection');
const isLearnerPage = !!document.getElementById('catalogueSection');

// ============================================
// RÉFÉRENCES DOM (communes)
// ============================================
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const currentUserSpan = document.getElementById('currentUser');
const logoutBtn = document.getElementById('logoutBtn');

// Admin
const adminCoursesTable = document.getElementById('adminCoursesTable');
const btnAddCourse = document.getElementById('btnAddCourse');
const btnImportUsers = document.getElementById('btnImportUsers');
const importUsersFile = document.getElementById('importUsersFile');
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
const courseModulesContainer = document.getElementById('courseModulesContainer');
const courseVisibilityModeInput = document.getElementById('courseVisibilityMode');
const courseAvailabilityDateInput = document.getElementById('courseAvailabilityDate');
const btnSaveDraft = document.getElementById('btnSaveDraft');
const btnSaveAndQuit = document.getElementById('btnSaveAndQuit');
const btnPublish = document.getElementById('btnPublish');
const btnPublishAndAssign = document.getElementById('btnPublishAndAssign');

// Résultats
const filterCourseSelect = document.getElementById('filterCourse');
const btnExportCSV = document.getElementById('btnExportCSV');
const resultsTableBody = document.getElementById('resultsTableBody');
const resultsTotalCount = document.getElementById('resultsTotalCount');
const resultsCompletedCount = document.getElementById('resultsCompletedCount');
const resultsUniqueUsers = document.getElementById('resultsUniqueUsers');
const visibilitySummaryBody = document.getElementById('visibilitySummaryBody');

// État
let modules = [];
let currentTheme = 'Management';
let selectedCourseId = null;
let progressChartInstance = null;
let globalPieChartInstance = null;
let globalBarChartInstance = null;

// ============================================
// SESSION & AUTH
// ============================================
async function checkSession() {
    const sessionUser = sessionStorage.getItem('sessionUser');
    if (sessionUser) {
        const user = JSON.parse(sessionUser);
        const urlParams = new URLSearchParams(window.location.search);
        const forceLearner = urlParams.get('force') === 'learner';

        if (user.role === 'admin' && isLearnerPage && !forceLearner) {
            window.location.href = 'admin.html';
            return;
        }
        if (user.role !== 'admin' && isAdminPage) {
            window.location.href = 'index.html';
            return;
        }
        if (forceLearner) {
            history.replaceState(null, '', window.location.pathname);
        }
        await loadDataFromSupabase();
        showApp(user);
    } else {
        showLogin();
    }
}

function showLogin() {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
}

function showApp(user) {
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'flex';
    if (currentUserSpan) currentUserSpan.textContent = user.name;

    const goToAdmin = document.getElementById('goToAdmin');
    if (goToAdmin) {
        goToAdmin.style.display = (user.role === 'admin') ? 'block' : 'none';
    }

    if (isAdminPage) {
        setupAdminTabs();
        renderAdminCourses();
        renderGlobalDashboard();
    } else if (isLearnerPage) {
        renderDashboard();
        renderCatalogue();
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            sessionStorage.setItem('sessionUser', JSON.stringify(user));
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            if (loginError) loginError.textContent = 'Identifiant ou mot de passe incorrect.';
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('sessionUser');
        window.location.href = 'index.html';
    });
}

// ============================================
// CHARGEMENT DONNÉES SUPABASE
// ============================================
async function loadDataFromSupabase() {
    let query = supabaseClient.from('courses').select('*').order('id', { ascending: true });
    if (isLearnerPage) {
        query = query.eq('status', 'published');
    }
    const { data: coursesData, error: coursesError } = await query;
    if (coursesError) {
        console.error('Erreur chargement cours:', coursesError);
    } else {
        courses = coursesData || [];
    }

    const { data: groupesData, error: groupesError } = await supabaseClient
        .from('enrollments')
        .select(`
            id, user_id, course_id, groupe, date_debut, date_fin,
            profiles:user_id (full_name, matricule, bu, fonction)
        `);
    if (groupesError) {
        console.error('Erreur chargement groupes:', groupesError);
    } else {
        const groupsMap = {};
        (groupesData || []).forEach(g => {
            const key = `${g.groupe}__${g.course_id}`;
            if (!groupsMap[key]) {
                groupsMap[key] = {
                    id: g.id,
                    nom: g.groupe,
                    coursId: g.course_id,
                    dateDebut: g.date_debut,
                    dateFin: g.date_fin,
                    participants: []
                };
            }
            if (g.profiles) {
                groupsMap[key].participants.push({
                    user_id: g.user_id,
                    nom: g.profiles.full_name,
                    matricule: g.profiles.matricule,
                    bu: g.profiles.bu,
                    fonction: g.profiles.fonction
                });
            }
        });
        groupes = Object.values(groupsMap);
    }

    const sessionUserForEnroll = JSON.parse(sessionStorage.getItem('sessionUser') || 'null');
    window.userEnrollments = [];
    window.userPendingRequests = [];

    if (sessionUserForEnroll) {
        const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('username', sessionUserForEnroll.username)
            .maybeSingle();

        if (profileData) {
            const { data: enrollData } = await supabaseClient
                .from('enrollments')
                .select('course_id')
                .eq('user_id', profileData.id);
            window.userEnrollments = (enrollData || []).map(e => e.course_id);

            const { data: reqData } = await supabaseClient
                .from('enrollment_requests')
                .select('course_id')
                .eq('user_id', profileData.id)
                .eq('status', 'pending');
            window.userPendingRequests = (reqData || []).map(r => r.course_id);

            const { data: progressData, error: progressError } = await supabaseClient
                .from('progress')
                .select('*')
                .eq('user_id', profileData.id);

            if (progressError) {
                console.error('Erreur chargement progression:', progressError);
            } else {
                (progressData || []).forEach(p => {
                    const course = courses.find(c => c.id === p.course_id);
                    if (course) {
                        course.progress = p.completed ? 100 : 0;
                        course.score = p.score;
                    }
                });
            }
        }
    }
}

// ============================================
// MENU UTILISATEUR
// ============================================
const userMenu = document.querySelector('.user-menu');
const userMenuButton = document.getElementById('userMenuButton');
const userDropdown = document.getElementById('userDropdown');

if (userMenuButton && userMenu && userDropdown) {
    userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('open');
        userDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target)) {
            userMenu.classList.remove('open');
            userDropdown.classList.remove('open');
        }
    });
}

// ============================================
// NAVIGATION APPRENANT
// ============================================
if (isLearnerPage) {
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
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            Object.values(sections).forEach(s => s && s.classList.remove('active'));
            if (sections[targetSection]) sections[targetSection].classList.add('active');

            if (targetSection === 'catalogue') {
                renderCatalogue();
            } else if (targetSection === 'mes-formations') {
                renderMesFormations();
            }
        });
    });

    document.getElementById('searchInputCatalogue')?.addEventListener('input', () => {
        selectedCourseId = null;
        renderCatalogue();
    });
    document.getElementById('searchInputMesFormations')?.addEventListener('input', () => {
        renderMesFormations();
    });

    document.querySelectorAll('#themeList li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('#themeList li').forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            currentTheme = item.dataset.theme;
            selectedCourseId = null;
            renderCatalogue();
        });
    });
}

// ============================================
// CATALOGUE
// ============================================
function renderCatalogue() {
    if (!isLearnerPage) return;
    const container = document.getElementById('catalogueContainer');
    const titleEl = document.getElementById('catalogueTitle');
    const searchInput = document.getElementById('searchInputCatalogue');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (selectedCourseId !== null) {
        const course = courses.find(c => c.id === selectedCourseId);
        if (course) {
            renderCourseDetail(course, container, titleEl);
            return;
        }
    }

    titleEl.textContent = currentTheme;
    
    const themeCourses = courses.filter(c => 
        c.theme === currentTheme && 
        c.visibility_mode !== 'assigned_only' &&
        (!searchTerm || c.title.toLowerCase().includes(searchTerm) || c.description.toLowerCase().includes(searchTerm))
    );

    const levels = [1, 2, 3, 4];
    let html = '<div class="levels-grid">';
    levels.forEach(level => {
        const coursesForLevel = themeCourses.filter(c => c.niveau === level);
        html += `
            <div class="level-column">
                <h4>Niveau ${level}</h4>
                ${coursesForLevel.map(course => renderCatalogueCard(course)).join('')}
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.course-item').forEach(item => {
        item.addEventListener('click', () => {
            selectedCourseId = parseInt(item.dataset.courseId);
            renderCatalogue();
        });
    });
}

function renderCatalogueCard(course) {
    let badgeHtml = '';
    let lockedClass = '';
    
    switch (course.visibility_mode) {
        case 'auto_enrollment_with_validation':
            badgeHtml = '<span class="badge-mode badge-auto">🟢 Auto-inscription</span>';
            break;
        case 'unlock_by_progression':
            badgeHtml = `<span class="badge-mode badge-locked">🔒 À débloquer</span>`;
            lockedClass = 'course-locked';
            break;
        case 'mandatory':
            const now = new Date();
            const deadline = course.deadline ? new Date(course.deadline) : null;
            if (deadline && deadline < now) {
                badgeHtml = '<span class="badge-mode badge-late">🔴 EN RETARD</span>';
            } else {
                badgeHtml = '<span class="badge-mode badge-mandatory">🔴 OBLIGATOIRE</span>';
            }
            break;
    }
    
    let prereqMsg = '';
    if (course.visibility_mode === 'unlock_by_progression' && course.prerequisite_course_id) {
        const prereq = courses.find(c => c.id === course.prerequisite_course_id);
        if (prereq) {
            prereqMsg = `<div class="prereq-msg">À débloquer après : <b>${prereq.title}</b></div>`;
        }
    }
    
    return `
        <div class="course-item ${lockedClass}" data-course-id="${course.id}">
            ${course.progress === 100 ? '<span class="badge-completed">Terminé ✓</span>' : ''}
            ${badgeHtml}
            <div class="course-item-title">${course.title}</div>
            <div class="course-item-duree">⏱ ${course.duree}</div>
            ${prereqMsg}
        </div>
    `;
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
                <button class="btn btn-secondary" onclick="closeCourseDetail()">← Retour</button>
            </div>
            <div class="course-detail-panel">
                <h3>${course.title}</h3>
                <p><strong>Thématique :</strong> ${course.theme}</p>
                <p><strong>Niveau :</strong> ${course.niveau}</p>
                <p><strong>Durée :</strong> ${course.duree}</p>
                <p>${course.description}</p>
                <h4>Syllabus :</h4>
                <ul class="syllabus-list">
                    ${(course.syllabus || []).map(point => `<li>${point}</li>`).join('')}
                </ul>
                ${(() => {
    const mode = course.visibility_mode || 'assigned_only';
    const isAssigned = window.userEnrollments && window.userEnrollments.includes(course.id);
    const isPending = window.userPendingRequests && window.userPendingRequests.includes(course.id);
    
    const playerUrl = course.html_content ? `html-player.html?id=${course.id}` : `course-player.html?id=${course.id}`;
    
    if (mode === 'unlock_by_progression') {
        const prereq = courses.find(c => c.id === course.prerequisite_course_id);
        const prereqTitle = prereq ? prereq.title : 'un cours préalable';
        const prereqDone = prereq && prereq.progress === 100;
        if (prereqDone) {
            return course.external_url ? `<a href="${course.external_url}" class="btn" target="_blank">Commencer</a>` : `<a href="${playerUrl}" class="btn">Commencer</a>`;
        }
        return `<button class="btn btn-disabled" disabled>🔒 À débloquer après : ${prereqTitle}</button>`;
    }
    
    if (mode === 'auto_enrollment_with_validation') {
        if (isAssigned) {
            return course.external_url ? `<a href="${course.external_url}" class="btn" target="_blank">Commencer</a>` : `<a href="${playerUrl}" class="btn">Commencer</a>`;
        }
        if (isPending) {
            return `<button class="btn btn-disabled" disabled>⏳ Demande en attente de validation</button>`;
        }
        return `<button class="btn" onclick="requestEnrollment(${course.id})">📩 Demander l'inscription</button>`;
    }
    
    if (mode === 'mandatory' || isAssigned) {
        return course.external_url ? `<a href="${course.external_url}" class="btn" target="_blank">Commencer</a>` : `<a href="${playerUrl}" class="btn">Commencer</a>`;
    }
    
    if (mode === 'assigned_only') {
        return isAssigned ? `<a href="${playerUrl}" class="btn">Commencer</a>` : `<button class="btn btn-disabled" disabled>Réservé aux personnes affectées</button>`;
    }
    
    return `<button class="btn btn-disabled" disabled>Inscription sur demande</button>`;
})()}
            </div>
        </div>
    `;
}

function closeCourseDetail() {
    selectedCourseId = null;
    renderCatalogue();
}

// ============================================
// MES FORMATIONS
// ============================================
function renderMesFormations() {
    if (!isLearnerPage) return;
    const container = document.getElementById('mesFormationsContainer');
    const searchInput = document.getElementById('searchInputMesFormations');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const assignedCourses = courses.filter(c => 
        window.userEnrollments && window.userEnrollments.includes(c.id) &&
        (!searchTerm || c.title.toLowerCase().includes(searchTerm) || c.description.toLowerCase().includes(searchTerm))
    );

    container.innerHTML = '';
    if (assignedCourses.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune formation assignée pour le moment.</p>';
        return;
    }

    const now = new Date();

    assignedCourses.forEach(course => {
        let badgeHtml = '';
        let extraInfo = '';

        if (course.visibility_mode === 'mandatory' && course.deadline) {
            const deadline = new Date(course.deadline);
            if (deadline < now) {
                badgeHtml = '<span class="badge-mode badge-late">🔴 EN RETARD</span>';
                extraInfo = `<div class="deadline-info deadline-late">⚠️ Date limite dépassée : ${deadline.toLocaleDateString('fr-FR')}</div>`;
            } else {
                badgeHtml = '<span class="badge-mode badge-mandatory">🔴 OBLIGATOIRE</span>';
                extraInfo = `<div class="deadline-info">📅 À terminer avant le ${deadline.toLocaleDateString('fr-FR')}</div>`;
            }
        }

        const playerUrl = course.external_url || (course.html_content ? `html-player.html?id=${course.id}` : `course-player.html?id=${course.id}`);

        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-header" style="background: linear-gradient(135deg, ${course.color}33, ${course.color});">
                ${course.theme}
                ${badgeHtml}
            </div>
            <div class="course-body">
                <div class="course-title">${course.title}</div>
                <p class="course-desc">${course.description}</p>
                ${extraInfo}
                <div class="course-meta">
                    <span>⏱ ${course.duree}</span>
                    <span>${course.progress || 0}% terminé</span>
                </div>
                <div class="course-progress">
                    <div class="fill" style="width: ${course.progress || 0}%;"></div>
                </div>
                <a href="${playerUrl}" class="btn">${(course.progress || 0) > 0 ? 'Continuer' : 'Commencer'}</a>     
            </div>
        `;
        container.appendChild(card);
    });
}

// ============================================
// ADMIN : GESTION DES COURS
// ============================================
function renderAdminCourses() {
    if (!isAdminPage || !adminCoursesTable) return;
    const tbody = adminCoursesTable;
    tbody.innerHTML = '';

    const filteredCourses = applyCourseFilters();
    const countEl = document.getElementById('courseFilterCount');
    if (countEl) countEl.textContent = `${filteredCourses.length} / ${courses.length} cours`;

    filteredCourses.forEach(course => {
        const tr = document.createElement('tr');
        const sessionCount = groupes.filter(g => g.coursId === course.id).length;

        tr.innerHTML = `
            <td><span class="badge-theme">${course.theme}</span></td>
            <td>
                <strong>${course.title}</strong>
                ${course.status === 'draft' ? '<span class="badge-draft">Brouillon</span>' : ''}
                ${course.status === 'editing' ? '<span class="badge-editing">En édition</span>' : ''}
            </td>
            <td>Niv. ${course.niveau}</td>
            <td>${course.duree}</td>
            <td>${course.type === 'obligatoire' ? '<span class="badge-type badge-mandatory">Obligatoire</span>' : '<span class="badge-type">Information</span>'}</td>
            <td><span class="session-link" data-course-id="${course.id}">${sessionCount}</span></td>
            <td>${getValidatedCount(course)}</td>
            <td>${getCompletedCount(course)}</td>
            <td>
                <div class="table-actions">
                    <button class="admin-btn edit" data-id="${course.id}" title="Modifier">✏️</button>
                    <button class="admin-btn affect" data-id="${course.id}" title="Affecter">👥</button>
                    <button class="admin-btn delete" data-id="${course.id}" title="Supprimer">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.session-link').forEach(link => {
        link.addEventListener('click', () => {
            const courseId = parseInt(link.dataset.courseId);
            openSessionModal(courseId);
        });
    });

    tbody.querySelectorAll('.edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const courseId = parseInt(btn.dataset.id);
            openEditCourseModal(courseId);
        });
    });

    tbody.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', async () => {
            const courseId = parseInt(btn.dataset.id);
            if (confirm(`Supprimer le cours ${courseId} ?`)) {
                const { error } = await supabaseClient.from('courses').delete().eq('id', courseId);
                if (error) alert('Erreur suppression : ' + error.message);
                else {
                    courses = courses.filter(c => c.id !== courseId);
                    renderAdminCourses();
                }
            }
        });
    });

    tbody.querySelectorAll('.affect').forEach(btn => {
        btn.addEventListener('click', () => {
            const courseId = parseInt(btn.dataset.id);
            openAffectationModal(courseId);
        });
    });
    populateCourseFilters();
}

// ... (Le reste des fonctions admin, modules, sessions, affectations, profils, résultats, notifications, etc. reste identique au script.js précédent, je ne le répète pas pour éviter d'alourdir la réponse, mais tu dois le copier depuis le script.js que je t'ai fourni précédemment) ...

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await checkSession();

    if (isAdminPage) {
        courseForm?.addEventListener('submit', (e) => e.preventDefault());
        filterCourseSelect?.addEventListener('change', loadResults);
        btnExportCSV?.addEventListener('click', exportResultsToCSV);
        document.getElementById('btnDeleteAllUsers')?.addEventListener('click', deleteAllProfiles);

        document.getElementById('profileSearch')?.addEventListener('input', renderFilteredProfiles);
        document.getElementById('profileBuFilter')?.addEventListener('change', renderFilteredProfiles);
        document.getElementById('profileRoleFilter')?.addEventListener('change', renderFilteredProfiles);
        document.getElementById('btnResetProfileFilters')?.addEventListener('click', () => {
            const search = document.getElementById('profileSearch');
            const bu = document.getElementById('profileBuFilter');
            const role = document.getElementById('profileRoleFilter');
            if (search) search.value = '';
            if (bu) bu.value = '';
            if (role) role.value = '';
            renderFilteredProfiles();
        });

        document.getElementById('btnSaveDraft')?.addEventListener('click', () => saveCourse('save'));
        document.getElementById('btnSaveAndQuit')?.addEventListener('click', () => saveCourse('save_quit'));
        document.getElementById('btnPublish')?.addEventListener('click', () => saveCourse('publish'));
        document.getElementById('btnPublishAndAssign')?.addEventListener('click', () => saveCourse('publish_assign'));

        document.getElementById('btnAddSection')?.addEventListener('click', addSectionModule);
        document.getElementById('btnAddVideo')?.addEventListener('click', addVideoModule);
        document.getElementById('btnAddQuiz')?.addEventListener('click', addQuizModule);
        
        document.getElementById('bellBtn')?.addEventListener('click', openNotificationPanel);

        document.getElementById('filterTheme')?.addEventListener('change', renderAdminCourses);
        document.getElementById('filterTitle')?.addEventListener('change', renderAdminCourses);
        document.getElementById('filterNiveau')?.addEventListener('change', renderAdminCourses);
        document.getElementById('filterDuree')?.addEventListener('change', renderAdminCourses);
        document.getElementById('filterType')?.addEventListener('change', renderAdminCourses);
        document.getElementById('filterSession')?.addEventListener('change', renderAdminCourses);
        document.getElementById('btnResetCourseFilters')?.addEventListener('click', resetCourseFilters);
    }

    if (isLearnerPage) {
        if (location.hash === '#catalogue') {
            document.querySelector('nav a[data-section="catalogue"]')?.click();
        } else if (location.hash === '#dashboard') {
            document.querySelector('nav a[data-section="dashboard"]')?.click();
        }
    }
});