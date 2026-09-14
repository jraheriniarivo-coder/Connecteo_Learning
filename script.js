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
    { username: "manager1", password: "pass1", name: "Manager 1", role: "apprenant" },
    { username: "manager2", password: "pass2", name: "Manager 2", role: "apprenant" },
    { username: "admin", password: "admin", name: "Dylan", role: "admin" }
];

// ============================================
// DONNÉES DES COURS
// ============================================
let courses = [];
let groupes = [];
let importedUsers = [];

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

let modules = [];
let currentTheme = 'Management';
let selectedCourseId = null;
let progressChartInstance = null;
let globalPieChartInstance = null;
let globalBarChartInstance = null;

// ============================================
// FONCTIONS DE SESSION
// ============================================
async function checkSession() {
    const sessionUser = localStorage.getItem('sessionUser');
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
            localStorage.setItem('sessionUser', JSON.stringify(user));
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
        localStorage.removeItem('sessionUser');
        window.location.href = 'index.html';
    });
}

// ============================================
// CHARGEMENT DES DONNÉES DEPUIS SUPABASE
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

    // Charger les groupes (enrollments)
    const { data: groupesData, error: groupesError } = await supabaseClient
        .from('enrollments')
        .select('*');
    if (groupesError) {
        console.error('Erreur chargement groupes:', groupesError);
    } else {
        groupes = (groupesData || []).map(g => ({
            id: g.id,
            nom: g.groupe,
            coursId: g.course_id,
            dateDebut: g.date_debut,
            dateFin: g.date_fin,
            participants: []
        }));
    }

    // Charger la progression de l'utilisateur connecté
    const sessionUser = JSON.parse(localStorage.getItem('sessionUser') || 'null');
    if (sessionUser) {
        const { data: progressData, error: progressError } = await supabaseClient
            .from('progress')
            .select('*')
            .eq('user_id', sessionUser.username);
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
    const themeCourses = courses.filter(c => c.theme === currentTheme && 
        (!searchTerm || c.title.toLowerCase().includes(searchTerm) || c.description.toLowerCase().includes(searchTerm)));

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

    const assignedCourses = courses.filter(c => c.assigned && 
        (!searchTerm || c.title.toLowerCase().includes(searchTerm) || c.description.toLowerCase().includes(searchTerm)));

    container.innerHTML = '';
    if (assignedCourses.length === 0) {
        container.innerHTML = '<p>Aucune formation assignée pour le moment.</p>';
        return;
    }

    assignedCourses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-header" style="background: linear-gradient(135deg, ${course.color}33, ${course.color});">
                ${course.theme}
            </div>
            <div class="course-body">
                <div class="course-title">${course.title}</div>
                <p class="course-desc">${course.description}</p>
                <div class="course-meta">
                    <span>⏱ ${course.duree}</span>
                    <span>${course.progress || 0}% terminé</span>
                </div>
                <div class="course-progress">
                    <div class="fill" style="width: ${course.progress || 0}%;"></div>
                </div>
                <a href="${course.externalUrl || `course-player.html?id=${course.id}`}" class="btn">${(course.progress || 0) > 0 ? 'Continuer' : 'Commencer'}</a>
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
            <td>
                ${course.title}
                ${course.status === 'draft' ? '<span class="badge-draft">Brouillon</span>' : ''}
                ${course.status === 'editing' ? '<span class="badge-editing">En édition</span>' : ''}
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

    // Mémoriser le statut précédent et passer le cours en "editing" pour le retirer du catalogue
    courseForm.dataset.previousStatus = course.status || 'draft';
    if (course.status === 'published') {
        await supabaseClient.from('courses').update({ status: 'editing' }).eq('id', courseId);
        course.status = 'editing';
    }

    courseModalTitle.textContent = `Modifier le cours : ${course.title}`;
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
    // action = 'save' | 'save_quit' | 'publish' | 'publish_assign'

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

    // Déterminer le statut à appliquer
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
        // Mise à jour
        const courseId = parseInt(editId);
        const { error } = await supabaseClient
            .from('courses')
            .update({
                title, description, theme, niveau, duree, type,
                auto_inscription: autoInscription,
                color, syllabus,
                modules: JSON.parse(JSON.stringify(modules)),
                status: newStatus,
                visibility_mode: visibilityMode,
                availability_date: availabilityDate
            })
            .eq('id', courseId);
        if (error) { alert('Erreur mise à jour : ' + error.message); return; }
    } else {
        // Insertion
        const { error } = await supabaseClient
            .from('courses')
            .insert({
                title, description, theme, niveau, duree, type,
                auto_inscription: autoInscription,
                assigned: false,
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

    // Comportement selon l'action
    if (action === 'save') {
        // On garde le modal ouvert. On met à jour l'editId si c'était une insertion.
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
        // Trouver le cours publié et ouvrir la fenêtre d'affectation
        const published = courses.find(c => c.title === title && c.status === 'published');
        if (published) openAffectationModal(published.id);
    }
}
// ============================================
// MODULES DU COURS
// ============================================
function addSectionModule() {
    modules.push({ type: 'section', title: '', content: '' });
    renderModules();
}

function addVideoModule() {
    modules.push({ type: 'video', url: '' });
    renderModules();
}

function addQuizModule() {
    modules.push({ type: 'quiz', questions: [] });
    renderModules();
}

function addQuestionToQuiz(quizIndex) {
    const question = { type: 'qcm_single', question: '', options: ['', ''], correct: '' };
    modules[quizIndex].questions.push(question);
    renderModules();
}

function addOption(moduleIndex, questionIndex) {
    modules[moduleIndex].questions[questionIndex].options.push('');
    renderModules();
}

function removeModule(index) {
    modules.splice(index, 1);
    renderModules();
}

function removeOption(moduleIndex, questionIndex, optIndex) {
    modules[moduleIndex].questions[questionIndex].options.splice(optIndex, 1);
    renderModules();
}

function removeQuestion(moduleIndex, questionIndex) {
    modules[moduleIndex].questions.splice(questionIndex, 1);
    renderModules();
}

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
            moduleContent = `<div class="quiz-module-questions">`;
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
                    optionsHtml += `<button type="button" class="btn btn-secondary add-question" onclick="addOption(${index}, ${qIndex})">+ Option</button>`;
                    if (q.type === 'qcm_single') {
                        optionsHtml += `<label style="margin-top:8px;">Bonne réponse :</label>
                        <select onchange="modules[${index}].questions[${qIndex}].correct = this.value; renderModules();">
                            <option value="">-- Choisir --</option>
                            ${q.options.map((opt, i) => `<option value="${i}" ${q.correct == i ? 'selected' : ''}>Option ${i+1}</option>`).join('')}
                        </select>`;
                    } else {
                        optionsHtml += `<label style="margin-top:8px;">Bonnes réponses (maintenez Ctrl pour plusieurs) :</label>
                        <select multiple onchange="modules[${index}].questions[${qIndex}].correct = Array.from(this.selectedOptions).map(o => parseInt(o.value)); renderModules();">
                            ${q.options.map((opt, i) => `<option value="${i}" ${Array.isArray(q.correct) && q.correct.includes(i) ? 'selected' : ''}>Option ${i+1}</option>`).join('')}
                        </select>`;
                    }
                } else {
                    optionsHtml += `<label>Réponse attendue (texte)</label>
                    <input type="text" placeholder="Réponse correcte" value="${q.correct || ''}" oninput="modules[${index}].questions[${qIndex}].correct = this.value">`;
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
            moduleContent += `<button type="button" class="btn btn-secondary add-question" onclick="addQuestionToQuiz(${index})">+ Question</button></div>`;
        }

        moduleDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h5>${module.type === 'section' ? '📄 Section' : module.type === 'video' ? '🎬 Vidéo' : '❓ Quiz'}</h5>
                <button type="button" class="remove-module" onclick="removeModule(${index})">Supprimer</button>
            </div>
            <div class="module-content">
                ${moduleContent}
            </div>
        `;

        courseModulesContainer.appendChild(moduleDiv);
    });
}

// ============================================
// ADMIN : SESSIONS, AFFECTATIONS, UTILISATEURS, GLOBAL
// ============================================
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

    document.querySelectorAll('.session-group-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const groupId = parseInt(link.dataset.groupId);
            openGroupDetail(groupId);
        });
    });
}

function openGroupDetail(groupId) {
    const group = groupes.find(g => g.id === groupId);
    if (!group) return;

    let html = `
        <div class="modal-overlay" id="groupDetailOverlay">
            <div class="modal-box">
                <h3>Groupe : ${group.nom}</h3>
                <p><strong>Cours :</strong> ${(courses.find(c => c.id === group.coursId) || {}).title || ''}</p>
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
                <div id="affectationContent"></div>
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

function showAffectationList(courseId) {
    const container = document.getElementById('affectationContent');
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
            dateDebut: "2026-09-01",
            dateFin: "2026-09-30",
            participants: selected
        };
        groupes.push(newGroup);
        closeModal('affectationModalOverlay');
        renderAdminCourses();
    });
}

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
            const targetEl = document.getElementById(`tab-${target}`);
            if (targetEl) targetEl.classList.add('active');

            if (target === 'cours') {
                renderAdminCourses();
            } else if (target === 'global') {
                renderGlobalDashboard();
            }
        });
    });
}

