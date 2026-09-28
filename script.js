// ============================================
// CONFIGURATION SUPABASE
// ============================================
const SUPABASE_URL = "https://txdvluhigwkyrduqxmyr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZHZsdWhpZ3dreXJkdXF4bXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTYzMzEsImV4cCI6MjEwMjg5MjMzMX0.waXh6ptcSMocNPJMbF36IPGIH4E-EGdTvj9NwGoiSV0";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// CONFIGURATION DES UTILISATEURS (simulation)
// ============================================
const users = [
    { username: "test1", password: "pass1", name: "Test 1", role: "apprenant" },
    { username: "test2", password: "pass2", name: "Test 2", role: "apprenant" },
    { username: "admin", password: "admin", name: "Dylan", role: "admin" }
];

// ============================================
// DONNÉES GLOBALES
// ============================================
let courses = [];
let groupes = [];
let importedUsers = [];
let allProfiles = [];
let modules = [];
let currentTheme = 'Management';
let selectedCourseId = null;
let progressChartInstance = null;
let globalPieChartInstance = null;
let globalBarChartInstance = null;
window.userEnrollments = [];

// ============================================
// DÉTECTION DE LA PAGE
// ============================================
const isAdminPage = !!document.getElementById('adminSection');
const isLearnerPage = !!document.getElementById('catalogueSection');

// ============================================
// RÉFÉRENCES AU DOM
// ============================================
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const currentUserSpan = document.getElementById('currentUser');
const logoutBtn = document.getElementById('logoutBtn');

const adminCoursesTable = document.getElementById('adminCoursesTable');
const btnAddCourse = document.getElementById('btnAddCourse');
const btnImportUsers = document.getElementById('btnImportUsers');
const importUsersFile = document.getElementById('importUsersFile');
const importedUsersList = document.getElementById('importedUsersList');
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

const filterCourseSelect = document.getElementById('filterCourse');
const btnExportCSV = document.getElementById('btnExportCSV');
const resultsTableBody = document.getElementById('resultsTableBody');
const resultsTotalCount = document.getElementById('resultsTotalCount');
const resultsCompletedCount = document.getElementById('resultsCompletedCount');
const resultsUniqueUsers = document.getElementById('resultsUniqueUsers');
const visibilitySummaryBody = document.getElementById('visibilitySummaryBody');

// ============================================
// FONCTIONS DE SESSION
// ============================================
async function checkSession() {
    const sessionUser = localStorage.getItem('sessionUser');
    if (!sessionUser) {
        showLogin();
        return;
    }
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
            localStorage.setItem('sessionUser', JSON.stringify(user));
            window.location.href = (user.role === 'admin') ? 'admin.html' : 'index.html';
        } else if (loginError) {
            loginError.textContent = 'Identifiant ou mot de passe incorrect.';
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('sessionUser');
        window.location.href = 'index.html';
    });
}

