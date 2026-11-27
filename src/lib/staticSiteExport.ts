export interface StaticFileEntry {
  filename: string;
  label: string;
  description: string;
  content: string;
}

export const CORRECTED_ADMIN_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administration - Plateforme de Formation Connecteo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Mada:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div id="loginScreen" class="login-screen">
        <div class="login-box">
            <div class="login-logo">
                <img src="logo.svg" class="login-logo-img" alt="Logo Connecteo">
                <h1>Espace Formation</h1>
            </div>
            <p class="login-subtitle">Espace réservé aux gestionnaires de formation</p>
            <form id="loginForm">
                <label for="username">Nom d'utilisateur</label>
                <input type="text" id="username" required placeholder="Votre identifiant">
                <label for="password">Mot de passe</label>
                <input type="password" id="password" required placeholder="Votre mot de passe">
                <button type="submit" class="btn-login">Se connecter</button>
                <p id="loginError" class="login-error"></p>
            </form>
        </div>
    </div>

    <div id="mainApp" class="main-app" style="display: none;">
        <header class="topbar">
            <div class="logo">
                <img src="logo.svg" class="topbar-logo-img" alt="Logo Connecteo">
                <span>Administration</span>
            </div>
            <div class="topbar-actions">
                <button class="bell-btn" id="bellBtn" title="Demandes d'inscription" type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span class="bell-badge" id="bellBadge" style="display:none;">0</span>
                </button>
                <div class="user-menu">
                    <button class="user-menu-button" id="userMenuButton" type="button">
                        <span class="user-avatar" id="userAvatarInitial">A</span>
                        <span id="currentUser"></span>
                        <span class="chevron">▾</span>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <a href="index.html?force=learner" id="goToLearner">Voir l'espace apprenant</a>
                        <a href="#" id="logoutBtn">Déconnexion</a>
                    </div>
                </div>
            </div>
        </header>

        <main class="container">
            <section id="adminSection" class="section active">
                <div class="page-head">
                    <h2>Administration</h2>
                    <p class="section-desc">Gérez les cours, les utilisateurs et le suivi des résultats.</p>
                </div>

                <div class="admin-tabs">
                    <button class="tab-btn active" data-tab="global" type="button">Vue globale</button>
                    <button class="tab-btn" data-tab="cours" type="button">Gestion des cours</button>
                    <button class="tab-btn" data-tab="utilisateurs" type="button">Utilisateurs</button>
                    <button class="tab-btn" data-tab="resultats" type="button">Résultats</button>
                </div>

                <div id="tab-global" class="tab-content active">
                    <h3>Tableau de bord global</h3>
                    <div class="global-stats">
                        <div class="stat-card">
                            <span class="stat-label">Total cours</span>
                            <span class="stat-val" id="globalTotalCours">0</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Groupes actifs</span>
                            <span class="stat-val" id="globalTotalGroupes">0</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Complétion moyenne</span>
                            <span class="stat-val" id="globalCompletion">0%</span>
                        </div>
                    </div>
                    <div class="global-charts">
                        <div class="chart-container">
                            <canvas id="globalPieChart"></canvas>
                        </div>
                        <div class="chart-container">
                            <canvas id="globalBarChart"></canvas>
                        </div>
                        <div class="recap-card">
                            <h3>Récapitulatif par mode de visibilité</h3>
                            <table class="admin-table" id="visibilitySummaryTable">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Cours</th>
                                        <th>Ciblés</th>
                                        <th>Terminés</th>
                                        <th>Taux</th>
                                    </tr>
                                </thead>
                                <tbody id="visibilitySummaryBody">
                                    <tr><td colspan="5" style="text-align:center;color:var(--gray);">Chargement...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div id="tab-cours" class="tab-content">
                    <div class="admin-actions">
                        <button class="btn" id="btnAddCourse" type="button">+ Ajouter un cours</button>
                    </div>

                    <div class="course-filters">
                        <select id="filterTheme" class="filter-select"><option value="">Toutes les thématiques</option></select>
                        <select id="filterTitle" class="filter-select"><option value="">Tous les titres</option></select>
                        <select id="filterNiveau" class="filter-select"><option value="">Tous les niveaux</option></select>
                        <select id="filterDuree" class="filter-select"><option value="">Toutes les durées</option></select>
                        <select id="filterType" class="filter-select"><option value="">Tous les types</option></select>
                        <select id="filterSession" class="filter-select">
                            <option value="">Toutes les sessions</option>
                            <option value="with">Avec session(s)</option>
                            <option value="without">Sans session</option>
                        </select>
                        <button class="btn btn-secondary" id="btnResetCourseFilters" type="button">Réinitialiser</button>
                        <span class="filter-count" id="courseFilterCount"></span>
                    </div>

                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Thématique</th>
                                <th>Titre</th>
                                <th>Niveau</th>
                                <th>Durée</th>
                                <th>Type</th>
                                <th>Sessions</th>
                                <th>Validés</th>
                                <th>Terminés</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="adminCoursesTable"></tbody>
                    </table>
                </div>

                <div id="tab-utilisateurs" class="tab-content">
                    <div class="admin-actions">
                        <input type="file" id="importUsersFile" accept=".csv" style="display: none;">
                        <button class="btn" id="btnImportUsers" type="button">Importer des utilisateurs (CSV)</button>
                        <button class="btn btn-danger" id="btnDeleteAllUsers" type="button">Supprimer tous les utilisateurs</button>
                    </div>
                    <p id="importStatus" class="import-status" style="display:none;"></p>

                    <div class="profiles-filters">
                        <input type="text" id="profileSearch" placeholder="Rechercher un nom, un matricule..." class="filter-input">
                        <select id="profileBuFilter" class="filter-select">
                            <option value="">Toutes les BU</option>
                        </select>
                        <select id="profileRoleFilter" class="filter-select">
                            <option value="">Tous les rôles</option>
                            <option value="admin">Admin</option>
                            <option value="formateur">Formateur</option>
                            <option value="apprenant">Apprenant</option>
                        </select>
                        <button class="btn btn-secondary" id="btnResetProfileFilters" type="button">Réinitialiser</button>
                        <span class="filter-count" id="profileCount"></span>
                    </div>

                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Nom complet</th>
                                <th>Identifiant</th>
                                <th>Matricule</th>
                                <th>BU</th>
                                <th>Fonction</th>
                                <th>Rôle</th>
                                <th style="width:90px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="profilesTableBody">
                            <tr><td colspan="7" style="text-align:center;color:var(--gray);">Chargement...</td></tr>
                        </tbody>
                    </table>
                </div>

                <div id="tab-resultats" class="tab-content">
                    <h3>Résultats des formations</h3>

                    <div class="results-filters">
                        <label for="filterCourse">Filtrer par cours :</label>
                        <select id="filterCourse">
                            <option value="">Tous les cours</option>
                        </select>
                        <button class="btn" id="btnExportCSV" type="button" style="margin-left:auto;">Exporter en CSV</button>
                    </div>

                    <div class="results-summary">
                        <div class="stat-card"><span class="stat-label">Total lignes</span><span class="stat-val" id="resultsTotalCount">0</span></div>
                        <div class="stat-card"><span class="stat-label">Cours terminés</span><span class="stat-val" id="resultsCompletedCount">0</span></div>
                        <div class="stat-card"><span class="stat-label">Apprenants uniques</span><span class="stat-val" id="resultsUniqueUsers">0</span></div>
                    </div>

                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Apprenant</th>
                                <th>Cours</th>
                                <th>Statut</th>
                                <th>Score</th>
                                <th>Date de complétion</th>
                                <th>Affecté</th>
                            </tr>
                        </thead>
                        <tbody id="resultsTableBody">
                            <tr><td colspan="6" style="text-align:center;color:var(--gray);">Chargement...</td></tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </main>

        <footer>
            <p>© 2026 Connecteo - Tous droits réservés.</p>
        </footer>
    </div>

    <!-- MODALE CRÉATION / ÉDITION DE COURS -->
    <div id="courseModalOverlay" class="modal-overlay" style="display: none;">
        <div class="modal-box" style="max-width: 840px;">
            <div class="modal-header-row">
                <h3 id="courseModalTitle">Ajouter un cours</h3>
                <button type="button" class="btn-icon-close" onclick="closeCourseModal()" aria-label="Fermer">✕</button>
            </div>

            <div class="creation-mode-switch" id="creationModeSwitch">
                <button type="button" class="mode-tab active" data-mode="manual" id="btnModeManual">Création manuelle</button>
                <button type="button" class="mode-tab" data-mode="html" id="btnModeHtml">Import cours HTML</button>
            </div>

            <form id="courseForm" novalidate>
                <!-- BLOC IMPORT HTML DIRECT -->
                <div id="htmlImportPanel" style="display: none;">
                    <div class="html-dropzone">
                        <p class="dropzone-title">Importer un fichier de cours HTML</p>
                        <p class="dropzone-desc">Toutes les informations (titre, description, thématique, niveau, durée, syllabus) sont extraites automatiquement depuis le fichier HTML. Aucun champ manuel requis.</p>
                        <input type="file" id="courseHtmlFile" accept=".html,.htm">
                    </div>
                    <div id="htmlExtractedPreview" class="extracted-preview" style="display: none;"></div>
                    <div style="margin: 12px 0;">
                        <label class="inline-check">
                            <input type="checkbox" id="toggleManualOverride">
                            <span>Ajuster manuellement les informations extraites (optionnel)</span>
                        </label>
                    </div>
                </div>

                <!-- CHAMPS MÉTADONNÉES -->
                <div id="manualFieldsGroup">
                    <div class="form-grid-2">
                        <div>
                            <label for="courseTitle">Titre du cours <span class="req-star">*</span></label>
                            <input type="text" id="courseTitle" placeholder="Ex : Fondamentaux du management">
                        </div>
                        <div>
                            <label for="courseDuree">Durée <span class="req-star">*</span></label>
                            <input type="text" id="courseDuree" placeholder="Ex : 2h ou 45 min">
                        </div>
                    </div>

                    <label for="courseDescription">Description <span class="req-star">*</span></label>
                    <textarea id="courseDescription" rows="3" placeholder="Objectifs et périmètre du module..."></textarea>

                    <div class="form-grid-3">
                        <div>
                            <label for="courseTheme">Thématique</label>
                            <select id="courseTheme">
                                <option value="Management">Management</option>
                                <option value="Communication">Communication</option>
                                <option value="Commerciale">Commerciale</option>
                                <option value="Relation client">Relation client</option>
                                <option value="Soft skills">Soft skills</option>
                            </select>
                        </div>
                        <div>
                            <label for="courseNiveau">Niveau</label>
                            <select id="courseNiveau">
                                <option value="1">Niveau 1</option>
                                <option value="2">Niveau 2</option>
                                <option value="3">Niveau 3</option>
                                <option value="4">Niveau 4</option>
                            </select>
                        </div>
                        <div>
                            <label for="courseType">Type</label>
                            <select id="courseType">
                                <option value="obligatoire">Obligatoire</option>
                                <option value="information">Information</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-grid-2">
                        <div>
                            <label for="courseVisibilityMode">Mode de visibilité</label>
                            <select id="courseVisibilityMode">
                                <option value="assigned_only">Affectation uniquement (assigné par le formateur)</option>
                                <option value="auto_enrollment_with_validation">Auto-inscription avec validation</option>
                                <option value="unlock_by_progression">Déblocage par progression (montée en compétence)</option>
                                <option value="mandatory">Obligatoire avec date limite</option>
                            </select>
                        </div>
                        <div>
                            <label for="courseAvailabilityDate">Date de disponibilité (optionnel)</label>
                            <input type="date" id="courseAvailabilityDate">
                        </div>
                    </div>

                    <div class="form-grid-2" style="align-items: center;">
                        <div>
                            <label class="inline-check">
                                <input type="checkbox" id="courseAutoInscription" checked>
                                <span>Autoriser l'auto-inscription</span>
                            </label>
                        </div>
                        <div>
                            <label for="courseColor">Couleur d'en-tête</label>
                            <input type="color" id="courseColor" value="#00afa9">
                        </div>
                    </div>

                    <label for="courseSyllabus">Syllabus (un point par ligne)</label>
                    <textarea id="courseSyllabus" rows="4" placeholder="Rôle et missions du manager&#10;Les styles de management"></textarea>
                </div>

                <!-- BLOC MODULES MANUELS -->
                <div id="manualModulesBlock">
                    <hr class="modal-sep">
                    <h4>Contenu du cours</h4>
                    <p class="scale-info">Ajoutez des sections, vidéos et quiz ci-dessous.</p>
                    <div id="courseModulesContainer"></div>
                    <div class="admin-actions" style="justify-content: flex-start; gap: 10px;">
                        <button type="button" class="btn btn-secondary" id="btnAddSection">+ Section</button>
                        <button type="button" class="btn btn-secondary" id="btnAddVideo">+ Vidéo</button>
                        <button type="button" class="btn btn-secondary" id="btnAddQuiz">+ Quiz</button>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeCourseModal()">Annuler</button>
                    <button type="button" class="btn btn-secondary" id="btnSaveDraft">Enregistrer</button>
                    <button type="button" class="btn btn-secondary" id="btnSaveAndQuit">Enregistrer et quitter</button>
                    <button type="button" class="btn" id="btnPublish">Publier</button>
                    <button type="button" class="btn" id="btnPublishAndAssign">Publier et affecter</button>
                </div>
            </form>
        </div>
    </div>

    <div class="notification-panel" id="notificationPanel">
        <div class="notification-header">
            <h3>Demandes d'inscription</h3>
            <button class="notification-close" onclick="closeNotificationPanel()" type="button">✕</button>
        </div>
        <div class="notification-list" id="notificationList"></div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
    <script src="script.js"></script>