if (btnAddCourse) btnAddCourse.addEventListener('click', openAddCourseModal);

if (btnImportUsers && importUsersFile) {
    btnImportUsers.addEventListener('click', () => {
        importUsersFile.click();
    });
}

if (importUsersFile) {
    importUsersFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target.result;
            const lines = csv.split('\n');
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
}

function renderImportedUsers() {
    if (!importedUsersList) return;
    importedUsersList.innerHTML = '';
    importedUsers.forEach(user => {
        const li = document.createElement('li');
        li.textContent = `${user.nom || ''} ${user.prenom || ''} - ${user.fonction || ''} - ${user.bu || ''}`;
        importedUsersList.appendChild(li);
    });
}

function renderGlobalDashboard() {
    if (!isAdminPage) return;
    const totalCoursEl = document.getElementById('globalTotalCours');
    const totalGroupesEl = document.getElementById('globalTotalGroupes');
    const completionEl = document.getElementById('globalCompletion');
    if (totalCoursEl) totalCoursEl.textContent = courses.length;
    if (totalGroupesEl) totalGroupesEl.textContent = groupes.length;
    const avg = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courses.length) : 0;
    if (completionEl) completionEl.textContent = avg + '%';

    const themes = ['Management', 'Communication', 'Commerciale', 'Relation client', 'Soft skills'];
    const themeData = themes.map(theme => courses.filter(c => c.theme === theme).length);

    if (globalPieChartInstance) globalPieChartInstance.destroy();
    const pieCanvas = document.getElementById('globalPieChart');
    if (pieCanvas) {
        const pieCtx = pieCanvas.getContext('2d');
        globalPieChartInstance = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: themes,
                datasets: [{ data: themeData, backgroundColor: ['#00afa9', '#096475', '#ffa900', '#7200a9', '#cce1e1'] }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    if (globalBarChartInstance) globalBarChartInstance.destroy();
    const barCanvas = document.getElementById('globalBarChart');
    if (barCanvas) {
        const barCtx = barCanvas.getContext('2d');
        globalBarChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: courses.map(c => c.title),
                datasets: [{
                    label: 'Progression (%)',
                    data: courses.map(c => c.progress || 0),
                    backgroundColor: '#00afa9',
                    borderRadius: 8,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Progression par cours', font: { size: 18, weight: 'bold' } }
                },
                scales: {
                    x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } },
                    y: { beginAtZero: true, max: 100, ticks: { callback: function(value) { return value + '%'; } } }
                }
            }
        });
    }
}

