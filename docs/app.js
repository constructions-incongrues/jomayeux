// Configuration
const EXECUTIONS_DIR = '../executions/';

// État de l'application
let newsletterData = null;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await loadNewsletter();
    if (newsletterData) {
        renderNewsletter();
    }
});

// Charger les données de la newsletter
async function loadNewsletter() {
    try {
        const response = await fetch(`${EXECUTIONS_DIR}latest.json`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let text = await response.text();
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const data = JSON.parse(text);
        
        if (!data || !data.newsletter) {
            throw new Error('Aucun fichier JSON valide trouvé');
        }
        
        newsletterData = data.newsletter;
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('newsletter').classList.remove('hidden');
    } catch (error) {
        // Détecter les erreurs CORS
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            const isFileProtocol = window.location.protocol === 'file:';
            if (isFileProtocol) {
                throw new Error('CORS: Veuillez utiliser un serveur HTTP local. Ouvrez un terminal dans le dossier du projet et exécutez: python3 -m http.server 8000 puis accédez à http://localhost:8000/docs/');
            } else {
                throw new Error('CORS: Erreur de chargement. Vérifiez que le serveur autorise les requêtes CORS.');
            }
        }
        
        console.error('Erreur lors du chargement:', error);
        const loadingEl = document.getElementById('loading');
        loadingEl.textContent = error.message || 'Erreur lors du chargement des données.';
        loadingEl.style.color = '#e74c3c';
        loadingEl.style.padding = '2rem';
        loadingEl.style.whiteSpace = 'pre-line';
    }
}

// Afficher la newsletter
function renderNewsletter() {
    if (!newsletterData) return;
    
    renderDate();
    renderAgenda();
    renderMembers();
    renderGallery();
}

// Afficher la date
function renderDate() {
    const dateContainer = document.querySelector('#newsletter .newsletter-date');
    if (newsletterData.date && dateContainer) {
        const date = new Date(newsletterData.date);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        dateContainer.textContent = formattedDate;
    }
}

// Afficher l'agenda
function renderAgenda() {
    const agendaContainer = document.querySelector('#newsletter .newsletter-agenda');
    const template = document.getElementById('template-agenda-item');
    
    if (!agendaContainer || !template) return;
    
    if (!newsletterData.agenda || typeof newsletterData.agenda !== 'object') {
        return;
    }
    
    // Convertir l'objet agenda en tableau plat avec toutes les villes
    const allEvents = [];
    Object.keys(newsletterData.agenda).forEach(city => {
        const cityEvents = newsletterData.agenda[city];
        if (Array.isArray(cityEvents)) {
            cityEvents.forEach(event => {
                allEvents.push({
                    ...event,
                    city: city
                });
            });
        }
    });
    
    // Trier par date
    const sortedAgenda = allEvents.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    
    sortedAgenda.forEach(item => {
        const agendaItem = template.content.cloneNode(true);
        
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        agendaItem.querySelector('.agenda-item-date').textContent = formattedDate;
        
        const eventContainer = agendaItem.querySelector('.agenda-item-event');
        
        // event est maintenant une chaîne, pas un objet
        const eventText = item.event || '';
        eventContainer.querySelector('.event-title').textContent = eventText;
        
        // Pas de description dans la nouvelle structure
        eventContainer.querySelector('.event-description').remove();
        
        // Pas de lien dans la nouvelle structure
        const linkEl = eventContainer.querySelector('.event-link');
        const linkContainer = eventContainer.querySelector('.event-link-container');
        linkEl.textContent = '';
        linkEl.href = '';
        if (linkContainer && linkContainer.firstElementChild) {
            linkContainer.firstElementChild.style.display = 'none';
        }
        
        // La ville est maintenant dans item.city
        if (item.city) {
            eventContainer.querySelector('.event-location').textContent = item.city;
        } else {
            eventContainer.querySelector('.event-location').remove();
        }
        
        agendaContainer.appendChild(agendaItem);
    });
}