// ============================================
// CHARGEMENT DES DONNÉES DEPUIS SUPABASE
// ============================================
async function loadDataFromSupabase() {
    // 1. Charger les cours
    let courseQuery = supabaseClient.from('courses').select('*').order('id', { ascending: true });
    if (isLearnerPage) {
        courseQuery = courseQuery.eq('status', 'published');
    }
    const { data: coursesData, error: coursesError } = await courseQuery;
    if (coursesError) {
        console.error('Erreur chargement cours:', coursesError);
    } else {
        courses = coursesData || [];
    }

    // 2. Charger les groupes (enrollments) avec les profils
    const { data: groupesData, error: groupesError } = await supabaseClient
        .from('enrollments')
        .select('id, user_id, course_id, groupe, date_debut, date_fin, profiles:user_id (full_name, matricule, bu, fonction)');
    if (groupesError) {
        console.error('Erreur chargement groupes:', groupesError);
    } else {
        const groupsMap = {};
        (groupesData || []).forEach(g => {
            const key = g.groupe + '__' + g.course_id;
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

    // 3. Charger les affectations de l'utilisateur connecté
    window.userEnrollments = [];
    const sessionUserForEnroll = JSON.parse(localStorage.getItem('sessionUser') || 'null');
    if (sessionUserForEnroll) {
        const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('username', sessionUserForEnroll.username)
            .single();

        if (profileData) {
            const { data: enrollData } = await supabaseClient
                .from('enrollments')
                .select('course_id')
                .eq('user_id', profileData.id);
            window.userEnrollments = (enrollData || []).map(e => e.course_id);
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
            if (targetSection === 'catalogue') renderCatalogue();
            else if (targetSection === 'mes-formations') renderMesFormations();
        });
    });

    document.getElementById('searchInputCatalogue')?.addEventListener('input', () => {
        selectedCourseId = null;
        renderCatalogue();
    });
    document.getElementById('searchInputMesFormations')?.addEventListener('input', renderMesFormations);

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
// CATALOGUE (apprenant)
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

    const themeCourses = courses.filter(c => {
        if (c.theme !== currentTheme) return false;
        if (c.visibility_mode === 'assigned_only') return false;
        if (searchTerm && !c.title.toLowerCase().includes(searchTerm) && !c.description.toLowerCase().includes(searchTerm)) return false;
        return true;
    });

    const levels = [1, 2, 3, 4];
    let html = '<div class="levels-grid">';
    levels.forEach(level => {
        const coursesForLevel = themeCourses.filter(c => c.niveau === level);
        html += '<div class="level-column"><h4>Niveau ' + level + '</h4>';
        coursesForLevel.forEach(course => {
            html += renderCatalogueCard(course);
        });
        html += '</div>';
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
    const mode = course.visibility_mode;

    if (mode === 'auto_enrollment_with_validation') {
        badgeHtml = '<span class="badge-mode badge-auto">🟢 Auto-inscription</span>';
    } else if (mode === 'unlock_by_progression') {
        badgeHtml = '<span class="badge-mode badge-locked">🔒 À débloquer</span>';
        lockedClass = 'course-locked';
    } else if (mode === 'mandatory') {
        const now = new Date();
        const deadline = course.deadline ? new Date(course.deadline) : null;
        if (deadline && deadline < now) {
            badgeHtml = '<span class="badge-mode badge-late">🔴 EN RETARD</span>';
        } else {
            badgeHtml = '<span class="badge-mode badge-mandatory">🔴 OBLIGATOIRE</span>';
        }
    }

    let prereqMsg = '';
    if (mode === 'unlock_by_progression' && course.prerequisite_course_id) {
        const prereq = courses.find(c => c.id === course.prerequisite_course_id);
        if (prereq) {
            prereqMsg = '<div class="prereq-msg">À débloquer après : <b>' + prereq.title + '</b></div>';
        }
    }

    const completedBadge = course.progress === 100 ? '<span class="badge-completed">Terminé ✓</span>' : '';

    return '<div class="course-item ' + lockedClass + '" data-course-id="' + course.id + '">' +
        completedBadge +
        badgeHtml +
        '<div class="course-item-title">' + course.title + '</div>' +
        '<div class="course-item-duree">⏱ ' + course.duree + '</div>' +
        prereqMsg +
        '</div>';
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
                    ${(course.syllabus || []).map(point => `<li>${point}</li>`).join('')}
                </ul>
                ${course.auto_inscription || course.autoInscription 
                    ? (course.externalUrl 
                        ? `<a href="${course.externalUrl}" class="btn" target="_blank">Commencer</a>` 
                        : `<a href="course-player.html?id=${course.id}" class="btn">Commencer</a>`) 
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
// MES FORMATIONS (apprenant)
// ============================================
function renderMesFormations() {
    if (!isLearnerPage) return;
    const container = document.getElementById('mesFormationsContainer');
    const searchInput = document.getElementById('searchInputMesFormations');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const assignedCourses = courses.filter(c => {
        if (!window.userEnrollments.includes(c.id)) return false;
        if (searchTerm && !c.title.toLowerCase().includes(searchTerm) && !c.description.toLowerCase().includes(searchTerm)) return false;
        return true;
    });

    container.innerHTML = '';
    if (assignedCourses.length === 0) {
        container.innerHTML = '<p>Aucune formation assignée pour le moment.</p>';
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
                extraInfo = '<div class="deadline-info deadline-late">⚠️ Date limite dépassée : ' + deadline.toLocaleDateString('fr-FR') + '</div>';
            } else {
                badgeHtml = '<span class="badge-mode badge-mandatory">🔴 OBLIGATOIRE</span>';
                extraInfo = '<div class="deadline-info">📅 À terminer avant le ' + deadline.toLocaleDateString('fr-FR') + '</div>';
            }
        }

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
                <a href="${course.externalUrl || 'course-player.html?id=' + course.id}" class="btn">${(course.progress || 0) > 0 ? 'Continuer' : 'Commencer'}</a>
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

    courses.forEach(course => {
        const tr = document.createElement('tr');
        const sessionCount = groupes.filter(g => g.coursId === course.id).length;
        tr.innerHTML = `
            <td>${course.theme}</td>
            <td>
                ${course.title}
                ${course.status === 'draft' ? '<span class="badge-draft">Brouillon</span>' : ''}
                ${course.status === 'editing' ? '<span class="badge-editing">En édition</span>' : ''}
            </td>
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

    tbody.querySelectorAll('.session-link').forEach(link => {
        link.addEventListener('click', () => openSessionModal(parseInt(link.dataset.courseId)));
    });
    tbody.querySelectorAll('.edit').forEach(btn => {
        btn.addEventListener('click', () => openEditCourseModal(parseInt(btn.dataset.id)));
    });
    tbody.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', async () => {
            const courseId = parseInt(btn.dataset.id);
            if (confirm('Supprimer le cours ' + courseId + ' ?')) {
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
        btn.addEventListener('click', () => openAffectationModal(parseInt(btn.dataset.id)));
    });
}

function openAddCourseModal() {
    if (!courseModalTitle || !courseForm) return;
    courseModalTitle.textContent = 'Ajouter un cours';
    courseForm.reset();
    courseColorInput.value = '#00afa9';
    courseAutoInscriptionInput.checked = true;
    courseForm.dataset.editId = '';
    courseForm.dataset.previousStatus = '';
    modules = [];
    renderModules();
    courseModalOverlay.style.display = 'flex';
}

async function openEditCourseModal(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    courseForm.dataset.previousStatus = course.status || 'draft';
    if (course.status === 'published') {
        await supabaseClient.from('courses').update({ status: 'editing' }).eq('id', courseId);
        course.status = 'editing';
    }
    courseModalTitle.textContent = 'Modifier le cours : ' + course.title;
    courseTitleInput.value = course.title;
    courseDescriptionInput.value = course.description;
    courseThemeInput.value = course.theme;
    courseNiveauInput.value = course.niveau;
    courseDureeInput.value = course.duree;
    courseTypeInput.value = course.type;
    courseAutoInscriptionInput.checked = course.auto_inscription || course.autoInscription;
    courseColorInput.value = course.color;
    courseSyllabusInput.value = course.syllabus ? course.syllabus.join('\n') : '';
    courseVisibilityModeInput.value = course.visibility_mode || 'assigned_only';
    courseAvailabilityDateInput.value = course.availability_date || '';
    modules = course.modules ? JSON.parse(JSON.stringify(course.modules)) : [];
    renderModules();
    courseForm.dataset.editId = courseId;
    courseModalOverlay.style.display = 'flex';
}

function closeCourseModal() {
    courseModalOverlay.style.display = 'none';
}

async function saveCourse(action) {
    const title = courseTitleInput.value.trim();
    const description = courseDescriptionInput.value.trim();
    const theme = courseThemeInput.value;
    const niveau = parseInt(courseNiveauInput.value);
    const duree = courseDureeInput.value.trim();
    const type = courseTypeInput.value;
    const autoInscription = courseAutoInscriptionInput.checked;
    const color = courseColorInput.value;
    const syllabus = courseSyllabusInput.value.split('\n').map(l => l.trim()).filter(l => l !== '');
    const visibilityMode = courseVisibilityModeInput.value;
    const availabilityDate = courseAvailabilityDateInput.value || null;

    if (!title || !description || !duree) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }

    let newStatus;
    if (action === 'save' || action === 'save_quit') {
        newStatus = (courseForm.dataset.previousStatus && courseForm.dataset.previousStatus !== 'editing')
            ? courseForm.dataset.previousStatus
            : 'draft';
    } else {
        newStatus = 'published';
    }

    const sessionUser = JSON.parse(localStorage.getItem('sessionUser') || 'null');
    const createdBy = sessionUser ? sessionUser.name : 'Inconnu';
    const editId = courseForm.dataset.editId;

    if (editId) {
        const courseId = parseInt(editId);
        const { error } = await supabaseClient
            .from('courses')
            .update({
                title, description, theme, niveau, duree, type,
                auto_inscription: autoInscription, color, syllabus,
                modules: JSON.parse(JSON.stringify(modules)),
                status: newStatus,
                visibility_mode: visibilityMode,
                availability_date: availabilityDate
            })
            .eq('id', courseId);
        if (error) { alert('Erreur mise à jour : ' + error.message); return; }
    } else {
        const { error } = await supabaseClient
            .from('courses')
            .insert({
                title, description, theme, niveau, duree, type,
                auto_inscription: autoInscription, assigned: false,
                color, syllabus,
                modules: JSON.parse(JSON.stringify(modules)),
                status: newStatus,
                created_by: createdBy,
                visibility_mode: visibilityMode,
                availability_date: availabilityDate
            });
        if (error) { alert('Erreur création : ' + error.message); return; }
    }

    await loadDataFromSupabase();
    if (action === 'save') {
        const newlyCreated = courses.find(c => c.title === title && c.status === newStatus);
        if (!editId && newlyCreated) courseForm.dataset.editId = newlyCreated.id;
        alert('Enregistré à ' + new Date().toLocaleTimeString());
    } else if (action === 'save_quit') {
        closeCourseModal();
        renderAdminCourses();
    } else if (action === 'publish') {
        closeCourseModal();
        renderAdminCourses();
    } else if (action === 'publish_assign') {
        closeCourseModal();
        renderAdminCourses();
        const published = courses.find(c => c.title === title && c.status === 'published');
        if (published) openAffectationModal(published.id);
    }
}

// ============================================
// MODULES DU COURS
// ============================================
function addSectionModule() { modules.push({ type: 'section', title: '', content: '' }); renderModules(); }
function addVideoModule() { modules.push({ type: 'video', url: '' }); renderModules(); }
function addQuizModule() { modules.push({ type: 'quiz', questions: [] }); renderModules(); }
function addQuestionToQuiz(i) { modules[i].questions.push({ type: 'qcm_single', question: '', options: ['', ''], correct: '' }); renderModules(); }
function addOption(m, q) { modules[m].questions[q].options.push(''); renderModules(); }
function removeModule(i) { modules.splice(i, 1); renderModules(); }
function removeOption(m, q, o) { modules[m].questions[q].options.splice(o, 1); renderModules(); }
function removeQuestion(m, q) { modules[m].questions.splice(q, 1); renderModules(); }

function renderModules() {
    if (!courseModulesContainer) return;
    courseModulesContainer.innerHTML = '';

    modules.forEach((module, index) => {
        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'module-block';
        let moduleContent = '';

        if (module.type === 'section') {
            moduleContent = `
                <label>Titre de la section</label>
                <input type="text" placeholder="Ex : Introduction" value="${module.title}" oninput="modules[${index}].title = this.value">
                <label>Contenu</label>
                <textarea rows="4" placeholder="Le contenu de la section..." oninput="modules[${index}].content = this.value">${module.content}</textarea>
            `;
        } else if (module.type === 'video') {
            moduleContent = `
                <label>URL de la vidéo (YouTube)</label>
                <input type="text" placeholder="https://www.youtube.com/embed/..." value="${module.url}" oninput="modules[${index}].url = this.value">
            `;
        } else if (module.type === 'quiz') {
            moduleContent = '<div class="quiz-module-questions">';
            module.questions.forEach((q, qIndex) => {
                let optionsHtml = '';
                if (q.type === 'qcm_single' || q.type === 'qcm_multiple') {
                    q.options.forEach((opt, optIndex) => {
                        optionsHtml += `
                            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 5px;">
                                <input type="text" value="${opt}" placeholder="Option ${optIndex+1}" oninput="modules[${index}].questions[${qIndex}].options[${optIndex}] = this.value" style="flex:1;">
                                <button type="button" class="btn btn-secondary add-question" onclick="removeOption(${index}, ${qIndex}, ${optIndex})" style="padding:5px 10px;">✕</button>
                            </div>
                        `;
                    });
                    optionsHtml += '<button type="button" class="btn btn-secondary add-question" onclick="addOption(' + index + ', ' + qIndex + ')">+ Option</button>';
                }
                moduleContent += `
                    <div class="question-block">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong>Question ${qIndex+1}</strong>
                            <button type="button" class="remove-module" onclick="removeQuestion(${index}, ${qIndex})">Supprimer</button>
                        </div>
                        <label>Type de question :</label>
                        <select onchange="modules[${index}].questions[${qIndex}].type = this.value; modules[${index}].questions[${qIndex}].options = (this.value === 'text' ? [] : ['', '']); renderModules();">
                            <option value="qcm_single" ${q.type === 'qcm_single' ? 'selected' : ''}>QCM (une seule réponse)</option>
                            <option value="qcm_multiple" ${q.type === 'qcm_multiple' ? 'selected' : ''}>QCM (plusieurs réponses)</option>
                            <option value="text" ${q.type === 'text' ? 'selected' : ''}>Texte libre</option>
                        </select>
                        <label>Question</label>
                        <input type="text" placeholder="Énoncé de la question" value="${q.question}" oninput="modules[${index}].questions[${qIndex}].question = this.value">
                        ${optionsHtml}
                    </div>
                `;
            });
            moduleContent += '<button type="button" class="btn btn-secondary add-question" onclick="addQuestionToQuiz(' + index + ')">+ Question</button></div>';
        }

        moduleDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h5>${module.type === 'section' ? '📄 Section' : module.type === 'video' ? '🎬 Vidéo' : '❓ Quiz'}</h5>
                <button type="button" class="remove-module" onclick="removeModule(${index})">Supprimer</button>
            </div>
            <div class="module-content">${moduleContent}</div>
        `;
        courseModulesContainer.appendChild(moduleDiv);
    });
}

// ============================================
// ADMIN : SESSIONS ET AFFECTATIONS
// ============================================
function openSessionModal(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const sessionsForCourse = groupes.filter(g => g.coursId === courseId);
    let html = '<div class="modal-overlay" id="sessionModalOverlay"><div class="modal-box"><h3>Sessions pour "' + course.title + '"</h3>';
    if (sessionsForCourse.length === 0) {
        html += '<p>Aucune session pour le moment.</p>';
    } else {
        sessionsForCourse.forEach(g => {
            html += '<div style="margin-bottom: 10px; padding: 10px; background: var(--gray-light); border-radius: 8px;">';
            html += '<p><strong>Groupe :</strong> <a href="#" class="session-group-link" data-group-id="' + g.id + '">' + g.nom + '</a></p>';
            html += '<p><strong>Période :</strong> ' + g.dateDebut + ' → ' + g.dateFin + '</p>';
            html += '<p><strong>Participants :</strong> ' + g.participants.length + '</p>';
            html += '</div>';
        });
    }
    html += '<div class="modal-actions"><button class="btn" onclick="closeModal(\'sessionModalOverlay\')">Fermer</button></div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.querySelectorAll('.session-group-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openGroupDetail(parseInt(link.dataset.groupId));
        });
    });
}