</body>
</html>`;

export const CORRECTED_HTML_PLAYER = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lecteur de cours — Connecteo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Mada:wght@500;700;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
    <style>
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #f4f7f8; font-family: 'Mada', sans-serif; display: flex; flex-direction: column; }
        .player-bar {
            height: 56px;
            background: #ffffff;
            border-bottom: 1px solid #e2ecee;
            padding: 0 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }
        .player-bar a { text-decoration: none; color: #096475; font-weight: 700; font-size: 0.95rem; }
        .player-title { font-weight: 700; color: #243238; font-size: 0.95rem; }
        .player-btn {
            background: #00afa9;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 8px 14px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
        }
        .player-btn:hover { background: #096475; }
        iframe { width: 100%; flex: 1; border: none; background: #fff; }
        .loading { display: flex; justify-content: center; align-items: center; flex: 1; color: #096475; font-weight: 700; }
    </style>
</head>
<body>
    <header class="player-bar">
        <a href="index.html?force=learner#mes-formations">← Retour à la plateforme</a>
        <span id="courseTitleBar" class="player-title">Module interactif</span>
        <button id="btnManualComplete" class="player-btn" type="button">Marquer comme terminé</button>
    </header>
    <div id="loader" class="loading">Chargement du module interactif...</div>
    <iframe id="courseFrame" style="display: none;"></iframe>

    <script>
        const SUPABASE_URL = "https://txdvluhigwkyrduqxmyr.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZHZsdWhpZ3dreXJkdXF4bXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTYzMzEsImV4cCI6MjEwMjg5MjMzMX0.waXh6ptcSMocNPJMbF36IPGIH4E-EGdTvj9NwGoiSV0";
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = parseInt(urlParams.get('id'), 10);

        async function loadCourse() {
            if (!courseId) {
                document.getElementById('loader').textContent = "Erreur : Aucun cours spécifié.";
                return;
            }
            const { data, error } = await supabaseClient
                .from('courses')
                .select('title, html_content')
                .eq('id', courseId)
                .single();

            if (error || !data || !data.html_content) {
                document.getElementById('loader').textContent = "Erreur : Impossible de charger le contenu du cours.";
                return;
            }

            if (data.title) {
                document.getElementById('courseTitleBar').textContent = data.title;
                document.title = data.title + " — Connecteo";
            }

            document.getElementById('loader').style.display = 'none';
            const iframe = document.getElementById('courseFrame');
            iframe.style.display = 'block';
            iframe.srcdoc = data.html_content;
        }

        async function saveCompletion(score) {
            const sessionRaw = sessionStorage.getItem('sessionUser') || localStorage.getItem('sessionUser');
            const sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null;
            if (!sessionUser || !courseId) {
                alert("Session expirée. Veuillez vous reconnecter.");
                return;
            }

            const { data: profileData } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('username', sessionUser.username)
                .maybeSingle();

            if (!profileData) {
                alert("Profil utilisateur introuvable dans la base.");
                return;
            }

            const { error } = await supabaseClient
                .from('progress')
                .upsert({
                    user_id: profileData.id,
                    course_id: courseId,
                    completed: true,
                    score: typeof score === 'number' ? score : 100,
                    completed_at: new Date().toISOString()
                }, { onConflict: 'user_id,course_id' });

            if (!error) {
                alert("Félicitations, votre progression a été enregistrée !");
                window.location.href = "index.html?force=learner#mes-formations";
            } else {
                console.error(error);
                alert("Erreur lors de l'enregistrement : " + error.message);
            }
        }

        window.addEventListener('message', async function(event) {
            if (event.data && event.data.type === 'COURSE_COMPLETED') {
                await saveCompletion(event.data.score);
            }
        });

        document.getElementById('btnManualComplete').addEventListener('click', () => saveCompletion(100));
        loadCourse();
    </script>
</body>
</html>`;