// Afficher les membres (trouvailles)
function renderMembers() {
    const membersContainer = document.querySelector('#newsletter .newsletter-members');
    const memberTemplate = document.getElementById('template-member');
    const contributionTemplate = document.getElementById('template-contribution');
    
    if (!membersContainer || !memberTemplate || !contributionTemplate) return;
    
    // La nouvelle structure utilise "trouvailles" au lieu de "members"
    const trouvailles = newsletterData.trouvailles || newsletterData.members;
    
    if (!trouvailles || typeof trouvailles !== 'object') {
        return;
    }
    
    // Convertir l'objet trouvailles en tableau
    Object.keys(trouvailles).forEach(memberName => {
        const memberCard = memberTemplate.content.cloneNode(true);
        memberCard.querySelector('.member-name').textContent = memberName;
        
        const contributionsContainer = memberCard.querySelector('.member-contributions');
        const contributions = trouvailles[memberName];
        
        if (Array.isArray(contributions)) {
            contributions.forEach(contribution => {
                const contributionCard = contributionTemplate.content.cloneNode(true);
                
                // Pas de type dans la nouvelle structure
                contributionCard.querySelector('.contribution-type').remove();
                
                if (contribution.title) {
                    contributionCard.querySelector('.contribution-title').textContent = contribution.title;
                } else {
                    contributionCard.querySelector('.contribution-title').remove();
                }
                
                // Pas de description dans la nouvelle structure
                contributionCard.querySelector('.contribution-description').remove();
                
                if (contribution.link) {
                    const linkEl = contributionCard.querySelector('.contribution-link');
                    linkEl.href = contribution.link;
                    linkEl.target = '_blank';
                    linkEl.rel = 'noopener';
                    // Insérer le SVG au lieu du texte (avec couleur primaire)
                    linkEl.innerHTML = `<svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#f51e9fcd"><path d="M21 3L15 3M21 3L12 12M21 3V9" stroke="#f51e9f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H11" stroke="#f51e9f" stroke-width="1.5" stroke-linecap="round"></path></svg>`;
                } else {
                    contributionCard.querySelector('.contribution-link').remove();
                }
                
                // Pas de location dans la nouvelle structure
                contributionCard.querySelector('.contribution-location').remove();
                
                contributionsContainer.appendChild(contributionCard);
            });
        }
        
        membersContainer.appendChild(memberCard);
    });
}

// Afficher la galerie
function renderGallery() {
    const galleryContainer = document.querySelector('#newsletter .newsletter-gallery');
    const template = document.getElementById('template-gallery-item');
    
    if (!galleryContainer || !template) return;
    
    if (!newsletterData.gallery || newsletterData.gallery.length === 0) {
        return;
    }
    
    newsletterData.gallery.forEach(item => {
        const galleryItem = template.content.cloneNode(true);
        
        if (item.type) {
            galleryItem.querySelector('.gallery-item-type').textContent = item.type;
        } else {
            galleryItem.querySelector('.gallery-item-type').remove();
        }
        
        if (item.url) {
            const urlEl = galleryItem.querySelector('.gallery-item-url');
            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = item.url;
                img.alt = item.description || '';
                img.loading = 'lazy';
                urlEl.appendChild(img);
            } else if (item.type === 'video') {
                const videoId = extractYouTubeId(item.url);
                if (videoId) {
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}`;
                    iframe.frameBorder = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    urlEl.appendChild(iframe);
                } else {
                    const link = document.createElement('a');
                    link.href = item.url;
                    link.textContent = item.url;
                    link.target = '_blank';
                    link.rel = 'noopener';
                    urlEl.appendChild(link);
                }
            } else {
                urlEl.textContent = item.url;
            }
        } else {
            galleryItem.querySelector('.gallery-item-url').remove();
        }
        
        if (item.description) {
            galleryItem.querySelector('.gallery-item-description').textContent = item.description;
        } else {
            galleryItem.querySelector('.gallery-item-description').remove();
        }
        
        galleryContainer.appendChild(galleryItem);
    });
}

// Extraire l'ID d'une URL YouTube
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