function openGroupDetail(groupId) {
    const group = groupes.find(g => g.id === groupId);
    if (!group) return;
    const course = courses.find(c => c.id === group.coursId);
    let html = '<div class="modal-overlay" id="groupDetailOverlay"><div class="modal-box">';
    html += '<h3>Groupe : ' + group.nom + '</h3>';
    html += '<p><strong>Cours :</strong> ' + (course ? course.title : '') + '</p>';
    html += '<p><strong>Période :</strong> ' + group.dateDebut + ' → ' + group.dateFin + '</p>';
    html += '<h4>Participants (' + group.participants.length + ')</h4><ul>';
    if (group.participants.length === 0) {
        html += '<li>Aucun participant</li>';
    } else {
        group.participants.forEach(p => {
            html += '<li>' + p.nom + ' - ' + p.fonction + ' - ' + p.bu + '</li>';
        });
    }
    html += '</ul><div class="modal-actions"><button class="btn" onclick="closeModal(\'groupDetailOverlay\')">Fermer</button></div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
}

function openAffectationModal(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    let html = '<div class="modal-overlay" id="affectationModalOverlay"><div class="modal-box">';
    html += '<h3>Affecter des participants à "' + course.title + '"</h3>';
    html += '<p>Choisissez la méthode :</p>';
    html += '<div style="display: flex; gap: 10px; margin-bottom: 20px;">';
    html += '<button class="btn" id="btnChoiceList">📋 Liste</button>';
    html += '<button class="btn" id="btnChoiceFile">📁 Fichier</button>';
    html += '</div>';
    html += '<div id="affectationContent"></div>';
    html += '<div class="modal-actions"><button class="btn" onclick="closeModal(\'affectationModalOverlay\')">Fermer</button></div>';
    html += '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('btnChoiceList').addEventListener('click', () => showAffectationList(courseId));
    document.getElementById('btnChoiceFile').addEventListener('click', () => showAffectationFile(courseId));
}