export const CORRECTED_COURSE_PLAYER = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lecture du cours — Connecteo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Mada:wght@400;500;700;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
    <style>
        :root {
            --primary: #00afa9;
            --primary-light: #e4f5f4;
            --primary-dark: #096475;
            --gray: #6f7d81;
            --gray-light: #f4f7f8;
            --gray-dark: #243238;
            --white: #ffffff;
            --error: #e74c3c;
            --radius: 12px;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Mada', sans-serif; background: var(--gray-light); color: var(--gray-dark); line-height: 1.6; }
        .topbar {
            background: var(--white);
            border-bottom: 1px solid #e2ecee;
            padding: 14px 36px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .topbar a { text-decoration: none; color: var(--primary-dark); font-weight: 700; }
        .container { max-width: 900px; margin: 30px auto; padding: 0 20px; }
        .course-header {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: var(--white);
            padding: 36px;
            border-radius: var(--radius);
            margin-bottom: 24px;
        }
        .course-header h1 { font-size: 1.9rem; font-weight: 900; margin-bottom: 8px; }
        .module-card {
            background: var(--white);
            border: 1px solid #e2ecee;
            border-radius: var(--radius);
            padding: 24px;
            margin-bottom: 20px;
        }
        .module-card h2 { color: var(--primary-dark); margin-bottom: 14px; font-size: 1.3rem; }
        .video-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 10px; margin-bottom: 12px; }
        .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
        .quiz-question { margin-bottom: 18px; }
        .quiz-option { display: block; background: var(--gray-light); padding: 11px 14px; border-radius: 8px; margin-top: 8px; cursor: pointer; border: 1px solid #e2ecee; }
        .quiz-option:hover { border-color: var(--primary); }
        .quiz-option input { margin-right: 10px; }
        button {
            background: var(--primary);
            color: var(--white);
            border: none;
            padding: 11px 22px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
        }
        button:hover { background: var(--primary-dark); }
        .btn-secondary { background: #edf7f6; color: var(--primary-dark); border: 1px solid #d6ecea; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-weight: 700; }
        .result { margin-top: 12px; font-weight: 700; color: var(--primary-dark); }
        .actions { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
        .error-message { background: var(--error); color: white; padding: 20px; border-radius: var(--radius); text-align: center; }
        .loading { text-align: center; padding: 40px; color: var(--gray); }
    </style>
</head>
<body>
    <header class="topbar">
        <a href="index.html?force=learner#catalogue">← Retour à la plateforme</a>
        <span style="font-weight:700;color:#096475;">Connecteo Formation</span>
    </header>

    <main class="container">
        <div id="courseContent"><div class="loading">Chargement du cours...</div></div>
    </main>

    <script>
        const SUPABASE_URL = "https://txdvluhigwkyrduqxmyr.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZHZsdWhpZ3dreXJkdXF4bXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTYzMzEsImV4cCI6MjEwMjg5MjMzMX0.waXh6ptcSMocNPJMbF36IPGIH4E-EGdTvj9NwGoiSV0";
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const urlParams = new URLSearchParams(window.location.search);
        const courseId = parseInt(urlParams.get('id'), 10);

        let course = null;
        let modules = [];
        let lastQuizScore = 100;

        function toEmbedUrl(url) {
            if (!url) return '';
            const ytMatch = url.match(/(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([\\w-]+)/);
            if (ytMatch) return 'https://www.youtube.com/embed/' + ytMatch[1];
            const vimeoMatch = url.match(/vimeo\\.com\\/(\\d+)/);
            if (vimeoMatch) return 'https://player.vimeo.com/video/' + vimeoMatch[1];
            return url;
        }

        async function loadCourse() {
            if (!courseId) {
                document.getElementById('courseContent').innerHTML = '<div class="error-message">Aucun cours spécifié.</div>';
                return;
            }
            const { data, error } = await supabaseClient.from('courses').select('*').eq('id', courseId).single();
            if (error || !data) {
                document.getElementById('courseContent').innerHTML = '<div class="error-message">Cours introuvable.</div>';
                return;
            }
            course = data;
            if (course.html_content && (!course.modules || course.modules.length === 0)) {
                window.location.replace('html-player.html?id=' + courseId);
                return;
            }
            modules = course.modules || [];
            renderCourse();
        }

        function renderCourse() {
            const container = document.getElementById('courseContent');
            let html = '<div class="course-header"><h1>' + course.title + '</h1><p>' + (course.description || '') + '</p></div>';
            if (modules.length > 0) {
                modules.forEach((mod, index) => { html += renderModule(mod, index); });
            } else {
                html += '<div class="module-card"><p>Ce cours ne contient pas encore de contenu interactif.</p></div>';
            }
            html += '<div class="module-card"><div class="actions"><a href="index.html?force=learner#catalogue" class="btn-secondary">Retour au catalogue</a><button id="btnFinishCourse">Terminer le cours</button></div></div>';
            container.innerHTML = html;
            document.getElementById('btnFinishCourse').addEventListener('click', finishCourse);
        }

        function renderModule(mod, index) {
            let h = '<div class="module-card">';
            if (mod.type === 'section') {
                h += '<h2>' + (mod.title || 'Section') + '</h2><p style="white-space:pre-line;">' + (mod.content || 'Aucun contenu.') + '</p>';
            } else if (mod.type === 'video') {
                const embed = toEmbedUrl(mod.url);
                h += '<h2>Vidéo</h2>';
                if (embed && (embed.includes('embed') || embed.includes('player.vimeo'))) {
                    h += '<div class="video-container"><iframe src="' + embed + '" allowfullscreen></iframe></div>';
                } else if (mod.url) {
                    h += '<p>Lien vidéo : <a href="' + mod.url + '" target="_blank">' + mod.url + '</a></p>';
                } else {
                    h += '<p>Aucune vidéo fournie.</p>';
                }
            } else if (mod.type === 'quiz') {
                h += '<h2>Quiz</h2>' + renderQuiz(mod.questions, index);
            }
            return h + '</div>';
        }

        function renderQuiz(questions, moduleIndex) {
            if (!questions || questions.length === 0) return '<p>Aucun quiz.</p>';
            let qh = '';
            questions.forEach((q, qIndex) => {
                qh += '<div class="quiz-question"><p><strong>' + (qIndex + 1) + '. ' + q.question + '</strong></p>';
                if (q.type === 'text') {
                    qh += '<input type="text" class="text-answer" data-module="' + moduleIndex + '" data-question="' + qIndex + '" placeholder="Votre réponse" style="width:100%;padding:10px;border:1px solid #dce7e9;border-radius:8px;margin-top:8px;">';
                } else if (q.type === 'qcm_single') {
                    (q.options || []).forEach((opt, optIndex) => {
                        qh += '<label class="quiz-option"><input type="radio" name="quiz-' + moduleIndex + '-' + qIndex + '" value="' + optIndex + '">' + opt + '</label>';
                    });
                } else if (q.type === 'qcm_multiple') {
                    (q.options || []).forEach((opt, optIndex) => {
                        qh += '<label class="quiz-option"><input type="checkbox" name="quiz-' + moduleIndex + '-' + qIndex + '" value="' + optIndex + '">' + opt + '</label>';
                    });
                }
                qh += '</div>';
            });
            qh += '<button type="button" onclick="validateQuiz(' + moduleIndex + ')">Valider le quiz</button><p class="result" id="quiz-result-' + moduleIndex + '"></p>';
            return qh;
        }

        function validateQuiz(moduleIndex) {
            const mod = modules[moduleIndex];
            if (!mod || mod.type !== 'quiz') return;
            const questions = mod.questions || [];
            let score = 0;
            questions.forEach((q, qIndex) => {
                if (q.type === 'text') {
                    const input = document.querySelector('.text-answer[data-module="' + moduleIndex + '"][data-question="' + qIndex + '"]');
                    if (input && q.correct && input.value.trim().toLowerCase() === String(q.correct).trim().toLowerCase()) score++;
                } else if (q.type === 'qcm_single') {
                    const selected = document.querySelector('input[name="quiz-' + moduleIndex + '-' + qIndex + '"]:checked');
                    if (selected && parseInt(selected.value, 10) === parseInt(q.correct, 10)) score++;
                } else if (q.type === 'qcm_multiple') {
                    const selected = document.querySelectorAll('input[name="quiz-' + moduleIndex + '-' + qIndex + '"]:checked');
                    const selectedIdx = Array.from(selected).map(el => parseInt(el.value, 10)).sort((a, b) => a - b);
                    const correctIdx = Array.isArray(q.correct) ? q.correct.map(i => parseInt(i, 10)).sort((a, b) => a - b) : [];
                    if (JSON.stringify(selectedIdx) === JSON.stringify(correctIdx)) score++;
                }
            });
            const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 100;
            lastQuizScore = percent;
            document.getElementById('quiz-result-' + moduleIndex).textContent = 'Score : ' + score + '/' + questions.length + ' (' + percent + '%)';
        }

        async function finishCourse() {
            const sessionRaw = sessionStorage.getItem('sessionUser') || localStorage.getItem('sessionUser');
            const sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null;
            if (!sessionUser) {
                alert('Vous devez être connecté pour enregistrer votre progression.');
                return;
            }
            const { data: profileData } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('username', sessionUser.username)
                .maybeSingle();

            if (!profileData) {
                alert('Profil apprenant introuvable dans Supabase.');
                return;
            }

            const { error } = await supabaseClient
                .from('progress')
                .upsert({
                    user_id: profileData.id,
                    course_id: courseId,
                    completed: true,
                    score: lastQuizScore,
                    completed_at: new Date().toISOString()
                }, { onConflict: 'user_id,course_id' });

            if (error) {
                alert("Erreur lors de l'enregistrement : " + error.message);
                return;
            }
            alert('Cours terminé ! Votre progression a été enregistrée.');
            window.location.href = 'index.html?force=learner#mes-formations';
        }

        loadCourse();
    </script>
</body>
</html>`;

export const CORRECTED_SCRIPT_JS_SNIPPET = `// ============================================
// EXTRAIT CORRIGÉ POUR script.js (Création & Import HTML automatique)
// À copier-coller dans votre script.js en remplacement de openAddCourseModal / openEditCourseModal / saveCourse / renderModules
// ============================================

let creationMode = 'manual'; // 'manual' | 'html'
let parsedHtmlCourseData = null;

function setCreationMode(mode) {
    creationMode = mode;
    const isHtml = mode === 'html';
    document.getElementById('btnModeManual')?.classList.toggle('active', !isHtml);
    document.getElementById('btnModeHtml')?.classList.toggle('active', isHtml);
    const htmlPanel = document.getElementById('htmlImportPanel');
    const manualFields = document.getElementById('manualFieldsGroup');
    const manualModules = document.getElementById('manualModulesBlock');
    const overrideCheck = document.getElementById('toggleManualOverride');

    if (htmlPanel) htmlPanel.style.display = isHtml ? 'block' : 'none';
    if (manualModules) manualModules.style.display = isHtml ? 'none' : 'block';
    if (manualFields) {
        manualFields.style.display = (!isHtml || (overrideCheck && overrideCheck.checked)) ? 'block' : 'none';
    }
}

function parseCourseMetadataFromHtml(htmlText, fileName) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    let jsonMeta = {};
    const jsonScript = doc.querySelector('script#course-metadata[type="application/json"], script[data-course-meta]');
    if (jsonScript && jsonScript.textContent) {
        try { jsonMeta = JSON.parse(jsonScript.textContent.trim()); } catch (e) {}
    }

    const getMeta = (...names) => {
        for (const name of names) {
            const el = doc.querySelector('meta[name="' + name + '"], meta[property="' + name + '"]');
            const c = el && el.getAttribute('content');
            if (c && c.trim()) return c.trim();
        }
        return null;
    };

    const validThemes = ['Management', 'Communication', 'Commerciale', 'Relation client', 'Soft skills'];
    const rawTheme = jsonMeta.theme || getMeta('course:theme', 'theme', 'category') || '';
    const theme = validThemes.find(t => t.toLowerCase() === rawTheme.toLowerCase()) || 'Management';

    const title = jsonMeta.title || getMeta('course:title', 'og:title') ||
        (doc.querySelector('title')?.textContent?.trim()) ||
        (doc.querySelector('h1')?.textContent?.trim()) ||
        fileName.replace(/\\.html?$/i, '').replace(/[-_]+/g, ' ').trim();

    const firstP = Array.from(doc.querySelectorAll('p')).map(p => p.textContent.trim()).find(t => t.length > 20);
    const description = jsonMeta.description || getMeta('course:description', 'description', 'og:description') ||
        firstP || ('Module interactif HTML : ' + title);

    const rawLevel = String(jsonMeta.niveau || jsonMeta.level || getMeta('course:niveau', 'course:level', 'level') || '1');
    const lvlMatch = rawLevel.match(/[1-4]/);
    const niveau = lvlMatch ? parseInt(lvlMatch[0], 10) : 1;

    const bodyDur = doc.body?.textContent?.match(/\\b(\\d+\\s*(?:h(?:\\s*\\d+)?|min(?:utes?)?|mn))\\b/i);
    const duree = jsonMeta.duree || jsonMeta.duration || getMeta('course:duree', 'course:duration', 'duration') ||
        (bodyDur ? bodyDur[1] : '30 min');

    const rawType = (jsonMeta.type || getMeta('course:type') || 'obligatoire').toLowerCase();
    const type = rawType.includes('info') ? 'information' : 'obligatoire';

    const visibility_mode = jsonMeta.visibility_mode || getMeta('course:visibility', 'course:visibility_mode') || 'assigned_only';
    const color = jsonMeta.color || getMeta('course:color', 'theme-color') || '#00afa9';

    let syllabus = [];
    if (Array.isArray(jsonMeta.syllabus)) syllabus = jsonMeta.syllabus;
    else {
        const metaSyl = getMeta('course:syllabus');
        if (metaSyl) syllabus = metaSyl.split(/[|;\\n]/).map(s => s.trim()).filter(Boolean);
        else syllabus = Array.from(doc.querySelectorAll('[data-syllabus] li, .syllabus li, h2')).map(el => el.textContent.trim()).filter(Boolean).slice(0, 6);
    }

    return {
        title, description, theme, niveau, duree, type,
        visibility_mode, color, syllabus,
        auto_inscription: visibility_mode === 'auto_enrollment_with_validation',
        availability_date: jsonMeta.availability_date || getMeta('course:availability_date') || null,
        html_content: htmlText
    };
}

document.getElementById('btnModeManual')?.addEventListener('click', () => setCreationMode('manual'));
document.getElementById('btnModeHtml')?.addEventListener('click', () => setCreationMode('html'));
document.getElementById('toggleManualOverride')?.addEventListener('change', () => setCreationMode('html'));

document.getElementById('courseHtmlFile')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const htmlText = await file.text();
    const parsed = parseCourseMetadataFromHtml(htmlText, file.name);
    parsedHtmlCourseData = parsed;

    // Remplissage automatique des champs cachés / optionnels
    courseTitleInput.value = parsed.title;
    courseDescriptionInput.value = parsed.description;
    courseThemeInput.value = parsed.theme;
    courseNiveauInput.value = String(parsed.niveau);
    courseDureeInput.value = parsed.duree;
    courseTypeInput.value = parsed.type;
    courseVisibilityModeInput.value = parsed.visibility_mode;
    courseColorInput.value = parsed.color;
    courseAutoInscriptionInput.checked = parsed.auto_inscription;
    courseSyllabusInput.value = parsed.syllabus.join('\\n');
    if (courseAvailabilityDateInput) courseAvailabilityDateInput.value = parsed.availability_date || '';

    const preview = document.getElementById('htmlExtractedPreview');
    if (preview) {
        preview.style.display = 'block';
        preview.innerHTML =
            '<strong>Informations extraites du fichier HTML :</strong><br>' +
            'Titre : <b>' + parsed.title + '</b><br>' +
            'Thématique : ' + parsed.theme + ' · Niveau ' + parsed.niveau + ' · Durée : ' + parsed.duree + '<br>' +
            'Description : ' + parsed.description;
    }
});

function openAddCourseModal() {
    if (!courseModalTitle || !courseForm) return;
    courseModalTitle.textContent = 'Ajouter un cours';
    courseForm.reset();
    courseColorInput.value = '#00afa9';
    courseAutoInscriptionInput.checked = true;
    courseForm.dataset.editId = '';
    courseForm.dataset.previousStatus = '';
    parsedHtmlCourseData = null;
    const preview = document.getElementById('htmlExtractedPreview');
    if (preview) preview.style.display = 'none';
    const override = document.getElementById('toggleManualOverride');
    if (override) override.checked = false;
    setCreationMode('manual');
    modules = [];
    renderModules();
    const fileInput = document.getElementById('courseHtmlFile');
    if (fileInput) fileInput.value = '';
    courseModalOverlay.style.display = 'flex';
}

async function openEditCourseModal(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    // IMPORTANT : On ne modifie PAS le statut en base tant que l'admin n'a pas cliqué sur Enregistrer/Publier !
    courseForm.dataset.previousStatus = course.status || 'draft';
    courseModalTitle.textContent = 'Modifier le cours : ' + course.title;
    courseTitleInput.value = course.title || '';
    courseDescriptionInput.value = course.description || '';
    courseThemeInput.value = course.theme || 'Management';
    courseNiveauInput.value = String(course.niveau || 1);
    courseDureeInput.value = course.duree || '';
    courseTypeInput.value = course.type || 'obligatoire';
    courseAutoInscriptionInput.checked = course.auto_inscription !== undefined ? !!course.auto_inscription : !!course.autoInscription;
    courseColorInput.value = course.color || '#00afa9';
    courseSyllabusInput.value = Array.isArray(course.syllabus) ? course.syllabus.join('\\n') : '';
    courseVisibilityModeInput.value = course.visibility_mode || 'assigned_only';
    courseAvailabilityDateInput.value = course.availability_date || '';
    modules = course.modules ? JSON.parse(JSON.stringify(course.modules)) : [];
    parsedHtmlCourseData = course.html_content ? { html_content: course.html_content } : null;
    setCreationMode(course.html_content && modules.length === 0 ? 'html' : 'manual');
    renderModules();
    const fileInput = document.getElementById('courseHtmlFile');
    if (fileInput) fileInput.value = '';
    courseForm.dataset.editId = String(courseId);
    courseModalOverlay.style.display = 'flex';
}

async function saveCourse(action) {
    const editId = courseForm.dataset.editId ? parseInt(courseForm.dataset.editId, 10) : null;
    const fileInput = document.getElementById('courseHtmlFile');

    let htmlContent = parsedHtmlCourseData ? parsedHtmlCourseData.html_content : null;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        htmlContent = await fileInput.files[0].text();
        const parsed = parseCourseMetadataFromHtml(htmlContent, fileInput.files[0].name);
        if (!courseTitleInput.value.trim()) courseTitleInput.value = parsed.title;
        if (!courseDescriptionInput.value.trim()) courseDescriptionInput.value = parsed.description;
        if (!courseDureeInput.value.trim()) courseDureeInput.value = parsed.duree;
    }

    if (creationMode === 'html' && !htmlContent) {
        alert('Veuillez sélectionner un fichier HTML.');
        return;
    }

    const title = courseTitleInput.value.trim();
    const description = courseDescriptionInput.value.trim();
    const duree = courseDureeInput.value.trim();

    if (creationMode === 'manual' && (!title || !description || !duree)) {
        alert('Veuillez remplir le titre, la description et la durée.');
        return;
    }

    const newStatus = (action === 'save' || action === 'save_quit') ? 'draft' : 'published';
    const sessionUser = JSON.parse(sessionStorage.getItem('sessionUser') || 'null');
    const createdBy = sessionUser ? sessionUser.name : 'Admin';

    const payload = {
        title: title || 'Module HTML',
        description: description || 'Module interactif HTML',
        theme: courseThemeInput.value || 'Management',
        niveau: parseInt(courseNiveauInput.value, 10) || 1,
        duree: duree || '30 min',
        type: courseTypeInput.value || 'obligatoire',
        auto_inscription: courseAutoInscriptionInput.checked,
        color: courseColorInput.value || '#00afa9',
        syllabus: courseSyllabusInput.value.split('\\n').map(l => l.trim()).filter(Boolean),
        modules: creationMode === 'html' ? [] : JSON.parse(JSON.stringify(modules)),
        status: newStatus,
        visibility_mode: courseVisibilityModeInput.value || 'assigned_only',
        availability_date: courseAvailabilityDateInput.value || null
    };
    if (htmlContent) payload.html_content = htmlContent;
    if (!editId) {
        payload.assigned = false;
        payload.created_by = createdBy;
    }

    // Insertion/Mise à jour résiliente (retire automatiquement une colonne optionnelle absente du schéma)
    let savedRow = null;
    const workingPayload = { ...payload };
    for (let attempt = 0; attempt < 5; attempt++) {
        const res = editId
            ? await supabaseClient.from('courses').update(workingPayload).eq('id', editId).select().maybeSingle()
            : await supabaseClient.from('courses').insert(workingPayload).select().maybeSingle();

        if (!res.error) { savedRow = res.data; break; }
        const match = (res.error.message || '').match(/Could not find the '([^']+)' column|column "([^"]+)"/i);
        const missingCol = match && (match[1] || match[2]);
        if (missingCol && missingCol in workingPayload) { delete workingPayload[missingCol]; continue; }
        alert('Erreur Supabase : ' + res.error.message);
        return;
    }

    if (fileInput) fileInput.value = '';
    await loadDataFromSupabase();
    renderAdminCourses();

    if (action === 'save') {
        if (!editId && savedRow) courseForm.dataset.editId = String(savedRow.id);
        alert('Enregistré à ' + new Date().toLocaleTimeString());
    } else if (action === 'save_quit' || action === 'publish') {
        closeCourseModal();
    } else if (action === 'publish_assign') {
        closeCourseModal();
        const targetId = (savedRow && savedRow.id) || editId;
        if (targetId) openAffectationModal(targetId);
    }
}