// ============================================
// TABLEAU DE BORD APPRENANT
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
    if (statValues.length >= 3) {
        statValues[2].textContent = `${completedCours} / ${totalCours}`;
        statValues[3].textContent = completedCours;
    }

    const themes = ['Management', 'Communication', 'Commerciale', 'Relation client', 'Soft skills'];
    const themeProgress = themes.map(theme => {
        const themeCourses = courses.filter(c => c.theme === theme);
        const themeCompleted = themeCourses.filter(c => c.progress === 100);
        return themeCourses.length > 0 ? Math.round((themeCompleted.length / themeCourses.length) * 100) : 0;
    });

    const ctx = document.getElementById('progressChart');
    if (ctx) {
        const context = ctx.getContext('2d');
        if (progressChartInstance) progressChartInstance.destroy();

        progressChartInstance = new Chart(context, {
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
                    y: { beginAtZero: true, max: 100, ticks: { callback: function(value) { return value + '%'; } } }
                }
            }
        });
    }
}

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await checkSession();

    if (isAdminPage) {
        if (courseForm) courseForm.addEventListener('submit', saveCourse);
        document.getElementById('btnAddSection')?.addEventListener('click', addSectionModule);
        document.getElementById('btnAddVideo')?.addEventListener('click', addVideoModule);
        document.getElementById('btnAddQuiz')?.addEventListener('click', addQuizModule);
    }

    if (isLearnerPage) {
        if (location.hash === '#catalogue') {
            document.querySelector('nav a[data-section="catalogue"]')?.click();
        } else if (location.hash === '#dashboard') {
            document.querySelector('nav a[data-section="dashboard"]')?.click();
        }
    }
});