function showAffectationList(courseId) {
    const container = document.getElementById('affectationContent');
    const collaborateurs = [
        { nom: "Rabe", fonction: "Manager", matricule: "M001", bu: "Comete" },
        { nom: "Rakoto", fonction: "CSA", matricule: "C002", bu: "YAS" },
        { nom: "Razafy", fonction: "Manager", matricule: "M003", bu: "Mvola" },
        { nom: "Andry", fonction: "CEO", matricule: "CEO001", bu: "Support" },
        { nom: "Lala", fonction: "Manager", matricule: "M004", bu: "Openfield" }
    ];
    let html = '<p>Filtrer par BU : <select id="buFilter"><option value="">Toutes les BU</option><option>Comete</option><option>YAS</option><option>Mvola</option><option>Support</option><option>Openfield</option></select></p>';
    html += '<table class="admin-table"><thead><tr><th>Sélection</th><th>Fonction</th><th>Matricule</th><th>BU</th><th>Nom Prénom</th></tr></thead><tbody id="collabTableBody">';
    collaborateurs.forEach((c, index) => {
        html += '<tr data-bu="' + c.bu + '"><td><input type="checkbox" class="collabCheck" data-index="' + index + '"></td><td>' + c.fonction + '</td><td>' + c.matricule + '</td><td>' + c.bu + '</td><td>' + c.nom + '</td></tr>';
    });
    html += '</tbody></table>';
    html += '<input type="text" id="groupName" placeholder="Nom du groupe (obligatoire)" style="width:100%; padding:10px; margin-top:10px;">';
    html += '<button class="btn" id="btnValiderGroupe">Valider le groupe</button>';
    container.innerHTML = html;

    document.getElementById('buFilter').addEventListener('change', (e) => {
        const val = e.target.value;
        document.querySelectorAll('#collabTableBody tr').forEach(tr => {
            tr.style.display = (!val || tr.dataset.bu === val) ? '' : 'none';
        });
    });

    document.getElementById('btnValiderGroupe').addEventListener('click', () => {
        const nomGroupe = document.getElementById('groupName').value.trim();
        if (!nomGroupe) { alert('Le nom du groupe est obligatoire'); return; }
        const selected = [];
        document.querySelectorAll('.collabCheck:checked').forEach(cb => {
            selected.push(collaborateurs[parseInt(cb.dataset.index)]);
        });
        if (selected.length === 0) { alert('Sélectionnez au moins un participant'); return; }
        groupes.push({
            id: groupes.length + 1,
            nom: nomGroupe,
            coursId: courseId,
            dateDebut: "2026-09-01",
            dateFin: "2026-09-30",
            participants: selected
        });
        closeModal('affectationModalOverlay');
        renderAdminCourses();
    });
}