// Navigation par ancre (#dashboard, #catalogue, #mes-formations) + initiale avatar
window.addEventListener('DOMContentLoaded', () => {
    const sessionRaw = sessionStorage.getItem('sessionUser');
    if (sessionRaw) {
        try {
            const u = JSON.parse(sessionRaw);
            const avatarEl = document.getElementById('userAvatarInitial');
            if (avatarEl && u?.name) avatarEl.textContent = u.name.trim().charAt(0).toUpperCase();
        } catch (e) {}
    }

    if (typeof isLearnerPage !== 'undefined' && isLearnerPage) {
        if (location.hash === '#catalogue') {
            document.querySelector('nav a[data-section="catalogue"]')?.click();
        } else if (location.hash === '#mes-formations') {
            document.querySelector('nav a[data-section="mes-formations"]')?.click();
        } else if (location.hash === '#dashboard') {
            document.querySelector('nav a[data-section="dashboard"]')?.click();
        }
    }
});`;

export const CORRECTED_LEARNER_INDEX_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plateforme de Formation — Connecteo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Mada:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div id="loginScreen" class="login-screen">
        <div class="login-box">
            <div class="login-logo">
                <img src="logo.svg" class="login-logo-img" alt="Logo Connecteo">
                <h1>Espace Formation</h1>
            </div>
            <p class="login-subtitle">Connectez-vous pour accéder à votre espace</p>
            <form id="loginForm">
                <label for="username">Nom d'utilisateur</label>
                <input type="text" id="username" required placeholder="Votre identifiant" autocomplete="username">
                <label for="password">Mot de passe</label>
                <input type="password" id="password" required placeholder="Votre mot de passe" autocomplete="current-password">
                <button type="submit" class="btn-login">Se connecter</button>
                <p id="loginError" class="login-error"></p>
            </form>
        </div>
    </div>

    <div id="mainApp" class="main-app" style="display: none;">
        <header class="topbar">
            <div class="logo">
                <img src="logo.svg" class="topbar-logo-img" alt="Logo Connecteo">
                <span>Espace Formation</span>
            </div>

            <nav aria-label="Navigation principale">
                <a href="#dashboard" data-section="dashboard" class="active">Accueil</a>
                <a href="#catalogue" data-section="catalogue">Catalogue</a>
                <a href="#mes-formations" data-section="mes-formations">Mes formations</a>
            </nav>

            <div class="topbar-actions">
                <div class="user-menu">
                    <button class="user-menu-button" id="userMenuButton" type="button">
                        <span class="user-avatar" id="userAvatarInitial">U</span>
                        <span id="currentUser"></span>
                        <span class="chevron">▾</span>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <a href="admin.html" id="goToAdmin" style="display:none;">Espace administration</a>
                        <a href="#" id="logoutBtn">Déconnexion</a>
                    </div>
                </div>
            </div>
        </header>

        <main class="container">
            <!-- TABLEAU DE BORD -->
            <section id="dashboardSection" class="section active">
                <div class="dashboard">
                    <div class="page-head">
                        <h2>Tableau de bord</h2>
                        <p class="section-desc">Suivez votre progression et vos parcours de formation.</p>
                    </div>

                    <div class="stats">
                        <div class="stat-card">
                            <span class="stat-label">Niveau</span>
                            <p class="value" id="statNiveau">—</p>
                            <p class="label" id="statNiveauLabel">—</p>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Points</span>
                            <p class="value" id="statPoints">—</p>
                            <p class="label" id="statPointsLabel">—</p>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Formations suivies</span>
                            <p class="value" id="statFormations">—</p>
                            <p class="label" id="statFormationsLabel">—</p>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Badges obtenus</span>
                            <p class="value" id="statBadges">—</p>
                            <p class="label" id="statBadgesLabel">—</p>
                        </div>
                    </div>

                    <div class="progress-global">
                        <label>Progression globale</label>
                        <div class="progress-bar">
                            <div class="fill" style="width: 0%;"></div>
                        </div>
                        <span>0%</span>
                    </div>

                    <div class="chart-card">
                        <h3>Progression par thématique</h3>
                        <div class="chart-container">
                            <canvas id="progressChart"></canvas>
                        </div>
                    </div>
                </div>
            </section>

            <!-- CATALOGUE -->
            <section id="catalogueSection" class="section">
                <div class="catalogue-layout">
                    <aside class="themes-sidebar">
                        <h3>Thématiques</h3>
                        <ul id="themeList">
                            <li class="active" data-theme="Management">Management</li>
                            <li data-theme="Communication">Communication</li>
                            <li data-theme="Commerciale">Commerciale</li>
                            <li data-theme="Relation client">Relation client</li>
                            <li data-theme="Soft skills">Soft skills</li>
                        </ul>
                    </aside>

                    <div class="catalogue-content">
                        <div class="catalogue-header">
                            <h2 id="catalogueTitle">Management</h2>
                            <div class="search-box">
                                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                <input type="text" id="searchInputCatalogue" placeholder="Rechercher un cours...">
                            </div>
                        </div>
                        <div id="catalogueContainer"></div>
                    </div>
                </div>
            </section>

            <!-- MES FORMATIONS -->
            <section id="mesFormationsSection" class="section">
                <div class="catalogue-header">
                    <div>
                        <h2>Mes formations</h2>
                        <p class="section-desc">Formations qui vous sont assignées ou validées.</p>
                    </div>
                    <div class="search-box">
                        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        <input type="text" id="searchInputMesFormations" placeholder="Rechercher dans mes formations...">
                    </div>
                </div>
                <div id="mesFormationsContainer" class="courses-grid"></div>
            </section>
        </main>

        <footer>
            <p>© 2026 Connecteo - Tous droits réservés.</p>
        </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
    <script src="script.js"></script>
</body>
</html>`;