function showAffectationFile(courseId) {
    const container = document.getElementById('affectationContent');
    container.innerHTML = '<p>Importez un fichier CSV (simulation).</p><input type="file" id="fakeFileInput" accept=".csv"><button class="btn" id="btnImportFake">Importer</button><p>Le groupe sera créé avec les participants du fichier.</p>';
    document.getElementById('btnImportFake').addEventListener('click', () => {
        const nomGroupe = prompt("Nom du groupe (obligatoire) :");
        if (!nomGroupe) return;
        groupes.push({
            id: groupes.length + 1,
            nom: nomGroupe,
            coursId: courseId,
            dateDebut: "2026-09-01",
            dateFin: "2026-09-30",
            participants: [{ nom: "Importé", fonction: "Inconnu", matricule: "IMP001", bu: "N/A" }]
        });
        closeModal('affectationModalOverlay');
        renderAdminCourses();
    });
}

function closeModal(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.remove();
}

function setupAdminTabs() {
    if (!isAdminPage) return;
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.tab;
            const targetEl = document.getElementById('tab-' + target);
            if (targetEl) targetEl.classList.add('active');
            if (target === 'cours') renderAdminCourses();
            else if (target === 'global') renderGlobalDashboard();
            else if (target === 'resultats') loadResults();
            else if (target === 'utilisateurs') loadProfiles();
        });
    });
}

if (btnAddCourse) btnAddCourse.addEventListener('click', openAddCourseModal);
if (btnImportUsers && importUsersFile) {
    btnImportUsers.addEventListener('click', () => importUsersFile.click());
}

// ============================================
// IMPORT CSV DES UTILISATEURS
// ============================================
if (importUsersFile) {
    importUsersFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const statusEl = document.getElementById('importStatus');
        if (statusEl) {
            statusEl.className = 'import-status loading';
            statusEl.textContent = '⏳ Lecture du fichier...';
            statusEl.style.display = 'block';
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const firstLine = text.split('\n')[0];
                const separator = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
                const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
                if (lines.length < 2) throw new Error('Fichier vide ou invalide.');
                const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/^\ufeff/, ''));
                const requiredColumns = ['username', 'full_name', 'matricule', 'bu', 'fonction', 'role'];
                const missing = requiredColumns.filter(c => !headers.includes(c));
                if (missing.length > 0) throw new Error('Colonnes manquantes : ' + missing.join(', '));
                const rows = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(separator).map(v => v.trim());
                    const row = {};
                    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
                    row.role = (row.role || 'apprenant').toLowerCase();
                    row.username = (row.username || '').trim();
                    row.full_name = (row.full_name || '').trim();
                    if (!row.username) continue;
                    rows.push(row);
                }
                if (rows.length === 0) throw new Error('Aucun utilisateur valide dans le fichier.');
                if (statusEl) statusEl.textContent = '⏳ Envoi de ' + rows.length + ' utilisateurs vers Supabase...';
                const { error } = await supabaseClient.from('profiles').upsert(rows, { onConflict: 'username' });
                if (error) throw error;
                if (statusEl) {
                    statusEl.className = 'import-status success';
                    statusEl.textContent = '✅ ' + rows.length + ' utilisateur(s) importé(s) ou mis à jour avec succès.';
                }
                await loadProfiles();
            } catch (err) {
                console.error('Erreur import CSV:', err);
                if (statusEl) {
                    statusEl.className = 'import-status error';
                    statusEl.textContent = '❌ Erreur : ' + err.message;
                }
            } finally {
                importUsersFile.value = '';
            }
        };
        reader.onerror = () => {
            if (statusEl) {
                statusEl.className = 'import-status error';
                statusEl.textContent = '❌ Impossible de lire le fichier.';
            }
        };
        reader.readAsText(file, 'UTF-8');
    });
}