export const CORRECTED_STYLE_CSS = `/* ============================================
   Connecteo Formation - Feuille de style unifiée
   Charte graphique :
   Primary   : #00afa9, #096475, #cce1e1
   Secondary : #7200a9, #ffa900, #808284
   Police    : Mada
   ============================================ */

:root {
    --primary: #00afa9;
    --primary-light: #e5f4f3;
    --primary-tint: #cce1e1;
    --primary-dark: #096475;
    --secondary-purple: #7200a9;
    --secondary-orange: #ffa900;
    --gray: #68767a;
    --gray-light: #f4f7f8;
    --gray-dark: #243238;
    --border: #dce7e9;
    --border-soft: #e8f0f1;
    --white: #ffffff;
    --danger: #c0392b;
    --success: #0c7a5b;
    --radius: 12px;
    --shadow-sm: 0 1px 3px rgba(9, 100, 117, 0.06);
    --shadow-md: 0 10px 30px rgba(9, 100, 117, 0.10);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scrollbar-gutter: stable;
}

body {
    font-family: 'Mada', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--gray-light);
    color: var(--gray-dark);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
}

/* ==================== CONNEXION ==================== */
.login-screen {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #edf7f6 0%, #f4f7f8 55%, #e2f1f0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
}

.login-box {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: var(--shadow-md);
    padding: 36px 34px;
    width: 100%;
    max-width: 440px;
}

.login-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    text-align: center;
}

.login-logo-img {
    height: 60px;
    width: auto;
    object-fit: contain;
}

.login-logo h1 {
    color: var(--primary-dark);
    font-size: 1.5rem;
    font-weight: 900;
    letter-spacing: -0.02em;
}

.login-subtitle {
    color: var(--gray);
    font-size: 0.92rem;
    text-align: center;
    margin-bottom: 24px;
}

#loginForm label {
    display: block;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--gray-dark);
    margin-bottom: 6px;
}

#loginForm input {
    width: 100%;
    height: 42px;
    padding: 0 13px;
    border: 1px solid var(--border);
    border-radius: 9px;
    font-size: 0.95rem;
    font-family: inherit;
    margin-bottom: 16px;
    background: #fcfefe;
    transition: border-color 0.2s, box-shadow 0.2s;
}

#loginForm input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(0, 175, 169, 0.14);
}

.btn-login {
    width: 100%;
    height: 44px;
    background: var(--primary);
    color: var(--white);
    border: none;
    border-radius: 9px;
    font-size: 0.98rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-login:hover {
    background: var(--primary-dark);
}

.login-error {
    color: var(--danger);
    margin-top: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    min-height: 20px;
    text-align: center;
}

/* ==================== LAYOUT & TOPBAR ==================== */
.main-app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.topbar {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 0 28px;
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    position: sticky;
    top: 0;
    z-index: 100;
}

.logo {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.topbar-logo-img {
    height: 38px;
    width: auto;
    object-fit: contain;
}

.logo span {
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--primary-dark);
    white-space: nowrap;
}

nav {
    display: flex;
    align-items: center;
    gap: 6px;
}

nav a {
    text-decoration: none;
    color: var(--gray);
    font-weight: 600;
    font-size: 0.92rem;
    padding: 8px 14px;
    border-radius: 8px;
    white-space: nowrap;
    transition: background 0.18s, color 0.18s;
}

nav a:hover {
    color: var(--primary-dark);
    background: var(--primary-light);
}

nav a.active {
    color: var(--primary-dark);
    background: var(--primary-light);
    font-weight: 700;
}

.topbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.bell-btn {
    position: relative;
    height: 38px;
    width: 38px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--white);
    color: var(--primary-dark);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
}

.bell-btn:hover {
    border-color: var(--primary);
    background: var(--primary-light);
}

.bell-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--secondary-orange);
    color: #1f2a2e;
    font-size: 0.7rem;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.user-menu {
    position: relative;
}

.user-menu-button {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    height: 38px;
    padding: 0 12px 0 8px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 9px;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--primary-dark);
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.2s, background 0.2s;
}

.user-menu-button:hover {
    border-color: var(--primary);
    background: var(--primary-light);
}

.user-avatar {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: var(--primary);
    color: var(--white);
    font-size: 0.8rem;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.user-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-md);
    min-width: 210px;
    padding: 6px;
    display: none;
    z-index: 200;
}

.user-dropdown.open {
    display: block;
}

.user-dropdown a {
    display: block;
    padding: 9px 12px;
    border-radius: 7px;
    text-decoration: none;
    color: var(--gray-dark);
    font-size: 0.88rem;
    font-weight: 600;
}

.user-dropdown a:hover {
    background: var(--primary-light);
    color: var(--primary-dark);
}

.container {
    width: 100%;
    max-width: 1320px;
    margin: 28px auto;
    padding: 0 24px;
    flex: 1;
}

.section {
    display: none;
}

.section.active {
    display: block;
}

.page-head {
    margin-bottom: 20px;
}

.page-head h2,
.catalogue-header h2,
h2 {
    color: var(--primary-dark);
    font-size: 1.55rem;
    font-weight: 900;
    letter-spacing: -0.015em;
}

.section-desc {
    color: var(--gray);
    font-size: 0.9rem;
    margin-top: 3px;
}

footer {
    text-align: center;
    padding: 18px 24px;
    color: var(--gray);
    font-size: 0.82rem;
    border-top: 1px solid var(--border-soft);
    background: var(--white);
    margin-top: 40px;
}

/* ==================== BOUTONS & CHAMPS ==================== */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 38px;
    padding: 0 16px;
    background: var(--primary);
    color: var(--white);
    border: 1px solid transparent;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.86rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.18s, border-color 0.18s;
}

.btn:hover {
    background: var(--primary-dark);
}

.btn-secondary {
    background: var(--white);
    color: var(--primary-dark);
    border: 1px solid var(--border);
}

.btn-secondary:hover {
    background: var(--primary-light);
    border-color: var(--primary);
}

.btn-danger {
    background: #fdf2f1;
    color: var(--danger);
    border: 1px solid #f0c9c5;
}

.btn-danger:hover {
    background: var(--danger);
    color: var(--white);
}

.btn-disabled,
.btn:disabled {
    background: #e6eeef;
    color: var(--gray);
    cursor: not-allowed;
}

/* ==================== DASHBOARD & KPI ==================== */
.stats,
.global-stats,
.results-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 16px;
    margin-bottom: 22px;
}

.stat-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 20px;
    box-shadow: var(--shadow-sm);
}

.stat-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--gray);
    margin-bottom: 6px;
}

.stat-card .value,
.stat-val {
    font-size: 1.85rem;
    font-weight: 900;
    color: var(--primary-dark);
    font-variant-numeric: tabular-nums;
    line-height: 1.15;
}

.stat-card .label {
    font-size: 0.82rem;
    color: var(--gray);
    margin-top: 4px;
}

.progress-global {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 22px;
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 22px;
}

.progress-global label {
    font-weight: 700;
    font-size: 0.92rem;
    color: var(--primary-dark);
    white-space: nowrap;
}

.progress-bar {
    flex: 1;
    height: 10px;
    background: #eaf1f2;
    border-radius: 999px;
    overflow: hidden;
}

.progress-bar .fill {
    height: 100%;
    background: var(--primary);
    border-radius: 999px;
    transition: width 0.4s ease;
}

.progress-global span {
    font-weight: 900;
    color: var(--primary-dark);
    font-variant-numeric: tabular-nums;
    min-width: 44px;
    text-align: right;
}

.chart-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px;
}

.chart-card h3,
.recap-card h3 {
    color: var(--primary-dark);
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 14px;
}

.chart-container {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px;
    height: 300px;
    position: relative;
}

.chart-card .chart-container {
    border: none;
    padding: 0;
}

/* ==================== CATALOGUE & MES FORMATIONS ==================== */
.catalogue-layout {
    display: grid;
    grid-template-columns: 230px 1fr;
    gap: 24px;
    align-items: start;
}

.themes-sidebar {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    position: sticky;
    top: 90px;
}

.themes-sidebar h3 {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--primary-dark);
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--border-soft);
}

#themeList {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

#themeList li {
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--gray-dark);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

#themeList li:hover {
    background: var(--primary-light);
    color: var(--primary-dark);
}

#themeList li.active {
    background: var(--primary);
    color: var(--white);
    font-weight: 700;
}

.catalogue-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
}

.search-box {
    position: relative;
    width: 100%;
    max-width: 300px;
}

.search-box .search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gray);
    pointer-events: none;
}

.search-box input {
    width: 100%;
    height: 38px;
    padding: 0 12px 0 34px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--white);
    font-family: inherit;
    font-size: 0.88rem;
}

.search-box input:focus {
    outline: none;
    border-color: var(--primary);
}

.levels-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
}

.level-column {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.level-column h4 {
    font-size: 0.82rem;
    font-weight: 900;
    color: var(--primary-dark);
    background: var(--primary-light);
    border-radius: 7px;
    padding: 7px 10px;
    text-align: center;
}

.course-item {
    border: 1px solid var(--border-soft);
    background: #fbfdfd;
    border-radius: 9px;
    padding: 12px;
    cursor: pointer;
    transition: border-color 0.18s;
}

.course-item:hover {
    border-color: var(--primary);
}

.course-item-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--gray-dark);
    margin-top: 4px;
}

.course-item-duree {
    font-size: 0.78rem;
    color: var(--gray);
    margin-top: 4px;
}

.courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 18px;
}

.course-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.course-header {
    padding: 14px 18px;
    color: var(--white);
    font-weight: 700;
    font-size: 0.85rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.course-body {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
}

.course-title {
    font-size: 1.02rem;
    font-weight: 700;
    color: var(--gray-dark);
}

.course-desc {
    font-size: 0.86rem;
    color: var(--gray);
    flex: 1;
}

.course-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--gray);
    font-variant-numeric: tabular-nums;
}

.course-progress {
    height: 7px;
    background: #eaf1f2;
    border-radius: 999px;
    overflow: hidden;
}

.course-progress .fill {
    height: 100%;
    background: var(--secondary-orange);
    border-radius: 999px;
}

.course-detail {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 20px;
}

.course-detail-panel {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
}

.syllabus-list {
    margin: 10px 0 18px 20px;
    color: var(--gray-dark);
    font-size: 0.9rem;
}

/* ==================== ADMIN ONGLETS, FILTRES & TABLES ==================== */
.admin-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 12px;
    margin-bottom: 22px;
}

.tab-btn {
    height: 36px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--gray);
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
}

.tab-btn.active {
    background: var(--primary-light);
    color: var(--primary-dark);
    border-color: var(--primary-tint);
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

.global-charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 18px;
}

.recap-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px;
    grid-column: 1 / -1;
}

.admin-actions,
.course-filters,
.profiles-filters,
.results-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
}

.filter-select,
.filter-input,
.results-filters select {
    height: 36px;
    padding: 0 11px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--white);
    font-family: inherit;
    font-size: 0.85rem;
    color: var(--gray-dark);
}

.filter-count {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--gray);
    margin-left: auto;
}

.admin-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    font-size: 0.86rem;
}

.admin-table thead th {
    background: #eff7f6;
    color: var(--primary-dark);
    font-weight: 700;
    text-align: left;
    padding: 11px 14px;
    border-bottom: 1px solid var(--border);
}

.admin-table tbody td {
    padding: 11px 14px;
    border-bottom: 1px solid var(--border-soft);
    vertical-align: middle;
}

.admin-table tbody tr:last-child td {
    border-bottom: none;
}

/* ==================== MODALES & IMPORT HTML ==================== */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(13, 39, 44, 0.5);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 500;
}

.modal-box {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-md);
}

.modal-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 14px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border-soft);
}

.modal-header-row h3 {
    color: var(--primary-dark);
    font-size: 1.15rem;
    font-weight: 900;
}

.btn-icon-close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--white);
    color: var(--gray-dark);
    font-weight: 700;
    cursor: pointer;
}

.creation-mode-switch {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 5px;
    background: #eef5f5;
    border-radius: 10px;
    margin-bottom: 18px;
}

.mode-tab {
    height: 36px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: var(--gray);
    font-family: inherit;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
}

.mode-tab.active {
    background: var(--white);
    color: var(--primary-dark);
    box-shadow: var(--shadow-sm);
}

.html-dropzone {
    border: 2px dashed var(--primary);
    background: #f2faf9;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    margin-bottom: 14px;
}

.dropzone-title {
    font-weight: 900;
    color: var(--primary-dark);
    margin-bottom: 6px;
}

.dropzone-desc {
    font-size: 0.84rem;
    color: var(--gray);
    margin-bottom: 14px;
}

.extracted-preview {
    background: #f8fbfb;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px;
    font-size: 0.86rem;
    line-height: 1.6;
}

.form-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 12px;
}

.form-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 12px;
}

#courseForm label {
    display: block;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--gray-dark);
    margin-bottom: 5px;
}

#courseForm input[type="text"],
#courseForm input[type="date"],
#courseForm select,
#courseForm textarea {
    width: 100%;
    padding: 9px 11px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.88rem;
    margin-bottom: 10px;
}

.inline-check {
    display: inline-flex !important;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.req-star {
    color: var(--danger);
}

.modal-sep {
    border: none;
    border-top: 1px solid var(--border-soft);
    margin: 18px 0;
}

.modal-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid var(--border-soft);
}

/* ==================== NOTIFICATIONS ==================== */
.notification-panel {
    position: fixed;
    top: 76px;
    right: 20px;
    width: 360px;
    max-width: calc(100vw - 40px);
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow-md);
    display: none;
    z-index: 400;
    overflow: hidden;
}

.notification-panel.open {
    display: block;
}

.notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-soft);
}

.notification-list {
    max-height: 380px;
    overflow-y: auto;
    padding: 12px;
}

@media (max-width: 900px) {
    .catalogue-layout,
    .levels-grid,
    .course-detail,
    .form-grid-2,
    .form-grid-3 {
        grid-template-columns: 1fr;
    }
    .themes-sidebar {
        position: static;
    }
    .topbar {
        padding: 0 16px;
    }
}`;