// ============================================
// ADMIN : LISTE DES PROFILS
// ============================================
async function loadProfiles() {
    if (!isAdminPage) return;
    const tbody = document.getElementById('profilesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray);">Chargement...</td></tr>';
    const { data, error } = await supabaseClient.from('profiles').select('*').order('full_name', { ascending: true });
    if (error) {
        console.error('Erreur chargement profils:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--error);">Erreur de chargement.</td></tr>';
        return;
    }
    allProfiles = data || [];
    populateBuFilter();
    renderFilteredProfiles();
}

function populateBuFilter() {
    const buSelect = document.getElementById('profileBuFilter');
    if (!buSelect) return;
    const currentValue = buSelect.value;
    const bus = [...new Set(allProfiles.map(p => p.bu).filter(b => b))].sort();
    buSelect.innerHTML = '<option value="">Toutes les BU</option>';
    bus.forEach(bu => {
        const opt = document.createElement('option');
        opt.value = bu;
        opt.textContent = bu;
        if (bu === currentValue) opt.selected = true;
        buSelect.appendChild(opt);
    });
}

function renderFilteredProfiles() {
    const tbody = document.getElementById('profilesTableBody');
    const searchInput = document.getElementById('profileSearch');
    const buFilter = document.getElementById('profileBuFilter');
    const roleFilter = document.getElementById('profileRoleFilter');
    const countEl = document.getElementById('profileCount');
    if (!tbody) return;

    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const buValue = buFilter ? buFilter.value : '';
    const roleValue = roleFilter ? roleFilter.value : '';

    const filtered = allProfiles.filter(p => {
        const matchText = !searchTerm || (p.full_name || '').toLowerCase().includes(searchTerm) || (p.username || '').toLowerCase().includes(searchTerm) || (p.matricule || '').toLowerCase().includes(searchTerm);
        const matchBu = !buValue || p.bu === buValue;
        const matchRole = !roleValue || (p.role || '').toLowerCase() === roleValue;
        return matchText && matchBu && matchRole;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray);">Aucun utilisateur ne correspond aux filtres.</td></tr>';
    } else {
        filtered.forEach(profile => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${profile.full_name || ''}</td>
                <td>${profile.username || ''}</td>
                <td>${profile.matricule || ''}</td>
                <td>${profile.bu || ''}</td>
                <td>${profile.fonction || ''}</td>
                <td>${profile.role || ''}</td>
                <td><button class="btn-delete-row" data-id="${profile.id}" data-name="${profile.full_name || profile.username}">🗑️</button></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll('.btn-delete-row').forEach(btn => {
            btn.addEventListener('click', () => deleteProfile(btn.dataset.id, btn.dataset.name));
        });
    }
    if (countEl) countEl.textContent = filtered.length + ' / ' + allProfiles.length + ' utilisateur(s)';
}

async function deleteProfile(id, name) {
    if (!confirm('Supprimer définitivement l\'utilisateur "' + name + '" ?\n\nAttention : ses affectations et sa progression seront également supprimées.')) return;
    await supabaseClient.from('progress').delete().eq('user_id', id);
    await supabaseClient.from('enrollments').delete().eq('user_id', id);
    const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
    if (error) { alert('Erreur suppression : ' + error.message); return; }
    await loadProfiles();
}

async function deleteAllProfiles() {
    const count = allProfiles.length;
    if (count === 0) { alert('Aucun utilisateur à supprimer.'); return; }
    const confirmation = prompt('⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer DÉFINITIVEMENT les ' + count + ' utilisateurs.\n\nTapez "SUPPRIMER" pour confirmer.');
    if (confirmation !== 'SUPPRIMER') { alert('Suppression annulée.'); return; }
    const statusEl = document.getElementById('importStatus');
    if (statusEl) { statusEl.className = 'import-status loading'; statusEl.textContent = '⏳ Suppression en cours...'; statusEl.style.display = 'block'; }
    await supabaseClient.from('progress').delete().neq('id', 0);
    await supabaseClient.from('enrollments').delete().neq('id', 0);
    const { error } = await supabaseClient.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
        if (statusEl) { statusEl.className = 'import-status error'; statusEl.textContent = '❌ Erreur : ' + error.message; }
        return;
    }
    if (statusEl) { statusEl.className = 'import-status success'; statusEl.textContent = '✅ ' + count + ' utilisateur(s) supprimé(s) avec succès.'; }
    await loadProfiles();
}

// ============================================
// ADMIN : TABLEAU DE BORD GLOBAL
// ============================================
function renderGlobalDashboard() {
    if (!isAdminPage) return;
    const totalCoursEl = document.getElementById('globalTotalCours');
    const totalGroupesEl = document.getElementById('globalTotalGroupes');
    const completionEl = document.getElementById('globalCompletion');
    if (totalCoursEl) totalCoursEl.textContent = courses.length;
    if (totalGroupesEl) totalGroupesEl.textContent = groupes.length;
    const avg = courses.length > 0 ? Math.round(courses.reduce((s, c) => s + (c.progress || 0), 0) / courses.length) : 0;
    if (completionEl) completionEl.textContent = avg + '%';

    const themes = ['Management', 'Communication', 'Commerciale', 'Relation client', 'Soft skills'];
    const themeData = themes.map(t => courses.filter(c => c.theme === t).length);

    if (globalPieChartInstance) globalPieChartInstance.destroy();
    const pieCanvas = document.getElementById('globalPieChart');
    if (pieCanvas) {
        globalPieChartInstance = new Chart(pieCanvas.getContext('2d'), {
            type: 'pie',
            data: { labels: themes, datasets: [{ data: themeData, backgroundColor: ['#00afa9', '#096475', '#ffa900', '#7200a9', '#cce1e1'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    if (globalBarChartInstance) globalBarChartInstance.destroy();
    const barCanvas = document.getElementById('globalBarChart');
    if (barCanvas) {
        globalBarChartInstance = new Chart(barCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: courses.map(c => c.title),
                datasets: [{ label: 'Progression (%)', data: courses.map(c => c.progress || 0), backgroundColor: '#00afa9', borderRadius: 8 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, title: { display: true, text: 'Progression par cours' } },
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    }
    loadVisibilitySummary();
}

// ============================================
// APPRENANT : TABLEAU DE BORD
// ============================================
function renderDashboard() {
    if (!isLearnerPage) return;
    const totalCours = courses.length;
    const completedCours = courses.filter(c => c.progress === 100).length;
    const progression = totalCours > 0 ? Math.round((completedCours / totalCours) * 100) : 0;

    const fill = document.querySelector('.progress-global .fill');
    const span = document.querySelector('.progress-global span');
    if (fill && span) {
        fill.style.width = progression + '%';
        span.textContent = progression + '%';
    }

    const statValues = document.querySelectorAll('.stat-card .value');
    if (statValues.length >= 4) {
        statValues[2].textContent = completedCours + ' / ' + totalCours;
        statValues[3].textContent = completedCours;
    }

    const themes = ['Management', 'Communication', 'Commerciale', 'Relation client', 'Soft skills'];
    const themeProgress = themes.map(t => {
        const tc = courses.filter(c => c.theme === t);
        const tcomp = tc.filter(c => c.progress === 100);
        return tc.length > 0 ? Math.round((tcomp.length / tc.length) * 100) : 0;
    });

    const ctx = document.getElementById('progressChart');
    if (ctx) {
        if (progressChartInstance) progressChartInstance.destroy();
        progressChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: themes,
                datasets: [{ label: 'Progression par thématique (%)', data: themeProgress, backgroundColor: ['#00afa9', '#096475', '#ffa900', '#7200a9', '#cce1e1'], borderRadius: 5 }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }
}

// ============================================
// ADMIN : RÉSULTATS
// ============================================
async function loadResults() {
    if (!isAdminPage) return;
    const { data: progressData, error } = await supabaseClient.from('progress').select('*').order('completed_at', { ascending: false });
    if (error) {
        console.error('Erreur chargement résultats:', error);
        if (resultsTableBody) resultsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--error);">Erreur de chargement.</td></tr>';
        return;
    }
    const rows = progressData || [];

    if (filterCourseSelect) {
        const currentFilter = filterCourseSelect.value;
        filterCourseSelect.innerHTML = '<option value="">Tous les cours</option>';
        courses.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.title;
            if (String(c.id) === String(currentFilter)) option.selected = true;
            filterCourseSelect.appendChild(option);
        });
    }

    const selectedCourseId = filterCourseSelect ? filterCourseSelect.value : '';
    const filtered = selectedCourseId ? rows.filter(r => String(r.course_id) === String(selectedCourseId)) : rows;
    const completedCount = filtered.filter(r => r.completed === true).length;
    const uniqueUsers = new Set(filtered.map(r => r.user_id)).size;

    if (resultsTotalCount) resultsTotalCount.textContent = filtered.length;
    if (resultsCompletedCount) resultsCompletedCount.textContent = completedCount;
    if (resultsUniqueUsers) resultsUniqueUsers.textContent = uniqueUsers;
    if (!resultsTableBody) return;
    resultsTableBody.innerHTML = '';
    if (filtered.length === 0) {
        resultsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray);">Aucun résultat pour le moment.</td></tr>';
        return;
    }
    filtered.forEach(r => {
        const course = courses.find(c => c.id === r.course_id);
        const courseTitle = course ? course.title : 'Cours #' + r.course_id;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.user_id}</td>
            <td>${courseTitle}</td>
            <td><span class="status-badge ${r.completed ? 'completed' : 'inprogress'}">${r.completed ? 'Terminé' : 'En cours'}</span></td>
            <td>${r.score != null ? r.score + '%' : '—'}</td>
            <td>${r.completed_at ? new Date(r.completed_at).toLocaleString('fr-FR') : '—'}</td>
            <td>${r.completed ? 'Auto' : '—'}</td>
        `;
        resultsTableBody.appendChild(tr);
    });
}

function exportResultsToCSV() {
    const rows = [];
    rows.push(['Apprenant', 'Cours', 'Statut', 'Score', 'Date de complétion']);
    const tbody = resultsTableBody;
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (cells.length >= 5) rows.push(Array.from(cells).slice(0, 5).map(c => '"' + c.textContent.trim().replace(/"/g, '""') + '"'));
    });
    const csvContent = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resultats_formations_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    URL.revokeObjectURL(url);
}

// ============================================
// RÉCAPITULATIF PAR TYPE
// ============================================
async function loadVisibilitySummary() {
    if (!isAdminPage || !visibilitySummaryBody) return;
    const [progressRes, enrollmentsRes] = await Promise.all([
        supabaseClient.from('progress').select('*'),
        supabaseClient.from('enrollments').select('*')
    ]);
    const progressData = progressRes.data || [];
    const enrollmentsData = enrollmentsRes.data || [];
    const typeLabels = {
        'assigned_only': 'Affectation uniquement',
        'auto_enrollment_with_validation': 'Auto-inscription validée',
        'unlock_by_progression': 'Déblocage par progression',
        'mandatory': 'Obligatoire avec échéance'
    };
    const stats = {};
    Object.keys(typeLabels).forEach(t => { stats[t] = { courses: 0, targeted: 0, completed: 0 }; });
    courses.forEach(course => {
        const type = course.visibility_mode || 'assigned_only';
        if (!stats[type]) stats[type] = { courses: 0, targeted: 0, completed: 0 };
        stats[type].courses += 1;
        stats[type].targeted += enrollmentsData.filter(e => e.course_id === course.id).length;
        stats[type].completed += progressData.filter(p => p.course_id === course.id && p.completed === true).length;
    });
    visibilitySummaryBody.innerHTML = '';
    let hasRows = false;
    Object.keys(typeLabels).forEach(type => {
        const s = stats[type];
        if (s.courses === 0) return;
        hasRows = true;
        let rateText = '—';
        let rateClass = '';
        if (s.targeted > 0) {
            const rate = Math.round((s.completed / s.targeted) * 100);
            rateText = rate + '%';
            if (rate >= 75) rateClass = 'rate-good';
            else if (rate >= 40) rateClass = 'rate-medium';
            else rateClass = 'rate-low';
        } else if (s.completed > 0) {
            rateText = '100% (auto)';
            rateClass = 'rate-good';
        }
        const tr = document.createElement('tr');
        tr.innerHTML = '<td>' + typeLabels[type] + '</td><td>' + s.courses + '</td><td>' + (s.targeted > 0 ? s.targeted : '—') + '</td><td>' + s.completed + '</td><td class="' + rateClass + '">' + rateText + '</td>';
        visibilitySummaryBody.appendChild(tr);
    });
    if (!hasRows) {
        visibilitySummaryBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray);">Aucun cours pour le moment.</td></tr>';
    }
}

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
    }

    if (isLearnerPage) {
        if (location.hash === '#catalogue') document.querySelector('nav a[data-section="catalogue"]')?.click();
        else if (location.hash === '#dashboard') document.querySelector('nav a[data-section="dashboard"]')?.click();
    }
});