export const STATIC_FILES_EXPORT: StaticFileEntry[] = [
  {
    filename: 'index.html',
    label: 'index.html (apprenant)',
    description: 'Page apprenant corrigée (suppression du logo dupliqué, progression initialisée à 0%, icônes propres et navigation synchronisée).',
    content: CORRECTED_LEARNER_INDEX_HTML,
  },
  {
    filename: 'admin.html',
    label: 'admin.html',
    description: 'Page administration corrigée (balises fermées, mode Création manuelle / Import HTML sans saisie manuelle).',
    content: CORRECTED_ADMIN_HTML,
  },
  {
    filename: 'style.css',
    label: 'style.css',
    description: 'Feuille de style unifiée et épurée respectant la charte Connecteo (sans règles !important conflictuelles).',
    content: CORRECTED_STYLE_CSS,
  },
  {
    filename: 'script.js (correctif cours)',
    label: 'script.js (correctif)',
    description: 'Fonctions corrigées : parseCourseMetadataFromHtml, openAddCourseModal, openEditCourseModal, saveCourse résilient et ancre #mes-formations.',
    content: CORRECTED_SCRIPT_JS_SNIPPET,
  },
  {
    filename: 'html-player.html',
    label: 'html-player.html',
    description: 'Lecteur HTML corrigé (sessionStorage synchronisé, barre de contrôle et validation manuelle de secours).',
    content: CORRECTED_HTML_PLAYER,
  },
  {
    filename: 'course-player.html',
    label: 'course-player.html',
    description: 'Lecteur modules corrigé (sessionStorage + UUID réel profiles.id + conversion embed YouTube/Vimeo).',
    content: CORRECTED_COURSE_PLAYER,
  },
];

